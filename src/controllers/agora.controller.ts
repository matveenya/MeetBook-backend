import { Request, Response } from 'express';
import { RtcTokenBuilder, RtcRole } from 'agora-access-token';
import { catchAsync, AppError } from '../utils/errors';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const agoraController = {
  generateToken: catchAsync(async (req: Request, res: Response) => {
    const channelName = req.query.channelName as string;
    const userId = (req as any).user.id;

    if (!channelName) throw new AppError('Channel name (Group ID) is required', 400);

    const checkAccess = await pool.query(
      'SELECT * FROM "Meeting" WHERE group_id = $1 AND user_id = $2',
      [channelName, userId]
    );

    if (checkAccess.rows.length === 0) {
      throw new AppError('Access Denied: You are not a participant in this meeting.', 403);
    }

    const appId = process.env.AGORA_APP_ID!;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE!;
    const role = RtcRole.PUBLISHER;
    const privilegeExpiredTs = Math.floor(Date.now() / 1000) + 3600;

    const token = RtcTokenBuilder.buildTokenWithUid(
      appId, appCertificate, channelName, userId, role, privilegeExpiredTs
    );

    res.json({ token, uid: userId, appId });
  })
};