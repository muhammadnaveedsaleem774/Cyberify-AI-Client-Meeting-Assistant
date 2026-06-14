import { Request, Response, NextFunction } from 'express';
import { success } from '../../utils/response';
import { inviteUserToWorkspace, joinWorkspaceWithInvite } from '../../services/workspaceInviteService';

type InviteBody = {
  email: string;
  role: 'member' | 'admin';
};

type JoinBody = {
  inviteToken: string;
};

export async function inviteWorkspaceUser(req: Request<{}, unknown, InviteBody>, res: Response, next: NextFunction) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ ok: false, success: false, message: 'Unauthorized' });

    const data = await inviteUserToWorkspace({
      workspaceId: user.workspaceId,
      invitedByUserId: user.id,
      email: req.body.email,
      role: req.body.role
    });

    return success(res, data, data.status === 'accepted' ? 'User added to workspace' : 'Workspace invitation created', data.status === 'accepted' ? 200 : 201);
  } catch (err) {
    return next(err);
  }
}

export async function joinWorkspace(req: Request<{}, unknown, JoinBody>, res: Response, next: NextFunction) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ ok: false, success: false, message: 'Unauthorized' });

    const data = await joinWorkspaceWithInvite({
      userId: user.id,
      inviteToken: req.body.inviteToken
    });

    return success(res, data, 'Workspace joined successfully');
  } catch (err) {
    return next(err);
  }
}
