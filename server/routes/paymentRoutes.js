import express from 'express';
import { merchantPay, getReceipt } from '../controllers/paymentController.js';
import protect from '../middleware/auth.js';

const router = express.Router();
router.post('/merchant', protect, merchantPay);
router.get('/receipt/:id', protect, getReceipt);
export default router;
