import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { userService } from '../services/user.service';
import { registerSchema, loginSchema } from '../utils/schemas';
import { AppError, catchAsync } from '../utils/errors';

const jwtSecret = process.env.JWT_SECRET || 'fallback-secret';

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

    const token = jwt.sign({ id: user.id }, jwtSecret, { expiresIn: '1h' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600000,
    });

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
    if (existing) {
      throw new AppError('User already exists', 400);
    }

    const user = await userService.createUser(email, password, fullName);
    const token = jwt.sign({ id: user.id }, jwtSecret, { expiresIn: '1h' });

    res.cookie('token', token, { 
      httpOnly: true, 
      sameSite: 'lax', 
      maxAge: 3600000 
    });

    res.status(201).json({ status: 'success', data: user });
  }),

  logout: (req: Request, res: Response) => {
    res.clearCookie('token');
    res.json({ status: 'success' });
  }
};