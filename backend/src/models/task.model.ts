import mongoose, { Schema, Document } from 'mongoose';

export type Priority = 'Low' | 'Medium' | 'High';
export type Status = 'Open' | 'Completed';

export interface ITask extends Document {
  title: string;
  description?: string;
  priority: Priority;
  status: Status;
  assigneeEmail?: string;
  projectId?: mongoose.Types.ObjectId | string;
  meetingId?: mongoose.Types.ObjectId | string;
  workspaceId: mongoose.Types.ObjectId | string;
  createdBy: mongoose.Types.ObjectId | string;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true },
    description: { type: String },
    priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
    status: { type: String, enum: ['Open', 'Completed'], default: 'Open' },
    assigneeEmail: { type: String, trim: true, lowercase: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
    meetingId: { type: Schema.Types.ObjectId, ref: 'Meeting' },
    workspaceId: { type: Schema.Types.ObjectId, required: true, ref: 'Workspace', index: true },
    createdBy: { type: Schema.Types.ObjectId, required: true, ref: 'User' }
  },
  { timestamps: true }
);

const TaskModel = mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);
export default TaskModel;
