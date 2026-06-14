import express from 'express';
import PDFDocument from 'pdfkit';
import { requireAuth } from '../../middleware/auth';
import { getWorkspaceStats } from '../../services/dashboardService';
import { writeWorkspaceReportPdf } from '../../services/reportService';

const router = express.Router();

router.get('/stats', requireAuth, async (req, res, next) => {
  try {
    const user = req.user as { id: string; workspaceId: string } | undefined;
    if (!user) return res.status(401).json({ ok: false, message: 'Unauthorized' });

    const stats = await getWorkspaceStats(user.workspaceId);
    return res.json({ ok: true, stats });
  } catch (err) {
    next(err);
  }
});

router.get('/report', requireAuth, async (req, res, next) => {
  try {
    const user = req.user as { id: string; workspaceId: string } | undefined;
    if (!user) return res.status(401).json({ ok: false, message: 'Unauthorized' });

    const filename = `cyberify-workspace-report-${new Date().toISOString().slice(0, 10)}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-store');

    const doc = new PDFDocument({ size: 'A4', margin: 48, bufferPages: true });
    doc.pipe(res);
    await writeWorkspaceReportPdf(doc, user.workspaceId);
    doc.end();
  } catch (err) {
    next(err);
  }
});

export default router;
