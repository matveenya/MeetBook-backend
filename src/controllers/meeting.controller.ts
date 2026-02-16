import { Request, Response } from 'express';
import { meetingService } from '../services/meeting.service';
import { catchAsync, AppError } from '../utils/errors';

export const meetingController = {
  createMeeting: catchAsync(async (req: Request, res: Response) => {
    const { title, start, end, userId, invitedIds } = req.body;

    if (!title || !start || !end) {
      throw new AppError('Name and time required', 400);
    }

    const meeting = await meetingService.create({
      title,
      start,
      end,
      userId: Number(userId) || (req as any).user.id,
      invitedIds: invitedIds || []
    });

    res.status(201).json({
      status: 'success',
      data: meeting
    });
  }),

  updateMeeting: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { title, invitedIds } = req.body;

    const meeting = await meetingService.update(Number(id), { title, invitedIds });
    
    if (!meeting) throw new AppError('Meeting not found', 404);

    res.json({ status: 'success', data: meeting });
  }),

  deleteMeeting: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    await meetingService.delete(Number(id));
    
    res.json({ status: 'success', message: 'Meeting deleted' });
  }),

  getAllMeetings: catchAsync(async (req: Request, res: Response) => {
    const meetings = await meetingService.findAll();
    
    res.json({
      status: 'success',
      data: meetings
    });
  })
};