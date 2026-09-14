import "dotenv/config";
import express from "express"

import cookieParser from "cookie-parser";
import AuthRouter from "./src/route/Auth.router.js"

const app=express();



app.use(express.json());
app.use(cookieParser());

app.use("/api/v1/user/auth",AuthRouter)


export default app;