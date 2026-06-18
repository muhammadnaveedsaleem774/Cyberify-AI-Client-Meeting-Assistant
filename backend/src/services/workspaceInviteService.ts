import crypto from 'crypto';
import mongoose from 'mongoose';
import UserModel, { IUser } from '../models/user.model';
import WorkspaceModel, { IWorkspace } from '../models/workspace.model';
import WorkspaceInvitationModel, { WorkspaceInviteRole } from '../models/workspaceInvitation.model';
import { recordActivity } from './activityService';
import { signAccessToken } from '../utils/jwt';
import { config } from '../config';
import { sendEmail } from './emailService';

const INVITE_EXPIRY_HOURS = 24;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function hashInviteToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function sameId(a: unknown, b: unknown) {
  return String(a) === String(b);
}

function getFrontendUrl() {
  return (process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/+$/, '');
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function sendWorkspaceInviteEmail(params: {
  email: string;
  inviteLink: string;
  workspaceName: string;
  role: WorkspaceInviteRole;
}) {
  const appName = config.appName;
  const workspaceName = params.workspaceName || 'a workspace';
  const subject = `You have been invited to ${workspaceName}`;
  const text = [
    `You have been invited to join ${workspaceName} as ${params.role} on ${appName}.`,
    '',
    'Accept your invitation using this link:',
    params.inviteLink,
    '',
    'This invitation expires in 24 hours.'
  ].join('\n');

  await sendEmail({
    to: params.email,
    subject,
    text,
    html: `
      <p>You have been invited to join <strong>${escapeHtml(workspaceName)}</strong> as <strong>${escapeHtml(params.role)}</strong> on ${escapeHtml(appName)}.</p>
      <p><a href="${escapeHtml(params.inviteLink)}">Accept invitation</a></p>
      <p>This invitation expires in 24 hours.</p>
    `
  });
}

async function sendExistingMemberAddedEmail(params: {
  email: string;
  workspaceName: string;
  role: WorkspaceInviteRole;
}) {
  const appName = config.appName;
  const workspaceName = params.workspaceName || 'a workspace';
  const dashboardLink = `${getFrontendUrl()}/dashboard`;
  const subject = `You have been added to ${workspaceName}`;
  const text = [
    `You have been added to ${workspaceName} as ${params.role} on ${appName}.`,
    '',
    'Open your dashboard to access the workspace:',
    dashboardLink
  ].join('\n');

  await sendEmail({
    to: params.email,
    subject,
    text,
    html: `
      <p>You have been added to <strong>${escapeHtml(workspaceName)}</strong> as <strong>${escapeHtml(params.role)}</strong> on ${escapeHtml(appName)}.</p>
      <p><a href="${escapeHtml(dashboardLink)}">Open dashboard</a></p>
    `
  });
}

function getMembership(workspace: IWorkspace, userId: string) {
  return workspace.members.find((member) => sameId(member.userId, userId));
}

function assertCanInvite(workspace: IWorkspace, userId: string) {
  if (sameId(workspace.ownerId, userId)) return;
  const membership = getMembership(workspace, userId);
  if (membership && ['owner', 'admin'].includes(membership.role)) return;
  throw { status: 403, message: 'Only workspace owners or admins can invite users' };
}

function hasWorkspaceRole(user: IUser, workspaceId: string) {
  return user.workspaceRoles.some((role) => sameId(role.workspaceId, workspaceId));
}

async function attachUserToWorkspace(params: {
  user: IUser;
  workspace: IWorkspace;
  role: WorkspaceInviteRole;
  makeActive?: boolean;
}) {
  const { user, workspace, role, makeActive = false } = params;
  const workspaceId = String(workspace._id);
  const userId = String(user._id);

  if (!hasWorkspaceRole(user, workspaceId)) {
    if (makeActive) user.workspaceRoles.unshift({ workspaceId: workspace._id, role });
    else user.workspaceRoles.push({ workspaceId: workspace._id, role });
    await user.save();
  } else if (makeActive) {
    const existing = user.workspaceRoles.find((entry) => sameId(entry.workspaceId, workspaceId));
    user.workspaceRoles = [
      ...(existing ? [existing] : []),
      ...user.workspaceRoles.filter((entry) => !sameId(entry.workspaceId, workspaceId))
    ];
    await user.save();
  }

  if (!getMembership(workspace, userId)) {
    workspace.members.push({ userId: user._id, role });
    await workspace.save();
  }
}

export async function inviteUserToWorkspace(params: {
  workspaceId: string;
  invitedByUserId: string;
  email: string;
  role: WorkspaceInviteRole;
}) {
  const email = normalizeEmail(params.email);
  const workspace = await WorkspaceModel.findById(params.workspaceId);
  if (!workspace) throw { status: 404, message: 'Workspace not found' };

  assertCanInvite(workspace, params.invitedByUserId);

  const existingUser = await UserModel.findOne({ email });
  if (existingUser) {
    if (hasWorkspaceRole(existingUser, String(workspace._id)) || getMembership(workspace, String(existingUser._id))) {
      throw { status: 409, message: 'User is already a member of this workspace' };
    }

    await attachUserToWorkspace({ user: existingUser, workspace, role: params.role, makeActive: true });
    await sendExistingMemberAddedEmail({
      email,
      workspaceName: workspace.name,
      role: params.role
    });
    await recordActivity({
      workspaceId: String(workspace._id),
      userId: params.invitedByUserId,
      type: 'Workspace Member Added',
      entityType: 'workspace',
      entityId: String(workspace._id),
      meta: { invitedEmail: email, invitedUserId: String(existingUser._id), role: params.role }
    });

    return {
      status: 'accepted',
      userId: String(existingUser._id),
      workspaceId: String(workspace._id),
      role: params.role
    };
  }

  const pendingInvite = await WorkspaceInvitationModel.findOne({
    email,
    workspaceId: workspace._id,
    status: 'pending',
    expiresAt: { $gt: new Date() }
  });
  if (pendingInvite) throw { status: 409, message: 'A pending invitation already exists for this email' };

  const inviteToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + INVITE_EXPIRY_HOURS * 60 * 60 * 1000);
  const invitation = await WorkspaceInvitationModel.create({
    email,
    workspaceId: workspace._id,
    role: params.role,
    tokenHash: hashInviteToken(inviteToken),
    invitedBy: new mongoose.Types.ObjectId(params.invitedByUserId),
    expiresAt
  });

  const inviteLink = `${getFrontendUrl()}/signup?inviteToken=${inviteToken}`;
  await sendWorkspaceInviteEmail({
    email,
    inviteLink,
    workspaceName: workspace.name,
    role: params.role
  });
  await recordActivity({
    workspaceId: String(workspace._id),
    userId: params.invitedByUserId,
    type: 'Workspace Invite Sent',
    entityType: 'workspaceInvitation',
    entityId: String(invitation._id),
    meta: { invitedEmail: email, role: params.role, expiresAt }
  });

  return {
    status: invitation.status,
    invitationId: String(invitation._id),
    workspaceId: String(workspace._id),
    email,
    role: params.role,
    expiresAt,
    inviteLink
  };
}

export async function joinWorkspaceWithInvite(params: {
  userId: string;
  inviteToken: string;
}) {
  const tokenHash = hashInviteToken(params.inviteToken);
  const invitation = await WorkspaceInvitationModel.findOne({ tokenHash });
  if (!invitation) throw { status: 400, message: 'Invalid invite token' };
  if (invitation.status !== 'pending') throw { status: 409, message: 'Invite has already been accepted' };
  if (invitation.expiresAt.getTime() <= Date.now()) throw { status: 410, message: 'Invite has expired' };

  const user = await UserModel.findById(params.userId);
  if (!user) throw { status: 404, message: 'User not found' };
  if (normalizeEmail(user.email) !== invitation.email) {
    throw { status: 403, message: 'Invite token does not match the authenticated user email' };
  }

  const workspace = await WorkspaceModel.findById(invitation.workspaceId);
  if (!workspace) throw { status: 404, message: 'Workspace not found' };
  if (hasWorkspaceRole(user, String(workspace._id)) || getMembership(workspace, String(user._id))) {
    throw { status: 409, message: 'User is already a member of this workspace' };
  }

  await attachUserToWorkspace({ user, workspace, role: invitation.role, makeActive: true });

  invitation.status = 'accepted';
  invitation.acceptedBy = user._id;
  invitation.acceptedAt = new Date();
  await invitation.save();

  await recordActivity({
    workspaceId: String(workspace._id),
    userId: String(user._id),
    type: 'Workspace Invite Accepted',
    entityType: 'workspaceInvitation',
    entityId: String(invitation._id),
    meta: { email: user.email, role: invitation.role }
  });

  const accessToken = signAccessToken({ userId: user._id, workspaceId: workspace._id });

  return {
    workspaceId: String(workspace._id),
    role: invitation.role,
    accessToken
  };
}
