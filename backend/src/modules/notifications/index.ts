import express from 'express';
import { requireAuth } from '../../middleware/auth';
import { subscribe } from '../../services/notificationsService';
import { verifyToken } from '../../utils/jwt';

const router = express.Router();

router.get('/subscribe', (req, res, next) => {
  const queryToken = typeof req.query.token === 'string' ? req.query.token : undefined;
  if (queryToken && !req.headers.authorization) {
    try {
      const payload = verifyToken(queryToken);
      const userId = payload.userId && String(payload.userId);
      const workspaceId = payload.workspaceId && String(payload.workspaceId);
      if (!userId || !workspaceId) return res.status(401).json({ ok: false, message: 'Invalid token payload' });
      req.user = { id: userId, workspaceId };
      return next();
    } catch {
      return res.status(401).json({ ok: false, message: 'Invalid token' });
    }
  }
  return requireAuth(req, res, next);
}, (req, res) => {
  const user = req.user as { id: string; workspaceId: string } | undefined;
  if (!user) return res.status(401).json({ ok: false, message: 'Unauthorized' });
  const headerLastEventId = req.headers['last-event-id'];
  const queryLastEventId = typeof req.query.lastEventId === 'string' ? req.query.lastEventId : undefined;
  const lastEventId = queryLastEventId || (Array.isArray(headerLastEventId) ? headerLastEventId[0] : headerLastEventId);
  subscribe(user.workspaceId, user.id, res, lastEventId);
});

export default router;

