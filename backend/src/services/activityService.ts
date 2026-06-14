import { Activity } from '../models/activity.model';

export const recordActivity = async (payload: {
  workspaceId?: string;
  userId?: string;
  type: string;
  entityType?: string;
  entityId?: string;
  meta?: Record<string, unknown>;
}) => {
  return Activity.create({
    workspaceId: payload.workspaceId,
    userId: payload.userId,
    type: payload.type,
    entityType: payload.entityType,
    entityId: payload.entityId,
    meta: payload.meta || {},
  });
};

export const listActivities = async (opts: { workspaceId?: string; page?: number; limit?: number; sort?: 'asc' | 'desc'; action?: string; entityType?: string; q?: string; from?: Date; to?: Date }) => {
  const page = opts.page && opts.page > 0 ? opts.page : 1;
  const limit = opts.limit && opts.limit > 0 ? opts.limit : 50;
  const skip = (page - 1) * limit;
  const sortDir = opts.sort === 'asc' ? 1 : -1;
  const filter: any = {};
  if (opts.workspaceId) filter.workspaceId = opts.workspaceId;
  if (opts.action) filter.type = opts.action;
  if (opts.entityType) filter.entityType = opts.entityType;
  if (opts.from || opts.to) {
    filter.createdAt = {};
    if (opts.from) filter.createdAt.$gte = opts.from;
    if (opts.to) filter.createdAt.$lte = opts.to;
  }
  if (opts.q) {
    const q = opts.q;
    filter.$or = [
      { type: { $regex: q, $options: 'i' } },
      { 'meta': { $regex: q, $options: 'i' } }
    ];
  }

  const items = await Activity.find(filter).sort({ createdAt: sortDir }).skip(skip).limit(limit).lean();
  const total = await Activity.countDocuments(filter);
  return { items, total, page, limit };
};

export default { recordActivity, listActivities };
