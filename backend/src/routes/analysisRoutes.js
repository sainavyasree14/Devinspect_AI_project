import express from 'express';
import { protect } from '../middleware/authMiddleware.js';

import {
  runAnalysis,
  getAnalyses,
  deleteAnalysis,
  clearAllAnalyses,
  toggleBookmark
} from '../controllers/analysisController.js';

const router = express.Router();

router.post('/', protect, runAnalysis);
router.get('/', protect, getAnalyses);
router.delete('/', protect, clearAllAnalyses);
router.delete('/:id', protect, deleteAnalysis);
router.put('/:id/bookmark', protect, toggleBookmark);

export default router;