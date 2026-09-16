import { Router } from "express";
import { createAccount, getAccount,getBalance } from "../controller/account.controller.js";
import { verifyJWT } from "../Middleware/Auth.middleware.js";

const router = Router();


router.post("/",verifyJWT,createAccount);

router.get("/",verifyJWT,getAccount)

router.get("/balance/:accountId",verifyJWT,getBalance)


export default router;