import { Router, Request } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validateRequest';
import { success } from '../../utils/response';
import * as aiService from '../../services/aiService';

const router = Router();

const schema = z.object({ body: z.object({ meetingId: z.string() }) });
const analyzeNotesSchema = z.object({
  body: z.object({
    title: z.string().min(1),
    notes: z.string().min(1),
    date: z.string().optional()
  })
});
const confirmSchema = z.object({
  body: z.object({
    title: z.string().min(1),
    notes: z.string().min(1),
    date: z.string(),
    projectId: z.string().optional(),
    newProject: z.object({
      name: z.string().min(1),
      clientName: z.string().optional(),
      description: z.string().optional(),
      status: z.string().optional()
    }).optional(),
    analysis: z.object({
      summary: z.string(),
      functionalRequirements: z.array(z.string()).default([]),
      userRoles: z.array(z.string()).default([]),
      entities: z.array(z.string()).default([]),
      timeline: z.array(z.string()).default([]),
      risks: z.array(z.string()).default([]),
      tasks: z.array(z.object({
        title: z.string(),
        description: z.string().optional(),
        priority: z.enum(['Low', 'Medium', 'High']).optional()
      })).default([])
    })
  })
});
type Body = z.infer<typeof schema>['body'];
type AnalyzeNotesBody = z.infer<typeof analyzeNotesSchema>['body'];
type ConfirmBody = z.infer<typeof confirmSchema>['body'];

router.use(requireAuth);

router.post('/analyze-notes', validate(analyzeNotesSchema), async (req: Request<{}, unknown, AnalyzeNotesBody>, res, next) => {
  try {
    const analysis = await aiService.analyzeNotes(req.body);
    return success(res, analysis);
  } catch (err) {
    next(err);
  }
});

router.post('/confirm-analysis', validate(confirmSchema), async (req: Request<{}, unknown, ConfirmBody>, res, next) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ ok: false, message: 'Unauthorized' });
    const result = await aiService.confirmAnalysis(req.body, user.workspaceId, user.id);
    return success(res, result, 'AI workflow saved', 201);
  } catch (err) {
    next(err);
  }
});

router.post('/analyze-meeting', validate(schema), async (req: Request<{}, unknown, Body>, res, next) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ ok: false, message: 'Unauthorized' });
    const { meetingId } = req.body;
    const analysis = await aiService.analyzeMeeting(meetingId, user.workspaceId, user.id);
    const out = (analysis as any)?.toObject ? (analysis as any).toObject() : analysis;
    return success(res, out);
  } catch (err) {
    next(err);
  }
});

// GET saved analysis for meeting
router.get('/analysis/:meetingId', async (req: Request, res, next) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ ok: false, message: 'Unauthorized' });
    const { meetingId } = req.params;
    const mid = Array.isArray(meetingId) ? meetingId[0] : meetingId;
    const analysis = await aiService.getAnalysisForMeeting(String(mid), String(user.workspaceId));
    if (!analysis) return success(res, null);
    return success(res, analysis);
  } catch (err) { next(err); }
});

// DELETE analysis for meeting
router.delete('/analysis/:meetingId', async (req: Request, res, next) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ ok: false, message: 'Unauthorized' });
    const { meetingId } = req.params;
    const mid = Array.isArray(meetingId) ? meetingId[0] : meetingId;
    await aiService.deleteAnalysisForMeeting(String(mid), String(user.workspaceId), user.id);
    return success(res, true);
  } catch (err) { next(err); }
});

export default router;

