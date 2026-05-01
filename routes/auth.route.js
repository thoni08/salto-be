import express from 'express';
import { Login, Register } from "../controllers/auth.controller.js";
import verifyToken from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post('/login', Login);
router.post('/register', Register);

router.get('/profile', verifyToken, (req, res) => {
  res.json({ message: "Kamu berhasil masuk rute rahasia", user: req.user });
});

export default router;