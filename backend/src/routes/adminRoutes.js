import express from 'express';
import {
  getAllUsers,
  getAllAnalyses,
  getActivities,
  getDashboardStats,
  getStats,
  deleteUser,
  updateUserRole,
} from '../controllers/adminController.js';

const router = express.Router();

// All routes here are already protected by protect + isAdmin in app.js

router.get('/users',            getAllUsers);
router.get('/analyses',         getAllAnalyses);
router.get('/activities',       getActivities);
router.get('/dashboard-stats',  getDashboardStats);
router.get('/stats',            getStats);           // legacy alias

router.delete('/user/:id',      deleteUser);
router.put('/user/:id/role',    updateUserRole);

export default router;