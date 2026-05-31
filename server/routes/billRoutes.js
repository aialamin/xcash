import express from 'express';
import { payBill } from '../controllers/billController.js';
import protect from '../middleware/auth.js';

const router = express.Router();
router.post('/pay', protect, payBill);
export default router;
