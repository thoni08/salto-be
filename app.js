import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import errorHandler from './middlewares/error.middleware.js';

import testRoutes from './routes/test.route.js';
import authRoutes from './routes/auth.route.js';
import userRoutes from './routes/user.route.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running perfectly' });
});

app.use('/api/test', testRoutes);
app.use('/api', authRoutes);
app.use('/api', userRoutes);

app.use((req, res, next) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});