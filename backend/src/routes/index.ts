import { Router } from 'express';
import authModule from '../modules/auth';
import workspaceModule from '../modules/workspace';
import projectsModule from '../modules/projects';
import meetingsModule from '../modules/meetings';
import tasksModule from '../modules/tasks';
import aiModule from '../modules/ai';
import activityModule from '../modules/activity';
import notificationsModule from '../modules/notifications';
import adminModule from '../modules/admin';
import dashboardModule from '../modules/dashboard';
import filesModule from '../modules/files';
import exportModule from '../modules/export';

const router = Router();

router.use('/auth', authModule);
router.use('/workspace', workspaceModule);
router.use('/workspaces', workspaceModule);
router.use('/projects', projectsModule);
router.use('/meetings', meetingsModule);
router.use('/tasks', tasksModule);
router.use('/ai', aiModule);
router.use('/activity-logs', activityModule);
router.use('/notifications', notificationsModule);
router.use('/dashboard', dashboardModule);
router.use('/files', filesModule);
router.use('/export', exportModule);
router.use('/admin', adminModule);

export default router;
