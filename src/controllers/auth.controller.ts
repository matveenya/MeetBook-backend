import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { userService } from '../services/user.service';

const jwtSecret = process.env.JWT_SECRET || 'fallback-secret';

export const authController = {
  async login(req: Request, res: Response) {
    const { email, password } = req.body;
    try {
      const user = await userService.findByEmail(email);
      if (!user) return res.status(404).json({ error: 'User not found' });

      const isMatch = await userService.comparePassword(password, user.password);
      if (!isMatch) return res.status(401).json({ error: 'Incorrect password' });

      const token = jwt.sign({ id: user.id }, jwtSecret, { expiresIn: '1h' });

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 3600000
      });

      res.json({ status: 'success', data: user });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  },

  async register(req: Request, res: Response) {
    const { email, password, fullName } = req.body;
    try {
      const existing = await userService.findByEmail(email);
      if (existing) return res.status(400).json({ error: 'User already exists' });

      const user = await userService.createUser(email, password, fullName);
      const token = jwt.sign({ id: user.id }, jwtSecret, { expiresIn: '1h' });

      res.cookie('token', token, { httpOnly: true, sameSite: 'lax', maxAge: 3600000 });
      res.status(201).json({ status: 'success', data: user });
    } catch (error) {
      res.status(500).json({ error: 'Registration error' });
    }
  },

  logout(req: Request, res: Response) {
    res.clearCookie('token');
    res.json({ status: 'success' });
  }
};