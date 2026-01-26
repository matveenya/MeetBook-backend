import * as dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';

const app = express();
const port = process.env.PORT || 3001;
const jwtSecret = process.env.JWT_SECRET || 'fallback-secret';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,            
  exposedHeaders: ['set-cookie']
}));

app.use(express.json());
app.use(cookieParser());

const authenticateToken = (req: any, res: any, next: any) => {
  const token = req.cookies.token; 

  if (!token) return res.status(401).json({ error: 'No token' });

  jwt.verify(token, jwtSecret, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: 'Incorrect token' });
    req.user = user;
    next();
  });
};

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const userResult = await pool.query('SELECT * FROM "User" WHERE email = $1', [email]);
    if (userResult.rows.length === 0) return res.status(404).json({ error: 'User not found' });

    const user = userResult.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Incorrect password' });

    const token = jwt.sign({ id: user.id }, jwtSecret, { expiresIn: '1h' });

    res.cookie('token', token, {
      httpOnly: true,     
      secure: false,      
      sameSite: 'lax',   
      maxAge: 3600000   
    });

    res.json({ 
      status: 'success', 
      data: user 
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ status: 'success' });
});

app.get('/auth/user', authenticateToken, async (req: any, res: any) => {
  try {
    const user = await pool.query('SELECT id, email, name FROM "User" WHERE id = $1', [req.user.id]);
    res.json({ status: 'success', data: user.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/auth/register', async (req, res) => {
  const { email, password, fullName } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO "User" (email, password, name) VALUES ($1, $2, $3) RETURNING id, email, name',
      [email, hashedPassword, fullName]
    );
    
    const user = result.rows[0];

    const token = jwt.sign({ id: user.id }, jwtSecret, { expiresIn: '1h' });

    res.cookie('token', token, {
      httpOnly: true,     
      secure: false,    
      sameSite: 'lax',   
      maxAge: 3600000
    });

    res.status(201).json({ 
      status: 'success', 
      data: user 
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration error' });
  }
});

app.listen(port, () => console.log(`🚀 Server ready: http://localhost:${port}`));

app.get('/', (req, res) => {
  res.send('MeetBook backend run');
});