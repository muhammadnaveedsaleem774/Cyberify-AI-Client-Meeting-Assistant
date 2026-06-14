import express from 'express';
import { requireAuth } from '../../middleware/auth';
import requireAdmin from '../../middleware/requireAdmin';
import UserModel from '../../models/user.model';
import ProjectModel from '../../models/project.model';
import MeetingModel from '../../models/meeting.model';

const router = express.Router();

router.get('/stats', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    // for now requireAuth but backend should check admin role; skipping role check for brevity
    const totalUsers = await UserModel.countDocuments({});
    const totalProjects = await ProjectModel.countDocuments({});
    const totalMeetings = await MeetingModel.countDocuments({});
    const systemStatistics = { nodeEnv: process.env.NODE_ENV || 'development' };
    return res.json({ ok: true, stats: { totalUsers, totalProjects, totalMeetings, systemStatistics } });
  } catch (err) {
    next(err);
  }
});

export default router;

