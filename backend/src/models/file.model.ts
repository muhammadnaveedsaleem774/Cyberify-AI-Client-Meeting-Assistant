import mongoose, { Schema, Document } from 'mongoose';

export interface IFile extends Document {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  storageProvider?: 'local' | 's3';
  projectId?: mongoose.Types.ObjectId | string;
  workspaceId: mongoose.Types.ObjectId | string;
  uploadedBy: mongoose.Types.ObjectId | string;
  createdAt: Date;
}

const FileSchema = new Schema<IFile>(
  {
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    path: { type: String, required: true },
    storageProvider: { type: String, enum: ['local', 's3'], default: 'local' },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
    workspaceId: { type: Schema.Types.ObjectId, required: true, ref: 'Workspace', index: true },
    uploadedBy: { type: Schema.Types.ObjectId, required: true, ref: 'User' }
  },
  { timestamps: true }
);

const FileModel = mongoose.models.File || mongoose.model<IFile>('File', FileSchema);
export default FileModel;
