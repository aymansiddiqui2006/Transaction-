import "dotenv/config";
import express from "express"

import cookieParser from "cookie-parser";
import AuthRouter from "./src/route/Auth.router.js"
import AccountRouter from "./src/route/Acc.route.js"
import TransactionRouter from "./src/route/Transaction.route.js"
import LedgerRouter from "./src/route/Ledger.router.js"

const app=express();



app.use(express.json());
app.use(cookieParser());

app.use("/api/v1/user/auth",AuthRouter)
app.use("/api/v1/user/account",AccountRouter)
app.use("/api/v1/user/ledger",LedgerRouter)
app.use("/api/v1/user/transaction",TransactionRouter)


export default app;