import { Model, Document } from 'mongoose';
import { ApiError } from './ApiError';

export const assertBelongsToWorkspace = async <T extends Document>(
  Model: Model<T>,
  id: string,
  workspaceId: string,
  label: string
): Promise<T> => {
  if (!id) throw new ApiError(400, `${label} ID is required`);
  const doc = await (Model as any).findOne({ _id: id, workspaceId });
  if (!doc) {
    throw new ApiError(403, `${label} not found or does not belong to this workspace`);
  }
  return doc;
};
