import mongoose, { Schema, Document } from 'mongoose';

export type WorkspaceInviteRole = 'member' | 'admin';
export type WorkspaceInviteStatus = 'pending' | 'accepted';

export interface IWorkspaceInvitation extends Document {
  email: string;
  workspaceId: mongoose.Types.ObjectId | string;
  role: WorkspaceInviteRole;
  tokenHash: string;
  status: WorkspaceInviteStatus;
  invitedBy: mongoose.Types.ObjectId | string;
  acceptedBy?: mongoose.Types.ObjectId | string;
  expiresAt: Date;
  acceptedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const WorkspaceInvitationSchema = new Schema<IWorkspaceInvitation>(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    workspaceId: { type: Schema.Types.ObjectId, required: true, ref: 'Workspace', index: true },
    role: { type: String, enum: ['member', 'admin'], required: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    status: { type: String, enum: ['pending', 'accepted'], default: 'pending', index: true },
    invitedBy: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    acceptedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    expiresAt: { type: Date, required: true, index: true },
    acceptedAt: { type: Date }
  },
  { timestamps: true }
);

WorkspaceInvitationSchema.index({ email: 1, workspaceId: 1, status: 1 });

const WorkspaceInvitationModel =
  mongoose.models.WorkspaceInvitation || mongoose.model<IWorkspaceInvitation>('WorkspaceInvitation', WorkspaceInvitationSchema);

export default WorkspaceInvitationModel;
