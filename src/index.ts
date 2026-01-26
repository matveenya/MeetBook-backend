import * as dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const app = express();
const port = process.env.PORT || 3001;
const jwtSecret = process.env.JWT_SECRET || 'fallback-secret';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.use(cors());
app.use(express.json());

app.post('/auth/register', async (req, res) => {
  const { email, password, fullName } = req.body; 
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await pool.query(
      'INSERT INTO "User" (email, password, name) VALUES ($1, $2, $3) RETURNING id, email, name',
      [email, hashedPassword, fullName]
    );
    
    res.status(201).json({ status: 'success', user: result.rows[0] });
  } catch (error) {
    console.error('Ошибка БД:', error); 
    res.status(500).json({ error: 'Ошибка при регистрации в базе данных' });
  }
});

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await pool.query('SELECT * FROM "User" WHERE email = $1', [email]);
    if (user.rows.length === 0) return res.status(404).json({ error: 'Пользователь не найден' });

    const isMatch = await bcrypt.compare(password, user.rows[0].password);
    if (!isMatch) return res.status(401).json({ error: 'Неверный пароль' });

    const token = jwt.sign({ id: user.rows[0].id }, jwtSecret, { expiresIn: '1h' });
    res.json({ token, user: user.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/users', async (req, res) => {
  const result = await pool.query('SELECT * FROM "User"');
  res.json(result.rows);
});

app.listen(port, () => {
  console.log(`🚀 Сервер готов: http://localhost:${port}`);
});

app.get('/', (req, res) => {
  res.send('Бэкенд MeetBook запущен');
});