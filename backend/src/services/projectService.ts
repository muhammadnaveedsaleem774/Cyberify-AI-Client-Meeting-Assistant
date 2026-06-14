import ProjectModel, { IProject } from '../models/project.model';
import { recordActivity } from './activityService';
import notifications from './notificationsService';
import { FilterQuery, UpdateQuery } from 'mongoose';

export type CreateProjectDTO = {
  name: string;
  clientName?: string;
  description?: string;
  status?: string;
  workspaceId: string;
  createdBy: string;
};

export type UpdateProjectDTO = Partial<CreateProjectDTO>;

export type ProjectFilters = {
  q?: string;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
};

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function createProject(data: CreateProjectDTO) {
  const doc = await ProjectModel.create(data);
  try { await recordActivity({ workspaceId: data.workspaceId, userId: data.createdBy, type: 'Project Created', meta: { projectId: String(doc._id) } }); } catch {}
  try { notifications.notify(data.workspaceId, 'project.created', { projectId: String(doc._id), name: data.name }); } catch {}
  return doc;
}

export async function getProjectsByWorkspace(workspaceId: string, filters: ProjectFilters = {}) {
  const filterObj: Record<string, unknown> = { workspaceId };
  if (filters.status) filterObj.status = filters.status;
  if (filters.q) {
    const regex = new RegExp(escapeRegex(filters.q), 'i');
    filterObj.$or = [{ name: regex }, { clientName: regex }, { description: regex }];
  }
  if (filters.dateFrom || filters.dateTo) {
    const createdAt: Record<string, Date> = {};
    if (filters.dateFrom) createdAt.$gte = filters.dateFrom;
    if (filters.dateTo) createdAt.$lte = filters.dateTo;
    filterObj.createdAt = createdAt;
  }
  return ProjectModel.find(filterObj as FilterQuery<IProject>).sort({ createdAt: -1 }).lean();
}

export async function getProjectById(id: string, workspaceId: string) {
  return ProjectModel.findOne({ _id: id, workspaceId }).lean();
}

export async function updateProject(id: string, workspaceId: string, updates: UpdateProjectDTO) {
  const updated = await ProjectModel.findOneAndUpdate({ _id: id, workspaceId }, updates as UpdateQuery<IProject>, { new: true });
  if (updated) {
    try { await recordActivity({ workspaceId, type: 'Project Updated', meta: { projectId: id } }); } catch {}
  }
  return updated;
}

export async function deleteProject(id: string, workspaceId: string) {
  const d = await ProjectModel.findOneAndDelete({ _id: id, workspaceId });
  if (d) { try { await recordActivity({ workspaceId, type: 'Project Deleted', meta: { projectId: id } }); } catch {} }
  return d;
}
