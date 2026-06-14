import mongoose, { Document, Schema } from 'mongoose';

export interface ActivityAttrs {
  workspaceId?: string;
  userId?: string;
  type: string;
  entityType?: string;
  entityId?: string;
  meta?: Record<string, unknown>;
  createdAt?: Date;
}

export interface ActivityDoc extends Document {
  workspaceId?: string;
  userId?: string;
  type: string;
  entityType?: string;
  entityId?: string;
  meta: Record<string, unknown>;
  createdAt: Date;
}

const activitySchema = new Schema<ActivityDoc>({
  workspaceId: { type: String, required: false, index: true },
  userId: { type: String, required: false },
  type: { type: String, required: true },
  entityType: { type: String, required: false, index: true },
  entityId: { type: String, required: false, index: true },
  meta: { type: Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: () => new Date(), index: true },
});

export const Activity = mongoose.model<ActivityDoc>('Activity', activitySchema);

export default Activity;
