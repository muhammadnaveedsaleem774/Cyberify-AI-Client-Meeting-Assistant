import { Router, Request } from 'express';
import { success, fail } from '../../utils/response';
import WorkspaceModel from '../../models/workspace.model';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validateRequest';
import { z } from 'zod';
import { inviteWorkspaceUser, joinWorkspace } from './controller';

const router = Router();

const inviteSchema = z.object({
	body: z.object({
		email: z.string().email(),
		role: z.enum(['member', 'admin'])
	})
});

const joinSchema = z.object({
	body: z.object({
		inviteToken: z.string().min(20)
	})
});

router.post('/invite', requireAuth, validate(inviteSchema), inviteWorkspaceUser);
router.post('/join', requireAuth, validate(joinSchema), joinWorkspace);

// List workspaces for current user
router.get('/', requireAuth, async (req: Request, res, next) => {
	try {
		const user = req.user as { id: string; workspaceId: string } | undefined;
		if (!user) return res.status(401).json({ ok: false, message: 'Unauthorized' });
		const workspaces = await WorkspaceModel.find({ 'members.userId': user.id }).lean();
		return success(res, workspaces);
	} catch (err) {
		next(err);
	}
});

router.post('/', requireAuth, async (req: Request<{}, unknown, { name: string }>, res, next) => {
	try {
		const user = req.user as { id: string; workspaceId: string } | undefined;
		if (!user) return res.status(401).json({ ok: false, message: 'Unauthorized' });
		const { name } = req.body;
		const ws = await WorkspaceModel.create({ name, ownerId: user.id, members: [{ userId: user.id, role: 'owner' }] });
		return success(res, ws, 'workspace created', 201);
	} catch (err) {
		next(err);
	}
});

export default router;
