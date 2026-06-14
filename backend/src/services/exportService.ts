import mongoose from 'mongoose';
import ProjectModel from '../models/project.model';
import MeetingModel from '../models/meeting.model';
import TaskModel from '../models/task.model';
import AIAnalysisModel from '../models/ai.model';
import WorkspaceModel from '../models/workspace.model';
import UserModel from '../models/user.model';
import { listActivities, recordActivity } from './activityService';
import { sectionHeading, keyValueLine, sectionTableLike, truncateText, writeDocHeader } from '../utils/pdf/reportPdf';

type DateRange = {
  from?: Date;
  to?: Date;
};

type ExportWorkspaceReportInput = {
  workspaceId: string;
  userId: string;
  doc: PDFKit.PDFDocument;
  range?: DateRange;
};

function buildRangeFilter(field: string, range?: DateRange) {
  if (!range?.from && !range?.to) return {};
  const filter: Record<string, unknown> = {};
  filter[field] = {};
  if (range.from) (filter[field] as Record<string, Date>).$gte = range.from;
  if (range.to) (filter[field] as Record<string, Date>).$lte = range.to;
  return filter;
}

async function assertWorkspaceAccess(userId: string, workspaceId: string) {
  if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
    throw { status: 404, message: 'Workspace not found' };
  }

  const [workspace, user] = await Promise.all([
    WorkspaceModel.findById(workspaceId).lean(),
    UserModel.findById(userId).lean()
  ]);

  if (!workspace) throw { status: 404, message: 'Workspace not found' };
  if (!user) throw { status: 401, message: 'Unauthorized' };

  const belongs =
    String(workspace.ownerId) === String(user._id) ||
    (user.workspaceRoles || []).some((role: { workspaceId: unknown }) => String(role.workspaceId) === String(workspaceId)) ||
    (workspace.members || []).some((member: { userId: unknown }) => String(member.userId) === String(user._id));

  if (!belongs) throw { status: 403, message: 'Forbidden' };

  return workspace;
}

export async function generateWorkspaceReportDoc({ workspaceId, userId, doc, range }: ExportWorkspaceReportInput) {
  const workspace = await assertWorkspaceAccess(userId, workspaceId);
  const [projects, meetings, tasks, analysis, activities] = await Promise.all([
    ProjectModel.find({ workspaceId, ...buildRangeFilter('createdAt', range) }).sort({ createdAt: -1 }).lean(),
    MeetingModel.find({ workspaceId, ...buildRangeFilter('date', range) }).sort({ date: -1 }).lean(),
    TaskModel.find({ workspaceId, ...buildRangeFilter('createdAt', range) }).sort({ createdAt: -1 }).lean(),
    AIAnalysisModel.findOne({ workspaceId, ...buildRangeFilter('updatedAt', range) }).sort({ updatedAt: -1, createdAt: -1 }).lean(),
    listActivities({ workspaceId, page: 1, limit: 15, sort: 'desc', from: range?.from, to: range?.to })
  ]);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.status === 'Completed').length;
  const openTasks = totalTasks - completedTasks;
  const projectMap = new Map(projects.map((project) => [String(project._id), project.name]));

  writeDocHeader(doc, 'Cyberify AI Client Meeting Assistant', 'Workspace Report');

  sectionHeading(doc, 'Workspace Summary');
  keyValueLine(doc, 'Workspace', workspace.name);
  keyValueLine(doc, 'Total Projects', projects.length);
  keyValueLine(doc, 'Total Meetings', meetings.length);
  keyValueLine(doc, 'Total Tasks', totalTasks);
  keyValueLine(doc, 'Completed Tasks', completedTasks);
  keyValueLine(doc, 'Open Tasks', openTasks);

  sectionHeading(doc, 'Projects');
  if (!projects.length) {
    doc.fontSize(10).fillColor('#64748b').text('No projects found for this workspace.');
  } else {
    for (const project of projects) {
      ensurePageBreak(doc);
      doc.fontSize(11).fillColor('#0f172a').text(truncateText(project.name, 120), { continued: false });
      keyValueLine(doc, 'Client Name', project.clientName || 'N/A');
      keyValueLine(doc, 'Status', project.status || 'N/A');
      keyValueLine(doc, 'Description', truncateText(project.description, 260));
      doc.moveDown(0.6);
    }
  }

  sectionHeading(doc, 'Meetings');
  if (!meetings.length) {
    doc.fontSize(10).fillColor('#64748b').text('No meetings found for this workspace.');
  } else {
    for (const meeting of meetings) {
      ensurePageBreak(doc);
      doc.fontSize(11).fillColor('#0f172a').text(truncateText(meeting.title, 120));
      keyValueLine(doc, 'Date', new Date(meeting.date).toLocaleString());
      keyValueLine(doc, 'Meeting Notes', truncateText(meeting.notes, 280));
      doc.moveDown(0.6);
    }
  }

  sectionHeading(doc, 'Tasks');
  if (!tasks.length) {
    doc.fontSize(10).fillColor('#64748b').text('No tasks found for this workspace.');
  } else {
    for (const task of tasks) {
      ensurePageBreak(doc);
      doc.fontSize(11).fillColor('#0f172a').text(truncateText(task.title, 120));
      keyValueLine(doc, 'Priority', task.priority || 'Medium');
      keyValueLine(doc, 'Status', task.status === 'Completed' ? 'Completed' : 'Pending');
      keyValueLine(doc, 'Linked Project', task.projectId ? projectMap.get(String(task.projectId)) || 'N/A' : 'N/A');
      doc.moveDown(0.6);
    }
  }

  sectionHeading(doc, 'AI Analysis');
  if (!analysis) {
    doc.fontSize(10).fillColor('#64748b').text('No AI analysis found for this workspace.');
  } else {
    keyValueLine(doc, 'Project Summary', analysis.summary || 'N/A');
    sectionTableLike(doc, [
      { label: 'Functional Requirements', value: (analysis.functionalRequirements || []).join(', ') || 'N/A' },
      { label: 'User Roles', value: (analysis.userRoles || []).join(', ') || 'N/A' },
      { label: 'Suggested Database Entities', value: (analysis.entities || []).join(', ') || 'N/A' },
      { label: 'Development Timeline', value: (analysis.timeline || []).join(', ') || 'N/A' }
    ]);
    sectionHeading(doc, 'AI Generated Tasks');
    if (!analysis.tasks?.length) {
      doc.fontSize(10).fillColor('#64748b').text('No AI-generated tasks found.');
    } else {
      for (const task of analysis.tasks) {
        ensurePageBreak(doc);
        doc.fontSize(11).fillColor('#0f172a').text(truncateText(task.title, 120));
        keyValueLine(doc, 'Description', truncateText(task.description, 220));
        keyValueLine(doc, 'Priority', task.priority || 'Medium');
        doc.moveDown(0.5);
      }
    }
  }

  sectionHeading(doc, 'AI Risk Analysis');
  if (!analysis) {
    doc.fontSize(10).fillColor('#64748b').text('No AI risks found for this workspace.');
  } else {
    const legacyRisks = analysis.risks || [];
    const riskAnalysis = analysis.riskAnalysis || {
      missingRequirements: legacyRisks.filter((risk: string) => /missing|not specified|unspecified/i.test(risk)),
      ambiguousRequirements: legacyRisks.filter((risk: string) => /ambiguous|unclear|vague/i.test(risk)),
      potentialRisks: legacyRisks
    };
    sectionTableLike(doc, [
      { label: 'Missing Requirements', value: riskAnalysis.missingRequirements?.length ? riskAnalysis.missingRequirements.join(', ') : 'N/A' },
      { label: 'Ambiguous Requirements', value: riskAnalysis.ambiguousRequirements?.length ? riskAnalysis.ambiguousRequirements.join(', ') : 'N/A' },
      { label: 'Potential Risks', value: riskAnalysis.potentialRisks?.length ? riskAnalysis.potentialRisks.join(', ') : 'N/A' }
    ]);
  }

  sectionHeading(doc, 'Activity Logs');
  if (!activities.items.length) {
    doc.fontSize(10).fillColor('#64748b').text('No activity logs found.');
  } else {
    for (const activity of activities.items) {
      ensurePageBreak(doc);
      doc.fontSize(10).fillColor('#0f172a').text(truncateText(activity.type, 120));
      keyValueLine(doc, 'Timestamp', new Date(activity.createdAt).toLocaleString());
      keyValueLine(doc, 'Entity', `${activity.entityType || 'N/A'} ${activity.entityId ? `(${activity.entityId})` : ''}`);
      if (activity.meta && Object.keys(activity.meta).length > 0) {
        keyValueLine(doc, 'Meta', JSON.stringify(activity.meta));
      }
      doc.moveDown(0.5);
    }
  }

  await recordActivity({
    workspaceId,
    userId,
    type: 'Workspace Report Exported',
    entityType: 'workspace',
    entityId: workspaceId,
    meta: { format: 'pdf', from: range?.from?.toISOString(), to: range?.to?.toISOString() }
  });

  return doc;
}

function ensurePageBreak(doc: PDFKit.PDFDocument, threshold = 90) {
  const bottomLimit = doc.page.height - doc.page.margins.bottom;
  if (doc.y + threshold > bottomLimit) doc.addPage();
}

export async function streamWorkspaceReportPdf(params: ExportWorkspaceReportInput) {
  return generateWorkspaceReportDoc(params);
}
