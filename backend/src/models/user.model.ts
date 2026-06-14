import mongoose, { Schema, Document } from 'mongoose';

export interface IWorkspaceRole {
  workspaceId: mongoose.Types.ObjectId | string;
  role: 'owner' | 'admin' | 'member';
}

export interface IUser extends Document {
  email: string;
  name: string;
  passwordHash: string;
  workspaceRoles: IWorkspaceRole[];
  role?: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

const WorkspaceRoleSchema = new Schema<IWorkspaceRole>({
  workspaceId: { type: Schema.Types.ObjectId, required: true, ref: 'Workspace' },
  role: { type: String, enum: ['owner', 'admin', 'member'], required: true }
});

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    passwordHash: { type: String, required: true },
    workspaceRoles: { type: [WorkspaceRoleSchema], default: [] },
    role: { type: String, enum: ['user', 'admin'], default: 'user' }
  },
  { timestamps: true }
);

const UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export default UserModel;
