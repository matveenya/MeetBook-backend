import { Request, Response } from 'express';
import { RtcTokenBuilder, RtcRole } from 'agora-access-token';
import { catchAsync } from '../utils/errors';

export const agoraController = {
  generateToken: catchAsync(async (req: Request, res: Response) => {
    const appId = process.env.AGORA_APP_ID!;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE!;
    const channelName = req.query.channelName as string;

    if (!channelName) {
      return res.status(400).json({ error: 'Channel name is required' });
    }

    const uid = (req as any).user.id;
    const role = RtcRole.PUBLISHER;
    const expirationTimeInSeconds = 3600;
    const privilegeExpiredTs = Math.floor(Date.now() / 1000) + expirationTimeInSeconds;

    const token = RtcTokenBuilder.buildTokenWithUid(
      appId, 
      appCertificate, 
      channelName, 
      uid, 
      role, 
      privilegeExpiredTs
    );

    res.json({ token, uid, appId });
  })
};