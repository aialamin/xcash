import express from 'express';
import { openSavings, getSavings, depositSavings, applyLoan, getLoan } from '../controllers/financialController.js';
import protect from '../middleware/auth.js';

const router = express.Router();
router.post('/savings', protect, openSavings);
router.get('/savings', protect, getSavings);
router.post('/savings/deposit', protect, depositSavings);
router.post('/loan', protect, applyLoan);
router.get('/loan', protect, getLoan);
export default router;
