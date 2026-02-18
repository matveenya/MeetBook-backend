import * as dotenv from 'dotenv';
dotenv.config();
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { authController } from './controllers/auth.controller';
import { meetingController } from './controllers/meeting.controller';
import { userService } from './services/user.service';
import { authenticateToken } from './middlewares/auth.middleware';
import { agoraController } from './controllers/agora.controller';

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
app.post('/auth/google', authController.googleLogin);
app.post('/auth/register', authController.register);
app.post('/auth/logout', authController.logout);
app.post('/auth/refresh', authController.refresh);
app.get('/api/users', authenticateToken, authController.getAllUsers);
app.post('/api/meetings', authenticateToken, meetingController.createMeeting);
app.get('/api/meetings', authenticateToken, meetingController.getAllMeetings);
app.patch('/api/meetings/:id', authenticateToken, meetingController.updateMeeting);
app.delete('/api/meetings/:id', authenticateToken, meetingController.deleteMeeting);
app.get('/api/agora/token', authenticateToken, agoraController.generateToken);

app.get('/auth/user', authenticateToken, async (req, res) => {
  try {
    const user = await userService.findById((req as any).user.id);
    res.json({ status: 'success', data: user });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/', (req, res) => {
  res.send('MeetBook backend run');
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Внутренняя ошибка сервера';

  console.error(`[${new Date().toISOString()}] ERROR ${statusCode}: ${message}`);
  if (statusCode === 500) {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    status: 'error',
    message: message
  });
});

app.listen(port, () => console.log(`🚀 Server ready: http://localhost:${port}`));

app.get('/', (req, res) => {
  res.send('MeetBook backend run');
});