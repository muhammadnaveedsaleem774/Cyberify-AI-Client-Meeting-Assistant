import UserModel from '../models/user.model';
import WorkspaceModel from '../models/workspace.model';
import RefreshTokenModel from '../models/refreshToken.model';
import { hashPassword, comparePassword } from './password';
import { signAccessToken, signRefreshToken, verifyToken } from '../utils/jwt';
import crypto from 'crypto';

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type RefreshTokenResult = AuthTokens & {
  userId: string;
  workspaceId: string;
};

function toSafeUser(user: any) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role
  };
}

function hashRefreshToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function getTokenExpiry(token: string) {
  const decoded = verifyToken(token);
  if (!decoded.exp) throw { status: 401, message: 'Refresh token is missing expiry' };
  return new Date(decoded.exp * 1000);
}

function getDefaultWorkspaceId(user: { workspaceRoles?: Array<{ workspaceId: unknown }> }) {
  const workspaceRole = user.workspaceRoles && user.workspaceRoles[0];
  const workspaceId = workspaceRole ? workspaceRole.workspaceId : null;
  if (!workspaceId) throw { status: 401, message: 'User has no workspace' };
  return String(workspaceId);
}

async function persistRefreshToken(userId: unknown, refreshToken: string) {
  const tokenHash = hashRefreshToken(refreshToken);
  const expiresAt = getTokenExpiry(refreshToken);
  await RefreshTokenModel.create({ userId, tokenHash, expiresAt });
  return tokenHash;
}

function createRefreshToken(userId: unknown) {
  return signRefreshToken({ userId, tokenId: crypto.randomUUID() });
}

export async function signupUser({ name, email, password, workspaceName }: { name: string; email: string; password: string; workspaceName: string; }) {
  // check exists
  const existing = await UserModel.findOne({ email });
  if (existing) throw { status: 400, message: 'Email already in use' };

  const passwordHash = await hashPassword(password);
  const user = await UserModel.create({ name, email, passwordHash });

  const workspace = await WorkspaceModel.create({ name: workspaceName || `${name}'s workspace`, ownerId: user._id, members: [{ userId: user._id, role: 'owner' }] });

  // attach workspace role to user
  user.workspaceRoles.push({ workspaceId: workspace._id, role: 'owner' });
  await user.save();

  const accessToken = signAccessToken({ userId: user._id, workspaceId: workspace._id });
  const refreshToken = createRefreshToken(user._id);
  await persistRefreshToken(user._id, refreshToken);

  return { user: toSafeUser(user), workspace, accessToken, refreshToken };
}

export async function loginUser({ email, password }: { email: string; password: string; }) {
  const user = await UserModel.findOne({ email });
  if (!user) throw { status: 401, message: 'Invalid credentials' };
  const ok = await comparePassword(password, user.passwordHash);
  if (!ok) throw { status: 401, message: 'Invalid credentials' };

  // pick default workspace if any
  const workspaceRole = user.workspaceRoles && user.workspaceRoles[0];
  const workspaceId = workspaceRole ? workspaceRole.workspaceId : null;

  const accessToken = signAccessToken({ userId: user._id, workspaceId });
  const refreshToken = createRefreshToken(user._id);
  await persistRefreshToken(user._id, refreshToken);

  return { user: toSafeUser(user), accessToken, refreshToken };
}

export async function refreshAuthTokens(refreshToken: string): Promise<RefreshTokenResult> {
  if (!refreshToken) throw { status: 400, message: 'Refresh token is required' };

  let payload: ReturnType<typeof verifyToken>;
  try {
    payload = verifyToken(refreshToken);
  } catch (err) {
    throw { status: 401, message: 'Invalid or expired refresh token' };
  }

  if (!payload.userId) throw { status: 401, message: 'Invalid refresh token payload' };

  const oldTokenHash = hashRefreshToken(refreshToken);
  const storedToken = await RefreshTokenModel.findOne({ tokenHash: oldTokenHash, userId: payload.userId });
  if (!storedToken) throw { status: 401, message: 'Refresh token not recognized' };
  if (storedToken.revokedAt) throw { status: 401, message: 'Refresh token has been revoked' };
  if (storedToken.expiresAt.getTime() <= Date.now()) {
    storedToken.revokedAt = new Date();
    await storedToken.save();
    throw { status: 401, message: 'Refresh token has expired' };
  }

  const user = await UserModel.findById(payload.userId);
  if (!user) throw { status: 401, message: 'User no longer exists' };

  const workspaceId = getDefaultWorkspaceId(user);
  const accessToken = signAccessToken({ userId: user._id, workspaceId });
  const newRefreshToken = createRefreshToken(user._id);
  const newTokenHash = await persistRefreshToken(user._id, newRefreshToken);

  storedToken.revokedAt = new Date();
  storedToken.replacedByTokenHash = newTokenHash;
  await storedToken.save();

  return {
    userId: String(user._id),
    workspaceId,
    accessToken,
    refreshToken: newRefreshToken
  };
}

export async function revokeRefreshToken(refreshToken: string): Promise<void> {
  if (!refreshToken) throw { status: 400, message: 'Refresh token is required' };

  const tokenHash = hashRefreshToken(refreshToken);
  const storedToken = await RefreshTokenModel.findOne({ tokenHash });
  if (!storedToken) throw { status: 401, message: 'Refresh token not recognized' };
  if (!storedToken.revokedAt) {
    storedToken.revokedAt = new Date();
    await storedToken.save();
  }
}

export async function revokeAllRefreshTokensForUser(userId: string): Promise<number> {
  const result = await RefreshTokenModel.updateMany(
    { userId, revokedAt: { $exists: false } },
    { $set: { revokedAt: new Date() } }
  );
  return result.modifiedCount || 0;
}
