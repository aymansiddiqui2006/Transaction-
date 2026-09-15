import Router from 'express'
import verifyJWT from "../Middleware/Auth.middleware.js"
import { createTransaction } from '../controller/transaction.controller.js';

const router=Router();

router.post('/',verifyJWT,createTransaction)


export default router;