import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access-secret-key';

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.accessToken;

  if (!token) return res.status(401).json({ error: 'Access token missing' });

  jwt.verify(token, ACCESS_SECRET, (err: any, user: any) => {
    if (err) return res.status(401).json({ error: 'Token expired' });
    (req as any).user = user;
    next();
  });
};