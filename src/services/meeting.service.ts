import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const meetingService = {
  async create({ title, start, end, userId }: { title: string; start: string; end: string; userId: number }) {
    const result = await pool.query(
      'INSERT INTO "Meeting" (title, start_time, end_time, user_id) VALUES ($1, $2, $3, $4) RETURNING id, title, start_time as "start", end_time as "end", user_id as "resourceId"',
      [title, start, end, userId]
    );
    return result.rows[0];
  },

  async findAll() {
    const result = await pool.query(
      'SELECT id, title, start_time as "start", end_time as "end", user_id as "resourceId" FROM "Meeting"'
    );
    return result.rows;
  }
};