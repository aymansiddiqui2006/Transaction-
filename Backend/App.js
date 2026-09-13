import express from "express"
import dotenv from "dotenv"
import cookieParser from "cookie-parser";
import AuthRouter from "./src/route/Auth.router.js"

const app=express();

dotenv.config({
    path:"./.env"
})

app.use(express.json());
app.use(cookieParser());

app.use("/api/v1/user/auth",AuthRouter)


export default app;