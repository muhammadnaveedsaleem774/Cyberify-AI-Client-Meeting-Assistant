import { Response } from 'express';

export function success(res: Response, data: unknown, message = 'OK', status = 200) {
  return res.status(status).json({ ok: true, success: true, message, data });
}

export function fail(res: Response, message = 'Error', status = 500, details?: unknown) {
  const payload: Record<string, unknown> = { ok: false, success: false, message };
  if (details) payload.details = details;
  return res.status(status).json(payload);
}
