import mongoose from "mongoose";

const transactionSchema = mongoose.Schema(
  {
    fromAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      require: true,
      index: true,
    },
    toAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      require: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["complete", "pending", "failed", "reversed"],
      default: "pending",
    },
    amount: {
      type: Number,
      default: 0,
      require: true,
    },
    idempotencyKey: {
      type: String,
      require: true,
      index: true,
      unique: true,
    },
  },
  { timestamps: true },
);


export const Transaction= mongoose.model("Transaction",transactionSchema)
