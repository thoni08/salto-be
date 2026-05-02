import express from 'express';
import { getHomeStats } from '../controllers/home.controller.js';

const router = express.Router();

router.get('/', getHomeStats);

export default router;
