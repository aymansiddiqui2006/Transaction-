import { Account } from "../models/Account.model.js";
import ApiError from "../utils/ApiError.js";
import ApiRes from "../utils/ApiRes.js";
import AssyncHandler from "../utils/AssyncHandler.js";

const createAccount = AssyncHandler(async (req, res) => {
  const user = req.user;

  const account = await Account.create({
    user: user._id,
  });

  res.status(201).json(new ApiRes(201, account, "Account created"));
});

const getAccount = AssyncHandler(async (req, res) => {
  const account = await Account.find({
    user: req.user._id,
  });

  if (!account) {
    throw new ApiError(400, "account not found");
  }

  res.status(200).json(new ApiRes(200, account, "Account found"));
});

const getBalance = AssyncHandler(async (req, res) => {
  const { accountId } = req.params;

  const account = await Account.findOne({
    _id: accountId,
    user: req.user._id,
  });

  if (!account) {
    throw new ApiError(401, "account not found");
  }

  const balance =await  account.getBalance();

  res.status(200).json(new ApiRes(200, { balance } , "balance fatched"));
});

export { createAccount, getAccount, getBalance };
