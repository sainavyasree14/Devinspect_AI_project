import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getAnalyses, deleteAnalysis, toggleBookmark } from '../controllers/analysisController.js';

const router = express.Router();

router.get('/',               protect, getAnalyses);
router.delete('/:id',         protect, deleteAnalysis);
router.put('/:id/bookmark',   protect, toggleBookmark);

export default router;