import express from 'express';
import { reviewCode } from '../controllers/reviewController.js';

const router = express.Router();

router.post('/analyze', reviewCode);

export default router;