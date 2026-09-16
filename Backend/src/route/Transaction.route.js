import Router from 'express'
import { createInitialFundsTransaction, createTransaction } from '../controller/transaction.controller.js';
import { verifyJWT, verifySystem } from '../Middleware/Auth.middleware.js';

const router=Router();

router.post('/',verifyJWT,createTransaction)
router.post("/initial-funds",verifySystem,createInitialFundsTransaction)


export default router;