import mongoose, { Schema, Document } from 'mongoose';

export interface IProject extends Document {
  name: string;
  clientName?: string;
  description?: string;
  status?: string;
  workspaceId: mongoose.Types.ObjectId | string;
  createdBy: mongoose.Types.ObjectId | string;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    name: { type: String, required: true },
    clientName: { type: String },
    description: { type: String },
    status: { type: String, enum: ['active', 'paused', 'completed'], default: 'active' },
    workspaceId: { type: Schema.Types.ObjectId, required: true, ref: 'Workspace', index: true },
    createdBy: { type: Schema.Types.ObjectId, required: true, ref: 'User' }
  },
  { timestamps: true }
);

const ProjectModel = mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);
export default ProjectModel;
