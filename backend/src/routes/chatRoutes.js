import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { chatFollowup } from '../controllers/chatController.js';

const router = express.Router();

router.post('/followup', protect, chatFollowup);

export default router;