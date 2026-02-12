import { Request, Response } from 'express';
import { meetingService } from '../services/meeting.service';
import { catchAsync, AppError } from '../utils/errors';

export const meetingController = {
  createMeeting: catchAsync(async (req: Request, res: Response) => {
    const { title, start, end, userId } = req.body;

    if (!title || !start || !end) {
      throw new AppError('Name and time required', 400);
    }

    const meeting = await meetingService.create({
      title,
      start,
      end,
      userId: userId || (req as any).user.id
    });

    res.status(201).json({
      status: 'success',
      data: meeting
    });
  }),

  getAllMeetings: catchAsync(async (req: Request, res: Response) => {
    const meetings = await meetingService.findAll();
    
    res.json({
      status: 'success',
      data: meetings
    });
  })
};