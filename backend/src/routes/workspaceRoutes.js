import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { createWorkspace, getWorkspaces, inviteMember } from '../controllers/workspaceController.js';

const router = express.Router();

router.post('/',                    protect, createWorkspace);
router.get('/',                     protect, getWorkspaces);
router.post('/:id/invite',          protect, inviteMember);

export default router;