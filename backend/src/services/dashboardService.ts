import ProjectModel from '../models/project.model';
import MeetingModel from '../models/meeting.model';
import TaskModel from '../models/task.model';

export async function getWorkspaceStats(workspaceId: string) {
  const totalProjects = await ProjectModel.countDocuments({ workspaceId });
  const totalMeetings = await MeetingModel.countDocuments({ workspaceId });
  const openTasks = await TaskModel.countDocuments({ workspaceId, status: 'Open' });
  const completedTasks = await TaskModel.countDocuments({ workspaceId, status: 'Completed' });

  const projectsByStatusAgg = await ProjectModel.aggregate([
    { $match: { workspaceId } },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
  const projectsByStatus: Record<string, number> = {};
  for (const p of projectsByStatusAgg) projectsByStatus[String(p._id || 'unknown')] = p.count;

  const tasksByStatusAgg = await TaskModel.aggregate([
    { $match: { workspaceId } },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
  const tasksByStatus: Record<string, number> = {};
  for (const t of tasksByStatusAgg) tasksByStatus[String(t._id || 'unknown')] = t.count;

  const meetingsByDateAgg = await MeetingModel.aggregate([
    { $match: { workspaceId } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);
  const meetingsByDate: Record<string, number> = {};
  for (const m of meetingsByDateAgg) meetingsByDate[String(m._id)] = m.count;

  return {
    totalProjects,
    totalMeetings,
    openTasks,
    completedTasks,
    projectsByStatus,
    tasksByStatus,
    meetingsByDate
  };
}

export default { getWorkspaceStats };
