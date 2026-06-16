import express from 'express';
import multer from 'multer';
import fs from 'fs';
import { requireAuth } from '../../middleware/auth';
import { saveFile, listFilesByProject, assertFileLinksBelongToWorkspace } from '../../services/fileService';
import { recordActivity } from '../../services/activityService';
import FileModel from '../../models/file.model';
import { deleteStoredFile, getStoredFileDownloadName, getStoredFileStream, getUploadDir, moveUploadedFileToStorage } from '../../services/storageService';

const router = express.Router();

const uploadDir = getUploadDir();

function inferContentType(file: { mimeType?: string; originalName?: string }) {
  if (file.mimeType) return file.mimeType;
  const name = String(file.originalName || '').toLowerCase();
  if (name.endsWith('.pdf')) return 'application/pdf';
  if (name.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (name.endsWith('.txt')) return 'text/plain; charset=utf-8';
  return 'application/octet-stream';
}

function contentDisposition(filename: string) {
  const safeName = filename.replace(/["\\\r\n]/g, '_');
  return `attachment; filename="${safeName}"`;
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file type'));
  },
  limits: { fileSize: 10 * 1024 * 1024 }
});

router.post('/upload', requireAuth, upload.single('file'), async (req, res, next) => {
  try {
    const user = req.user as { id: string; workspaceId: string } | undefined;
    if (!user) return res.status(401).json({ ok: false, message: 'Unauthorized' });
    const file = (req as any).file;
    if (!file) return res.status(400).json({ ok: false, message: 'No file uploaded' });
    const projectId = String(req.body.projectId || '') || undefined;
    await assertFileLinksBelongToWorkspace({ projectId, workspaceId: String(user.workspaceId) });

    let stored;
    try {
      stored = await moveUploadedFileToStorage({
        localPath: file.path,
        mimeType: file.mimetype,
        workspaceId: String(user.workspaceId),
        projectId,
        originalName: file.originalname
      });
    } catch (storageError) {
      try { if (fs.existsSync(file.path)) fs.unlinkSync(file.path); } catch {}
      throw storageError;
    }

    const saved = await saveFile({
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      path: stored.path,
      storageProvider: stored.mode,
      projectId,
      workspaceId: String(user.workspaceId),
      uploadedBy: user.id
    });

    try { await recordActivity({ workspaceId: String(user.workspaceId), userId: user.id, type: 'File Uploaded', entityType: 'file', entityId: String((saved as any)._id), meta: { projectId: String(req.body.projectId || '') } }); } catch {}

    return res.status(201).json({ ok: true, file: saved });
  } catch (err) {
    next(err);
  }
});

router.get('/project/:projectId', requireAuth, async (req, res, next) => {
  try {
    const user = req.user as { id: string; workspaceId: string } | undefined;
    if (!user) return res.status(401).json({ ok: false, message: 'Unauthorized' });
    const projectId = Array.isArray(req.params.projectId) ? String(req.params.projectId[0]) : String(req.params.projectId);
    const files = await listFilesByProject(projectId, user.workspaceId);
    return res.json({ ok: true, files });
  } catch (err) {
    next(err);
  }
});

  // download file
  router.get('/:id/download', requireAuth, async (req, res, next) => {
    try {
      const user = req.user as { id: string; workspaceId: string } | undefined;
      if (!user) return res.status(401).json({ ok: false, message: 'Unauthorized' });
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const file = await FileModel.findById(id).lean();
      if (!file) return res.status(404).json({ ok: false, message: 'File not found' });
      if (String(file.workspaceId) !== String(user.workspaceId)) return res.status(403).json({ ok: false, message: 'Forbidden' });

      const downloadName = getStoredFileDownloadName(file);
      res.setHeader('Content-Type', inferContentType(file));
      res.setHeader('Content-Disposition', contentDisposition(downloadName));
      res.setHeader('X-Content-Type-Options', 'nosniff');

      if (file.storageProvider === 's3') {
        const response = await getStoredFileStream(file);
        const body = response.Body as NodeJS.ReadableStream | undefined;
        if (!body) return res.status(404).json({ ok: false, message: 'File not found in storage' });
        if ((response as any).ContentLength) res.setHeader('Content-Length', String((response as any).ContentLength));
        body.pipe(res);
        return;
      }

      if (!fs.existsSync(file.path)) return res.status(404).json({ ok: false, message: 'File not found in storage' });
      const stat = fs.statSync(file.path);
      res.setHeader('Content-Length', String(stat.size));
      fs.createReadStream(file.path).pipe(res);
      return;
    } catch (err) { next(err); }
  });

  // delete file
  router.delete('/:id', requireAuth, async (req, res, next) => {
    try {
      const user = req.user as { id: string; workspaceId: string } | undefined;
      if (!user) return res.status(401).json({ ok: false, message: 'Unauthorized' });
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const file = await FileModel.findById(id);
      if (!file) return res.status(404).json({ ok: false, message: 'File not found' });
      if (String(file.workspaceId) !== String(user.workspaceId)) return res.status(403).json({ ok: false, message: 'Forbidden' });
      await deleteStoredFile(file as any);
      await file.remove();
      try { await recordActivity({ workspaceId: String(user.workspaceId), userId: user.id, type: 'File Deleted', entityType: 'file', entityId: String(id), meta: { projectId: String(file.projectId || '') } }); } catch {}
      return res.json({ ok: true });
    } catch (err) { next(err); }
  });

export default router;
