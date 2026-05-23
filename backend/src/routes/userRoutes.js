import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getUserProfile,
  updateUserProfile,
  deleteUserProfile,
  updateUserPreferences,
  updateUserRules,
  getUserSettings,
  generateDevToken,
  uploadAvatar,
} from '../controllers/userController.js';

const router = express.Router();

// Profile
router.get('/profile',     protect, getUserProfile);
router.put('/profile',     protect, updateUserProfile);
router.delete('/profile',  protect, deleteUserProfile);

// Preferences
router.put('/preferences', protect, updateUserPreferences);

// Custom Rules
router.put('/rules',       protect, updateUserRules);

// Combined settings (rules + preferences)
router.get('/settings',    protect, getUserSettings);

// VS Code developer token
router.post('/dev-token',  protect, generateDevToken);

// Avatar upload
router.post('/avatar',     protect, uploadAvatar);

export default router;
