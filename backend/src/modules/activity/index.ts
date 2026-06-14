import express from 'express';
import { requireAuth } from '../../middleware/auth';
import { listActivities } from '../../services/activityService';

const router = express.Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const user = req.user as { id: string; workspaceId: string } | undefined;
    if (!user) return res.status(401).json({ ok: false, message: 'Unauthorized' });

    const page = parseInt(String(req.query.page || '1')) || 1;
    const limit = Math.min(parseInt(String(req.query.limit || '50')) || 50, 200);
    const sort = String(req.query.sort || 'desc') as 'asc' | 'desc';
    const action = req.query.action ? String(req.query.action) : undefined;
    const entityType = req.query.entityType ? String(req.query.entityType) : undefined;
    const q = req.query.q ? String(req.query.q) : undefined;

    const result = await listActivities({ workspaceId: user.workspaceId, page, limit, sort, action, entityType, q });
    return res.json({ ok: true, data: result });
  } catch (err) {
    next(err);
  }
});

export default router;
