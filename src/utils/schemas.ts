import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Incorrect email format'),
  password: z.string().min(6, 'The password must be at least 6 characters long.'),
  fullName: z.string().min(4, 'The name must be at least 4 characters long.'),
});

export const loginSchema = z.object({
  email: z.string().email('Incorrect email format'),
  password: z.string().min(1, 'Password required'),
});