import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

// Simple JWT auth middleware — verifies token and attaches `user` to request.
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ ok: false, message: 'Unauthorized' });
  }
  const token = auth.split(' ')[1];
  try {
    const payload = verifyToken(token);
    const userId = payload.userId && String(payload.userId);
    const workspaceId = payload.workspaceId && String(payload.workspaceId);
    if (!userId || !workspaceId) {
      return res.status(401).json({ ok: false, message: 'Invalid token payload' });
    }
    req.user = { id: userId, workspaceId };
    return next();
  } catch (err) {
    return res.status(401).json({ ok: false, message: 'Invalid token' });
  }
}
