import express from 'express';
import { recharge } from '../controllers/rechargeController.js';
import protect from '../middleware/auth.js';

const router = express.Router();
router.post('/', protect, recharge);
export default router;
