import express from 'express';
import { getNotifications, markRead, markAllRead } from '../controllers/notificationController.js';
import protect from '../middleware/auth.js';

const router = express.Router();
router.get('/', protect, getNotifications);
router.patch('/:id/read', protect, markRead);
router.patch('/read-all', protect, markAllRead);
export default router;
