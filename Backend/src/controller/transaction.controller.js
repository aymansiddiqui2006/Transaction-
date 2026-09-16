import mongoose from "mongoose";
import { Account } from "../models/Account.model.js";
import { Transaction } from "../models/Transaction.model.js";
import ApiError from "../utils/ApiError.js";
import ApiRes from "../utils/ApiRes.js";
import AssyncHandler from "../utils/AssyncHandler.js";
import { Ledger } from "../models/Ledger.model.js";
import { sendTransactionEmail } from "../service/email.service.js";

const createTransaction = AssyncHandler(async (req, res) => {
  const { fromAccount, toAccount, amount, idempotencyKey } = req.body;

  if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
    throw new ApiError(400, "All fields are required!! ");
  }

  const FromAccount = await Account.findOne({ _id: fromAccount });
  const ToAccount = await Account.findOne({ _id: toAccount });

  if (!FromAccount) {
    throw new ApiError(400, "Invalid from Account");
  }

  if (!ToAccount) {
    throw new ApiError(400, "Invalid To Account");
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

  let transaction;

  try {
    const session = await mongoose.startSession();
    session.startTransaction();

    transaction = (
      await Transaction.create(
        [
          {
            fromAccount,
            toAccount,
            amount,
            idempotencyKey,
            status: "pending",
          },
        ],
        { session },
      )
    )[0];

    const debitEntry = await Ledger.create(
      [
        {
          account: fromAccount,
          amount: amount,
          transaction: transaction._id,
          type: "DEBIT",
        },
      ],
      { session },
    );

    await (() => {
      return new Promise((resolve) => setTimeout(resolve, 15 * 1000));
    })();

    const creditEntry = await Ledger.create(
      [
        {
          account: toAccount,
          amount: amount,
          type: "CREDIT",
          transaction: transaction._id,
        },
      ],
      { session },
    );
    await Transaction.findOneAndUpdate(
      { _id: transaction._id },
      { status: "complete" },
      { session },
    );

    await session.commitTransaction();
    session.endSession();
  } catch (error) {
    return res
      .status(400)
      .json(
        new ApiRes(
          400,
          "Transaction is Pending due to some issue, please retry after sometime",
        ),
      );
  }

  await sendTransactionEmail(
    req.user.email,
    req.user.fullname,
    amount,
    toAccount,
  );

  return res
    .status(200)
    .json(new ApiRes(200, "Transaction completed successfully"));
});

const createInitialFundsTransaction = AssyncHandler(async (req, res) => {
  const { toAccount, amount, idempotencyKey } = req.body;

  if (!toAccount || !amount || !idempotencyKey) {
    throw new ApiError(400, "All fields are required!! ");
  }

  const ToAccount = await Account.findOne({ _id: toAccount });

  if (!ToAccount) {
    throw new ApiError(400, "Invalid toAccount");
  }

  const FromAccount = await Account.findOne({
    user: req.user._id,
  });
  if (!FromAccount) {
    throw new ApiError(400, "Invalid System Account");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  const transaction = new Transaction({
    fromAccount: FromAccount,
    toAccount,
    amount,
    idempotencyKey,
    status: "pending",
  });

  const debitLedgerEntry = await Ledger.create(
    [
      {
        account: FromAccount._id,
        amount: amount,
        transaction: transaction._id,
        type: "DEBIT",
      },
    ],
    { session },
  );

  const creditLedgerEntry = await Ledger.create(
    [
      {
        account: toAccount,
        amount: amount,
        transaction: transaction._id,
        type: "CREDIT",
      },
    ],
    { session },
  );

  transaction.status = "complete";
  await transaction.save({ session });

  await session.commitTransaction();
  session.endSession();

  return res
    .status(201)
    .json(
      new ApiRes(
        201,
        transaction,
        "Initial funds transaction completed successfully",
      ),
    );
});

export { createTransaction, createInitialFundsTransaction };
