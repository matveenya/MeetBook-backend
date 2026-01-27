import * as dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { authController } from './controllers/auth.controller';
import { userService } from './services/user.service';
import { authenticateToken } from './middlewares/auth.middleware';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  exposedHeaders: ['set-cookie']
}));

app.use(express.json());
app.use(cookieParser());

app.post('/auth/login', authController.login);
app.post('/auth/register', authController.register);
app.post('/auth/logout', authController.logout);

app.get('/auth/user', authenticateToken, async (req, res) => {
  try {
    const user = await userService.findById((req as any).user.id);
    res.json({ status: 'success', data: user });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(port, () => console.log(`🚀 Server ready: http://localhost:${port}`));

app.get('/', (req, res) => {
  res.send('MeetBook backend run');
});