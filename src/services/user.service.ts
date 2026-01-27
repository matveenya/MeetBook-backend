import { Pool } from 'pg';
import bcrypt from 'bcrypt';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const userService = {
  async findByEmail(email: string) {
    const result = await pool.query('SELECT * FROM "User" WHERE email = $1', [email]);
    return result.rows[0];
  },

  async findById(id: number) {
    const result = await pool.query('SELECT id, email, name FROM "User" WHERE id = $1', [id]);
    return result.rows[0];
  },

  async createUser(email: string, pass: string, name: string) {
    const hashedPassword = await bcrypt.hash(pass, 10);
    const result = await pool.query(
      'INSERT INTO "User" (email, password, name) VALUES ($1, $2, $3) RETURNING id, email, name',
      [email, hashedPassword, name]
    );
    return result.rows[0];
  },

  async comparePassword(plain: string, hashed: string) {
    return bcrypt.compare(plain, hashed);
  }
};