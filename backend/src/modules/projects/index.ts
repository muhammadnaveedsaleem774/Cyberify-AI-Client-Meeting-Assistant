import { Router, Request } from 'express';
import { success } from '../../utils/response';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validateRequest';
import { z } from 'zod';
import * as projectService from '../../services/projectService';

const router = Router();

const createSchema = z.object({ body: z.object({ name: z.string(), clientName: z.string().optional(), description: z.string().optional(), status: z.string().optional() }) });
const updateSchema = z.object({ params: z.object({ id: z.string() }), body: z.object({ name: z.string().optional(), clientName: z.string().optional(), description: z.string().optional(), status: z.string().optional() }) });

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
		const p = await projectService.createProject(payload);
		return success(res, p, 'created', 201);
	} catch (err) {
		next(err);
	}
});

router.get('/', async (req: Request, res, next) => {
	try {
		const user = req.user;
		if (!user) return res.status(401).json({ ok: false, message: 'Unauthorized' });
		const workspaceId = typeof user.workspaceId === 'string' ? user.workspaceId : String(user.workspaceId);
		const list = await projectService.getProjectsByWorkspace(workspaceId, {
			q: queryString(req.query.q),
			status: queryString(req.query.status),
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
		const id = Array.isArray(req.params.id) ? String(req.params.id[0]) : String(req.params.id);
		const item = await projectService.getProjectById(id, workspaceId);
		return success(res, item);
	} catch (err) {
		next(err);
	}
});

router.put('/:id', validate(updateSchema), async (req: Request<{ id: string }, unknown, UpdateBody>, res, next) => {
	try {
		const user = req.user;
		if (!user) return res.status(401).json({ ok: false, message: 'Unauthorized' });
		const workspaceId = typeof user.workspaceId === 'string' ? user.workspaceId : String(user.workspaceId);
		const id = Array.isArray(req.params.id) ? String(req.params.id[0]) : String(req.params.id);
		const updated = await projectService.updateProject(id, workspaceId, req.body);
		return success(res, updated);
	} catch (err) {
		next(err);
	}
});

router.delete('/:id', async (req: Request<{ id: string }>, res, next) => {
	try {
		const user = req.user;
		if (!user) return res.status(401).json({ ok: false, message: 'Unauthorized' });
		const id = Array.isArray(req.params.id) ? String(req.params.id[0]) : String(req.params.id);
		await projectService.deleteProject(id, user.workspaceId);
		return success(res, null, 'deleted');
	} catch (err) {
		next(err);
	}
});

export default router;
