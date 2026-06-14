import { Request, Response, NextFunction } from 'express';
import PDFDocument from 'pdfkit';
import { streamWorkspaceReportPdf } from '../../services/exportService';

function parseDate(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw { status: 400, message: 'Invalid date filter' };
  return date;
}

export async function exportWorkspacePdf(req: Request<{ workspaceId: string }>, res: Response, next: NextFunction) {
  try {
    const user = req.user as { id: string; workspaceId: string } | undefined;
    if (!user) return res.status(401).json({ ok: false, message: 'Unauthorized' });

    const workspaceId = req.params.workspaceId;
    const from = parseDate(req.query.from);
    const to = parseDate(req.query.to);

    const filename = `workspace-report-${workspaceId}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    const doc = new PDFDocument({ size: 'A4', margin: 48, bufferPages: true });
    doc.on('error', next);
    doc.pipe(res);

    await streamWorkspaceReportPdf({
      workspaceId,
      userId: user.id,
      doc,
      range: { from, to }
    });

    doc.end();
  } catch (err) {
    next(err);
  }
}
