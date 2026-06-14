import { Router, Request } from 'express';
import { requireAuth } from '../../middleware/auth';
import UserModel from '../../models/user.model';
import { success } from '../../utils/response';
import { signupUser, loginUser, refreshAuthTokens, revokeRefreshToken } from '../../services/authService';
import { validate } from '../../middleware/validateRequest';
import { z } from 'zod';

const router = Router();

const refreshSchema = z.object({ body: z.object({ refreshToken: z.string().min(1) }) });
const logoutSchema = z.object({ body: z.object({ refreshToken: z.string().min(1) }) });

type SignupBody = { name: string; email: string; password: string; workspaceName?: string };
type LoginBody = { email: string; password: string };
type RefreshBody = z.infer<typeof refreshSchema>['body'];
type LogoutBody = z.infer<typeof logoutSchema>['body'];

router.get('/', (req, res) => success(res, { info: 'auth module root' }));

router.post('/signup', async (req: Request<{}, unknown, SignupBody>, res, next) => {
	try {
		const { name, email, password, workspaceName } = req.body;
		const result = await signupUser({ name, email, password, workspaceName: workspaceName || '' });
		return success(res, result, 'signup successful', 201);
	} catch (err) {
		return next(err);
	}
});

router.post('/login', async (req: Request<{}, unknown, LoginBody>, res, next) => {
	try {
		const { email, password } = req.body;
		const result = await loginUser({ email, password });
		return success(res, result, 'login successful', 200);
	} catch (err) {
		return next(err);
	}
});

router.post('/refresh', validate(refreshSchema), async (req: Request<{}, unknown, RefreshBody>, res, next) => {
	try {
		const result = await refreshAuthTokens(req.body.refreshToken);
		return success(res, result, 'token refreshed', 200);
	} catch (err) {
		return next(err);
	}
});

router.post('/logout', validate(logoutSchema), async (req: Request<{}, unknown, LogoutBody>, res, next) => {
	try {
		await revokeRefreshToken(req.body.refreshToken);
		return success(res, null, 'logout successful', 200);
	} catch (err) {
		return next(err);
	}
});

router.get('/me', requireAuth, async (req: Request, res, next) => {
	try {
		const user = req.user as { id: string } | undefined;
		if (!user) return res.status(401).json({ ok: false, message: 'Unauthorized' });
		const dbUser = await UserModel.findById(user.id).lean();
		if (!dbUser) return res.status(404).json({ ok: false, message: 'Not found' });
		// return minimal safe user info
		const safe = { id: dbUser._id, name: (dbUser as any).name, email: (dbUser as any).email, role: (dbUser as any).role };
		return res.json({ ok: true, user: safe });
	} catch (err) { next(err); }
});

export default router;
