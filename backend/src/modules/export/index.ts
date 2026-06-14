import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { exportWorkspacePdf } from './controller';

const router = Router();

router.get('/pdf/:workspaceId', requireAuth, exportWorkspacePdf);

export default router;
