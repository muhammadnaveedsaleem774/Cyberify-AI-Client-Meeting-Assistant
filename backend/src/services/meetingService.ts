import MeetingModel, { IMeeting } from '../models/meeting.model';
import ProjectModel from '../models/project.model';
import { recordActivity } from './activityService';
import notifications from './notificationsService';
import { FilterQuery, UpdateQuery } from 'mongoose';
import { assertBelongsToWorkspace } from '../utils/assertWorkspaceOwnership';

export type CreateMeetingDTO = {
  title: string;
  notes?: string;
  date?: Date | string;
  projectId?: string;
  workspaceId: string;
  createdBy: string;
};

export type UpdateMeetingDTO = Partial<CreateMeetingDTO>;

export type MeetingFilters = {
  q?: string;
  dateFrom?: Date;
  dateTo?: Date;
};

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function createMeeting(data: CreateMeetingDTO) {
  if (data.projectId) {
    await assertBelongsToWorkspace(ProjectModel, data.projectId, data.workspaceId, 'Project');
  }
  const doc = await MeetingModel.create(data);
  try { await recordActivity({ workspaceId: data.workspaceId, userId: data.createdBy, type: 'Meeting Added', meta: { meetingId: String(doc._id) } }); } catch {}
  try { notifications.notify(data.workspaceId, 'meetingCreated', { meetingId: String(doc._id), title: data.title, actorUserId: data.createdBy }, `Meeting created: ${data.title}`, { excludeUserId: data.createdBy }); } catch {}
  return doc;
}

export async function getMeetingsByWorkspace(workspaceId: string, filters: MeetingFilters = {}) {
  const filterObj: Record<string, unknown> = { workspaceId };
  if (filters.q) {
    const regex = new RegExp(escapeRegex(filters.q), 'i');
    filterObj.$or = [{ title: regex }, { notes: regex }];
  }
  if (filters.dateFrom || filters.dateTo) {
    const date: Record<string, Date> = {};
    if (filters.dateFrom) date.$gte = filters.dateFrom;
    if (filters.dateTo) date.$lte = filters.dateTo;
    filterObj.date = date;
  }
  return MeetingModel.find(filterObj as FilterQuery<IMeeting>).sort({ date: -1 }).lean();
}

export async function getMeetingById(id: string, workspaceId: string) {
  return MeetingModel.findOne({ _id: id, workspaceId }).lean();
}

export async function updateMeeting(id: string, workspaceId: string, updates: UpdateMeetingDTO) {
  if (updates.projectId) {
    await assertBelongsToWorkspace(ProjectModel, updates.projectId, workspaceId, 'Project');
  }
  return MeetingModel.findOneAndUpdate({ _id: id, workspaceId }, updates as UpdateQuery<IMeeting>, { new: true });
}

export async function deleteMeeting(id: string, workspaceId: string) {
  const d = await MeetingModel.findOneAndDelete({ _id: id, workspaceId });
  if (d) { try { await recordActivity({ workspaceId, type: 'Meeting Deleted', meta: { meetingId: id } }); } catch {} }
  return d;
}
