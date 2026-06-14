import { Router, Request } from 'express';
import { success } from '../../utils/response';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validateRequest';
import { z } from 'zod';
import * as taskService from '../../services/taskService';

const router = Router();

const createSchema = z.object({ body: z.object({ title: z.string(), description: z.string().optional(), priority: z.enum(['Low', 'Medium', 'High']).optional(), assigneeEmail: z.string().email().optional(), projectId: z.string().optional(), meetingId: z.string().optional() }) });
const updateSchema = z.object({ params: z.object({ id: z.string() }), body: z.object({ title: z.string().optional(), description: z.string().optional(), priority: z.enum(['Low', 'Medium', 'High']).optional(), status: z.enum(['Open', 'Completed']).optional(), assigneeEmail: z.string().email().optional() }) });

type CreateBody = z.infer<typeof createSchema>['body'];
type UpdateBody = z.infer<typeof updateSchema>['body'];

function queryString(value: unknown) {
	if (Array.isArray(value)) return value[0] ? String(value[0]) : undefined;
	return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function parseDateQuery(value: unknown, field: string, endOfDay = false) {
	const raw = queryString(value);
	if (!raw) return undefined;
	const date = new Date(raw);
	if (Number.isNaN(date.getTime())) throw { status: 400, message: `Invalid ${field}` };
	if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
		if (endOfDay) date.setUTCHours(23, 59, 59, 999);
		else date.setUTCHours(0, 0, 0, 0);
	}
	return date;
}

router.use(requireAuth);

router.post('/', validate(createSchema), async (req: Request<{}, unknown, CreateBody>, res, next) => {
	try {
		const user = req.user;
		if (!user) return res.status(401).json({ ok: false, message: 'Unauthorized' });
		const payload = { ...req.body, workspaceId: user.workspaceId, createdBy: user.id };
		const t = await taskService.createTask(payload);
		return success(res, t, 'created', 201);
	} catch (err) {
		next(err);
	}
});

router.get('/', async (req: Request, res, next) => {
	try {
		const user = req.user;
		if (!user) return res.status(401).json({ ok: false, message: 'Unauthorized' });
		const workspaceId = typeof user.workspaceId === 'string' ? user.workspaceId : String(user.workspaceId);
		const list = await taskService.getTasksByWorkspace(workspaceId, {
			q: queryString(req.query.q),
			status: queryString(req.query.status),
			priority: queryString(req.query.priority),
			dateFrom: parseDateQuery(req.query.dateFrom, 'dateFrom'),
			dateTo: parseDateQuery(req.query.dateTo, 'dateTo', true)
		});
		return success(res, list);
	} catch (err) {
		next(err);
	}
});

router.get('/:id', async (req: Request<{ id: string }>, res, next) => {
	try {
		const user = req.user;
		if (!user) return res.status(401).json({ ok: false, message: 'Unauthorized' });
		const workspaceId = typeof user.workspaceId === 'string' ? user.workspaceId : String(user.workspaceId);
		const item = await taskService.getTaskById(req.params.id, workspaceId);
		return success(res, item);
	} catch (err) {
		next(err);
	}
});

router.put('/:id', validate(updateSchema), async (req: Request<{ id: string }, unknown, UpdateBody>, res, next) => {
	try {
		const user = req.user;
		if (!user) return res.status(401).json({ ok: false, message: 'Unauthorized' });
		const updated = await taskService.updateTask(req.params.id, user.workspaceId, req.body);
		return success(res, updated);
	} catch (err) {
		next(err);
	}
});

router.delete('/:id', async (req: Request<{ id: string }>, res, next) => {
	try {
		const user = req.user;
		if (!user) return res.status(401).json({ ok: false, message: 'Unauthorized' });
		await taskService.deleteTask(req.params.id, user.workspaceId);
		return success(res, null, 'deleted');
	} catch (err) {
		next(err);
	}
});

router.patch('/:id/complete', async (req: Request<{ id: string }>, res, next) => {
	try {
		const user = req.user;
		if (!user) return res.status(401).json({ ok: false, message: 'Unauthorized' });
		const updated = await taskService.completeTask(req.params.id, user.workspaceId, user.id);
		return success(res, updated, 'completed');
	} catch (err) {
		next(err);
	}
});

export default router;
