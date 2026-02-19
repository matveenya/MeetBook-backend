import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const meetingService = {
  async create({ title, start, end, userId, invitedIds }: 
    { title: string; start: string; end: string; userId: number; invitedIds: number[] }) {
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const groupId = uuidv4(); 

      const mainResult = await client.query(
        'INSERT INTO "Meeting" (title, start_time, end_time, user_id, group_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, title, start_time as "start", end_time as "end", user_id as "resourceId", group_id as "groupId"',
        [title, start, end, userId, groupId]
      );
      const meeting = mainResult.rows[0];

      if (invitedIds && invitedIds.length > 0) {
        for (const id of invitedIds) {
          if (Number(id) === userId) continue; 
          
          await client.query(
            'INSERT INTO "Meeting" (title, start_time, end_time, user_id, group_id) VALUES ($1, $2, $3, $4, $5)',
            [title, start, end, id, groupId]
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

  async update(id: number, { title, invitedIds }: { title: string; invitedIds?: number[] }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
  
      const { rows } = await client.query('SELECT * FROM "Meeting" WHERE id = $1', [id]);
      const original = rows[0];
      if (!original) throw new Error('Meeting not found');
  
      await client.query('UPDATE "Meeting" SET title = $1 WHERE id = $2', [title, id]);
  
      await client.query(
        'DELETE FROM "Meeting" WHERE start_time = $1 AND end_time = $2 AND title = $3 AND id != $4',
        [original.start_time, original.end_time, original.title, id]
      );
  
      if (invitedIds && invitedIds.length > 0) {
        for (const uid of invitedIds) {
          if (Number(uid) === Number(original.user_id)) continue; 
          
          await client.query(
            'INSERT INTO "Meeting" (title, start_time, end_time, user_id) VALUES ($1, $2, $3, $4)',
            [title, original.start_time, original.end_time, uid]
          );
        }
      }
  
      await client.query('COMMIT');
      return { ...original, title };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  },

  async delete(id: number) {
    await pool.query('DELETE FROM "Meeting" WHERE id = $1', [id]);
  },

  async findAll() {
    const result = await pool.query(
      'SELECT id, title, start_time as "start", end_time as "end", user_id as "resourceId", group_id as "groupId" FROM "Meeting"'
    );
    return result.rows;
  }
};