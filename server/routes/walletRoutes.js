import express from 'express';
import { getBalance, addMoney, cashOut } from '../controllers/walletController.js';
import protect from '../middleware/auth.js';

const router = express.Router();
router.get('/balance', protect, getBalance);
router.post('/add-money', protect, addMoney);
router.post('/cash-out', protect, cashOut);
export default router;
