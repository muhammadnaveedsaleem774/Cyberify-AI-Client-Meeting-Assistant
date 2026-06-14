import { Request, Response, NextFunction } from 'express';
import UserModel from '../models/user.model';

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = req.user as { id: string; workspaceId: string } | undefined;
  if (!user) return res.status(401).json({ ok: false, message: 'Unauthorized' });

  const dbUser = await UserModel.findById(user.id).lean();
  if (!dbUser) return res.status(401).json({ ok: false, message: 'Unauthorized' });
  if ((dbUser as any).role !== 'admin') return res.status(403).json({ ok: false, message: 'Forbidden' });
  return next();
}

export default requireAdmin;
