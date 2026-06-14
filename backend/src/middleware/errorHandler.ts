import { Request, Response, NextFunction } from 'express';
import { fail } from '../utils/response';

export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  const asAny = err as { status?: number; statusCode?: number; message?: string; errors?: unknown; name?: string; type?: string };
  const status =
    asAny.status ||
    asAny.statusCode ||
    (asAny.name === 'CastError' ? 400 : undefined) ||
    (asAny.type === 'entity.too.large' ? 413 : undefined) ||
    500;
  const message =
    asAny.name === 'CastError'
      ? 'Invalid resource id'
      : asAny.message || 'Internal Server Error';
  if (process.env.NODE_ENV !== 'test') console.error(err);
  const details = asAny.errors || undefined;
  return fail(res, message, status, details);
}
