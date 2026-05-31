import express from 'express';
import { sendMoney, requestMoney, getHistory } from '../controllers/transferController.js';
import protect from '../middleware/auth.js';

const router = express.Router();
router.post('/send', protect, sendMoney);
router.post('/request', protect, requestMoney);
router.get('/history', protect, getHistory);
export default router;
