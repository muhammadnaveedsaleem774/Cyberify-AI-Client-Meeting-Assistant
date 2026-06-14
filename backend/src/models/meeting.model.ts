import mongoose, { Schema, Document } from 'mongoose';

export interface IMeeting extends Document {
  title: string;
  notes?: string;
  date: Date;
  projectId?: mongoose.Types.ObjectId | string;
  workspaceId: mongoose.Types.ObjectId | string;
  createdBy: mongoose.Types.ObjectId | string;
  createdAt: Date;
  updatedAt: Date;
}

const MeetingSchema = new Schema<IMeeting>(
  {
    title: { type: String, required: true },
    notes: { type: String },
    date: { type: Date, required: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
    workspaceId: { type: Schema.Types.ObjectId, required: true, ref: 'Workspace', index: true },
    createdBy: { type: Schema.Types.ObjectId, required: true, ref: 'User' }
  },
  { timestamps: true }
);

const MeetingModel = mongoose.models.Meeting || mongoose.model<IMeeting>('Meeting', MeetingSchema);
export default MeetingModel;
