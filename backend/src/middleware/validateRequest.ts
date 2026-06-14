import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';

// Validation middleware factory using Zod schemas.
export const validate = (schema: ZodSchema<unknown>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // validate body, params and query together
      schema.parse({ body: req.body, params: req.params, query: req.query } as unknown);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return next({ status: 400, message: 'Validation failed', errors: err.errors });
      }
      next(err);
    }
  };
};
