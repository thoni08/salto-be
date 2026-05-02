import express from 'express';
import verifyToken from '../middlewares/auth.middleware.js';
import {
  CreateUser,
  DeleteUser,
  GetUser,
  GetUsers,
  UpdateUser,
  FollowUser,
  UnfollowUser,
  IsFollowing,
  GetTopAlumni,
} from '../controllers/user.controller.js';

const router = express.Router();

// General user routes
router.get('/users', verifyToken, GetUsers);
router.get('/users/top-alumni', verifyToken, GetTopAlumni);
router.get('/user', verifyToken, GetUser);

// Follow routes
router.post('/user/follow', verifyToken, FollowUser);
router.post('/user/unfollow', verifyToken, UnfollowUser);
router.get('/user/:id/is-following', verifyToken, IsFollowing);

// User CRUD with ID - less specific, should come last
router.get('/user/:id', verifyToken, GetUser);
router.post('/user', verifyToken, CreateUser);
router.patch('/user', verifyToken, UpdateUser);
router.patch('/user/:id', verifyToken, UpdateUser);
router.delete('/user/:id', verifyToken, DeleteUser);

export default router;
