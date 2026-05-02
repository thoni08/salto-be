import express from 'express';
import auth from '../middlewares/auth.middleware.js';
import * as threadController from '../controllers/thread.controller.js';

const router = express.Router();

router.patch('/:commentId/best-answer', auth, threadController.setBestAnswer);
router.patch('/:commentId/like', auth, threadController.likeComment);
router.delete('/:commentId', auth, threadController.deleteComment);
router.delete('/:commentId/like', auth, threadController.unlikeComment);

export default router;
