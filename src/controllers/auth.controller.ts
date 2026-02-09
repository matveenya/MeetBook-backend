import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { userService } from '../services/user.service';
import { registerSchema, loginSchema } from '../utils/schemas';
import { AppError, catchAsync } from '../utils/errors';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access-secret-key';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh-secret-key';

const cookieOptions: any = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  path: '/',
};

export const authController = {
  login: catchAsync(async (req: Request, res: Response) => {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      throw new AppError(validation.error.issues[0].message, 400);
    }

    const { email, password } = validation.data;
    const user = await userService.findByEmail(email);

    if (!user || !(await userService.comparePassword(password, user.password))) {
      throw new AppError('Incorrect password or email', 401);
    }

    const accessToken = jwt.sign({ id: user.id }, ACCESS_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: user.id }, REFRESH_SECRET, { expiresIn: '7d' });

    res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
    res.cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

    res.json({ 
      status: 'success', 
      data: { id: user.id, email: user.email, name: user.name } 
    });
  }),

  googleLogin: catchAsync(async (req: Request, res: Response) => {
    const { code } = req.body;
    if (!code) throw new AppError('Code is missing', 400);

    const { tokens } = await client.getToken({
      code,
      redirect_uri: 'http://localhost:5173/login/google',
    });

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) throw new AppError('Invalid Google token', 400);

    let user = await userService.findByEmail(payload.email);
    if (!user) {
      user = await userService.createUser(payload.email, Math.random().toString(36), payload.name || 'Google User');
    }

    const accessToken = jwt.sign({ id: user.id }, ACCESS_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: user.id }, REFRESH_SECRET, { expiresIn: '7d' });

    res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
    res.cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

    res.json({ 
      status: 'success', 
      data: { id: user.id, email: user.email, name: user.name } 
    });
  }),

  register: catchAsync(async (req: Request, res: Response) => {
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      throw new AppError(validation.error.issues[0].message, 400);
    }

    const { email, password, fullName } = validation.data;
    const existing = await userService.findByEmail(email);
    if (existing) throw new AppError('User already exists', 400);

    const user = await userService.createUser(email, password, fullName);
    
    const accessToken = jwt.sign({ id: user.id }, ACCESS_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: user.id }, REFRESH_SECRET, { expiresIn: '7d' });

    res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
    res.cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

    res.status(201).json({ status: 'success', data: user });
  }),

  refresh: catchAsync(async (req: Request, res: Response) => {
    const { refreshToken } = req.cookies;
    if (!refreshToken) throw new AppError('Refresh token missing', 401);

    try {
      const decoded = jwt.verify(refreshToken, REFRESH_SECRET) as { id: number };
      const user = await userService.findById(decoded.id);
      if (!user) throw new AppError('User not found', 401);

      const newAccessToken = jwt.sign({ id: user.id }, ACCESS_SECRET, { expiresIn: '15m' });
      const newRefreshToken = jwt.sign({ id: user.id }, REFRESH_SECRET, { expiresIn: '7d' });
      
      res.cookie('accessToken', newAccessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
      res.cookie('refreshToken', newRefreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

      res.json({ status: 'success' });
    } catch (err) {
      throw new AppError('Invalid refresh token', 403);
    }
  }),

  getAllUsers: catchAsync(async (req: Request, res: Response) => {
    const users = await userService.findAll(); 
    res.json({ 
      status: 'success', 
      data: users 
    });
  }),

  logout: (req: Request, res: Response) => {
    res.clearCookie('accessToken', cookieOptions);
    res.clearCookie('refreshToken', cookieOptions);
    res.json({ status: 'success' });
  }
};