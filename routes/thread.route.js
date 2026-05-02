import express from 'express';
import auth from '../middlewares/auth.middleware.js';
import * as threadController from '../controllers/thread.controller.js';

const router = express.Router();

router.get('/', threadController.getThreads);
router.post('/', auth, threadController.createThread);

router.get('/:id', threadController.getThreadById);
router.patch('/:id', auth, threadController.updateThread);
router.delete('/:id', auth, threadController.deleteThread);

router.patch('/:id/save', auth, threadController.saveThread);
router.delete('/:id/save', auth, threadController.unsaveThread);

router.get('/:id/comments', threadController.getThreadComments);
router.post('/:id/comments', auth, threadController.createThreadComment);

router.get('/:id/related', threadController.getRelatedThreads);

export default router;
