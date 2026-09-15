import mongoose from "mongoose";
import { Account } from "../models/Account.model.js";
import { Transaction } from "../models/Transaction.model.js";
import ApiError from "../utils/ApiError.js";
import ApiRes from "../utils/ApiRes.js";
import AssyncHandler from "../utils/AssyncHandler.js";
import { Ledger } from "../models/Ledger.model.js";
import { sendTransactionEmail } from "../service/email.service.js";

const createTransaction = AssyncHandler(async (req, res) => {
  const { fromAccount, toAccount, status, amount, idempotencyKey } = req.body;

  if (!fromAccount || !toAccount || !status || !amount || !idempotencyKey) {
    throw new ApiError(400, "All fields are required!! ");
  }

  const FromAccount = await Account.findOne({ _id: fromAccount });
  const ToAccount = await Account.findOne({ _id: toAccount });

  if (!FromAccount || !ToAccount) {
    throw new ApiError(400, "Invalid Account");
  }

  const TransactionAlreadyExists = await Transaction.findOne({
    idempotencyKey: idempotencyKey,
  });

  if (TransactionAlreadyExists) {
    if (TransactionAlreadyExists.status === "complete") {
      return res
        .status(200)
        .json(new ApiRes(200, "Transaction already processed"));
    }

    if (TransactionAlreadyExists.status === "pending") {
      return res
        .status(200)
        .json(new ApiRes(200, "Transaction is still processed"));
    }

    if (TransactionAlreadyExists.status === "failed") {
      return res.status(500).json(new ApiRes(500, "Transaction is  failed"));
    }

    if (TransactionAlreadyExists.status === "reversed") {
      return res
        .status(200)
        .json(new ApiRes(200, "Transaction is  reversed. Please retry !! "));
    }
  }

  if (FromAccount.status !== "active" || ToAccount.status !== "active") {
    return res.status(400).json(new ApiRes(400, "account is not active"));
  }

  const balance = await FromAccount.getBalance();

  if (balance < amount) {
    return res
      .status(400)
      .json(
        new ApiRes(
          400,
          `account is not having saficiant balance. Cuurent balance is ${balance}`,
        ),
      );
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  const transaction = await Transaction.create(
    {
      fromAccount,
      toAccount,
      status: "pending",
      amount,
      idempotencyKey,
    },
    { session },
  );

  const debitEntry = await Ledger.create(
    {
      account: FromAccount,
      amount: amount,
      transaction: transaction._id,
      type: "DEBIT",
    },
    { session },
  );

  const creditEntry = await Ledger.create(
    {
      account: ToAccount,
      amount: amount,
      type: "CREDIT",
      transaction: transaction._id,
    },
    { session },
  );

  transaction.status = "complete";
  await transaction.save({ session });

  await session.commitTransaction();
  session.endSession();

  await sendTransactionEmail(
    req.user.email,
    req.user.fullname,
    amount,
    toAccount,
  );

  return res.status(200).json(new ApiRes(200,"Transaction completed successfully"));
});

export { createTransaction };
