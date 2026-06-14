import { Router } from 'express';
import { success } from '../../utils/response';

const router = Router();

router.get('/', (req, res) => success(res, { info: 'activity-logs module root' }));

export default router;
