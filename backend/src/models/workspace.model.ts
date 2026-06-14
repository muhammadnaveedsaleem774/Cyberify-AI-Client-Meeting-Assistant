import mongoose, { Schema, Document } from 'mongoose';

export interface IMember {
  userId: mongoose.Types.ObjectId | string;
  role: 'owner' | 'admin' | 'member';
}

export interface IWorkspace extends Document {
  name: string;
  ownerId: mongoose.Types.ObjectId | string;
  members: IMember[];
  settings: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const MemberSchema = new Schema<IMember>({
  userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  role: { type: String, enum: ['owner', 'admin', 'member'], required: true }
});

const WorkspaceSchema = new Schema<IWorkspace>(
  {
    name: { type: String, required: true },
    ownerId: { type: Schema.Types.ObjectId, required: true, ref: 'User', index: true },
    members: { type: [MemberSchema], default: [] },
    settings: { type: Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

const WorkspaceModel = mongoose.models.Workspace || mongoose.model<IWorkspace>('Workspace', WorkspaceSchema);
export default WorkspaceModel;
