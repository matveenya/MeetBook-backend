import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const meetingService = {
  async create({ title, start, end, userId, invitedIds }: 
    { title: string; start: string; end: string; userId: number; invitedIds: number[] }) {
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const mainResult = await client.query(
        'INSERT INTO "Meeting" (title, start_time, end_time, user_id) VALUES ($1, $2, $3, $4) RETURNING id, title, start_time as "start", end_time as "end", user_id as "resourceId"',
        [title, start, end, userId]
      );
      const meeting = mainResult.rows[0];

      if (invitedIds && invitedIds.length > 0) {
        for (const id of invitedIds) {
          if (Number(id) === userId) continue; 
          
          await client.query(
            'INSERT INTO "Meeting" (title, start_time, end_time, user_id) VALUES ($1, $2, $3, $4)',
            [title, start, end, id]
          );
        }
      }

      await client.query('COMMIT');
      return meeting;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  },

  async findAll() {
    const result = await pool.query(
      'SELECT id, title, start_time as "start", end_time as "end", user_id as "resourceId" FROM "Meeting"'
    );
    return result.rows;
  }
};