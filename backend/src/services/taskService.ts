import TaskModel, { ITask } from '../models/task.model';
import { recordActivity } from './activityService';
import notifications from './notificationsService';
import { sendEmail } from './emailService';
import { config } from '../config';
import { FilterQuery, UpdateQuery } from 'mongoose';

export type CreateTaskDTO = {
  title: string;
  description?: string;
  priority?: string;
  status?: string;
  assigneeEmail?: string;
  projectId?: string;
  meetingId?: string;
  workspaceId: string;
  createdBy: string;
};

export type UpdateTaskDTO = Partial<CreateTaskDTO>;

export type TaskFilters = {
  q?: string;
  status?: string;
  priority?: string;
  dateFrom?: Date;
  dateTo?: Date;
};

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function createTask(data: CreateTaskDTO) {
  const doc = await TaskModel.create(data);
  try { await recordActivity({ workspaceId: data.workspaceId, userId: data.createdBy, type: 'Task Created', meta: { taskId: String(doc._id) } }); } catch {}
  try { notifications.notify(data.workspaceId, 'taskCreated', { taskId: String(doc._id), title: data.title, actorUserId: data.createdBy }, `Task created: ${data.title}`, { excludeUserId: data.createdBy }); } catch {}
  if (data.assigneeEmail) {
    void sendTaskAssignmentEmail({
      assigneeEmail: data.assigneeEmail,
      title: data.title,
      priority: data.priority || 'Medium',
      workspaceId: data.workspaceId
    });
  }
  return doc;
}

export async function getTasksByWorkspace(workspaceId: string, filters: TaskFilters = {}) {
  const filterObj: Record<string, unknown> = { workspaceId };
  if (filters.status) filterObj.status = filters.status;
  if (filters.priority) filterObj.priority = filters.priority;
  if (filters.q) {
    const regex = new RegExp(escapeRegex(filters.q), 'i');
    filterObj.$or = [{ title: regex }, { description: regex }];
  }
  if (filters.dateFrom || filters.dateTo) {
    const createdAt: Record<string, Date> = {};
    if (filters.dateFrom) createdAt.$gte = filters.dateFrom;
    if (filters.dateTo) createdAt.$lte = filters.dateTo;
    filterObj.createdAt = createdAt;
  }
  return TaskModel.find(filterObj as FilterQuery<ITask>).sort({ createdAt: -1 }).lean();
}

export async function getTaskById(id: string, workspaceId: string) {
  return TaskModel.findOne({ _id: id, workspaceId }).lean();
}

export async function updateTask(id: string, workspaceId: string, updates: UpdateTaskDTO) {
  const previous = await TaskModel.findOne({ _id: id, workspaceId }).lean();
  const updated = await TaskModel.findOneAndUpdate({ _id: id, workspaceId }, updates as UpdateQuery<ITask>, { new: true });
  const nextAssignee = typeof updates.assigneeEmail === 'string' ? updates.assigneeEmail.trim().toLowerCase() : undefined;
  const oldAssignee = previous?.assigneeEmail ? String(previous.assigneeEmail).trim().toLowerCase() : undefined;
  if (updated && nextAssignee && nextAssignee !== oldAssignee) {
    void sendTaskAssignmentEmail({
      assigneeEmail: nextAssignee,
      title: updated.title,
      priority: updated.priority,
      workspaceId
    });
  }
  return updated;
}

export async function deleteTask(id: string, workspaceId: string) {
  return TaskModel.findOneAndDelete({ _id: id, workspaceId });
}

export async function completeTask(id: string, workspaceId: string, actorUserId?: string) {
  const updated = await TaskModel.findOneAndUpdate({ _id: id, workspaceId }, { status: 'Completed' } as UpdateQuery<ITask>, { new: true });
  if (updated) {
    try { await recordActivity({ workspaceId, userId: actorUserId, type: 'Task Completed', meta: { taskId: id } }); } catch {}
    try { notifications.notify(workspaceId, 'taskCompleted', { taskId: id, title: updated.title, actorUserId }, `Task completed: ${updated.title}`, { excludeUserId: actorUserId }); } catch {}
  }
  return updated;
}

async function sendTaskAssignmentEmail(params: { assigneeEmail: string; title: string; priority: string; workspaceId: string }) {
  const subject = `${config.appName}: new task assigned`;
  const text = [
    `You have been assigned a task in ${config.appName}.`,
    '',
    `Task: ${params.title}`,
    `Priority: ${params.priority}`,
    `Workspace ID: ${params.workspaceId}`,
    '',
    'Please log in to review the task.'
  ].join('\n');

  try {
    await sendEmail({
      to: params.assigneeEmail,
      subject,
      text,
      html: `
        <p>You have been assigned a task in <strong>${config.appName}</strong>.</p>
        <p><strong>Task:</strong> ${params.title}</p>
        <p><strong>Priority:</strong> ${params.priority}</p>
        <p><strong>Workspace ID:</strong> ${params.workspaceId}</p>
      `
    });
  } catch (err) {
    if (process.env.NODE_ENV !== 'test') console.error('Task assignment email failed', err);
  }
}
