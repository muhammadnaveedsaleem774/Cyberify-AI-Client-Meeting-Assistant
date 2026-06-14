import AIAnalysisModel, { IAIAnalysis, IGeneratedTask } from '../models/ai.model';
import MeetingModel, { IMeeting } from '../models/meeting.model';
import * as taskService from './taskService';
import type { CreateTaskDTO } from './taskService';
import * as projectService from './projectService';
import { analyzeWithProvider, AnalysisResult } from '../providers/ai';
import { recordActivity } from './activityService';
import notifications from './notificationsService';

export type AnalyzeNotesDTO = {
  title: string;
  notes: string;
  date?: string | Date;
};

export type ConfirmAnalysisDTO = {
  title: string;
  notes: string;
  date: string | Date;
  projectId?: string;
  newProject?: {
    name: string;
    clientName?: string;
    description?: string;
    status?: string;
  };
  analysis: AnalysisResult;
};

function normalizeConfirmedAnalysis(value: AnalysisResult): AnalysisResult {
  const riskAnalysis = {
    missingRequirements: Array.isArray(value.riskAnalysis?.missingRequirements) ? value.riskAnalysis.missingRequirements.map(String).filter(Boolean) : [],
    ambiguousRequirements: Array.isArray(value.riskAnalysis?.ambiguousRequirements) ? value.riskAnalysis.ambiguousRequirements.map(String).filter(Boolean) : [],
    potentialRisks: Array.isArray(value.riskAnalysis?.potentialRisks) ? value.riskAnalysis.potentialRisks.map(String).filter(Boolean) : []
  };
  const legacyRisks = Array.isArray(value.risks) ? value.risks.map(String).filter(Boolean) : [];
  const risks = [
    ...riskAnalysis.missingRequirements,
    ...riskAnalysis.ambiguousRequirements,
    ...riskAnalysis.potentialRisks,
    ...legacyRisks
  ].filter((risk, index, all) => risk && all.indexOf(risk) === index);

  return {
    summary: String(value.summary || '').trim(),
    functionalRequirements: Array.isArray(value.functionalRequirements) ? value.functionalRequirements.map(String).filter(Boolean) : [],
    userRoles: Array.isArray(value.userRoles) ? value.userRoles.map(String).filter(Boolean) : [],
    entities: Array.isArray(value.entities) ? value.entities.map(String).filter(Boolean) : [],
    timeline: Array.isArray(value.timeline) ? value.timeline.map(String).filter(Boolean) : [],
    risks,
    riskAnalysis,
    tasks: Array.isArray(value.tasks)
      ? value.tasks
          .map((task) => ({
            title: String(task.title || '').trim(),
            description: task.description ? String(task.description).trim() : undefined,
            priority: ['Low', 'Medium', 'High'].includes(String(task.priority)) ? task.priority : 'Medium'
          }))
          .filter((task) => task.title)
      : []
  };
}

async function persistAnalysis({
  meetingId,
  workspaceId,
  userId,
  analysis
}: {
  meetingId: string;
  workspaceId: string;
  userId: string;
  analysis: AnalysisResult;
}) {
  const existing = await AIAnalysisModel.findOne({ meetingId, workspaceId });
  const payload = {
    createdBy: userId,
    summary: analysis.summary,
    functionalRequirements: analysis.functionalRequirements,
    userRoles: analysis.userRoles,
    requirements: analysis.functionalRequirements,
    roles: analysis.userRoles,
    entities: analysis.entities,
    timeline: analysis.timeline,
    tasks: analysis.tasks as IGeneratedTask[],
    risks: analysis.risks,
    riskAnalysis: analysis.riskAnalysis
  };

  if (existing) {
    Object.assign(existing, payload);
    return existing.save();
  }

  return AIAnalysisModel.create({
    meetingId,
    workspaceId,
    ...payload
  });
}

export async function analyzeNotes(data: AnalyzeNotesDTO): Promise<AnalysisResult> {
  const meetingLike = {
    title: data.title,
    notes: data.notes,
    date: data.date ? new Date(data.date) : new Date()
  } as IMeeting;
  return analyzeWithProvider(meetingLike);
}

export async function analyzeMeeting(meetingId: string, workspaceId: string, userId: string): Promise<IAIAnalysis> {
  const meeting = await MeetingModel.findOne({ _id: meetingId, workspaceId }).lean();
  if (!meeting) throw { status: 404, message: 'Meeting not found' };

  // Call provider
  const analysis: AnalysisResult = await analyzeWithProvider(meeting as IMeeting);

  const doc = await persistAnalysis({ meetingId, workspaceId, userId, analysis });

  try { await recordActivity({ workspaceId, userId, type: 'AI Analysis Generated', meta: { analysisId: String(doc._id), meetingId } }); } catch {}
  try { notifications.notify(workspaceId, 'ai.analysis.generated', { analysisId: String(doc._id), meetingId }); } catch {}

  return doc;
}

export async function confirmAnalysis(data: ConfirmAnalysisDTO, workspaceId: string, userId: string) {
  const analysis = normalizeConfirmedAnalysis(data.analysis);
  if (!analysis.summary) throw { status: 400, message: 'Analysis summary is required' };

  let projectId = data.projectId;
  if (!projectId && data.newProject?.name) {
    const project = await projectService.createProject({
      name: data.newProject.name,
      clientName: data.newProject.clientName,
      description: data.newProject.description || analysis.summary,
      status: data.newProject.status || 'active',
      workspaceId,
      createdBy: userId
    });
    projectId = String(project._id);
  }

  const meeting = await MeetingModel.create({
    title: data.title,
    notes: data.notes,
    date: new Date(data.date),
    projectId,
    workspaceId,
    createdBy: userId
  });

  const savedAnalysis = await persistAnalysis({
    meetingId: String(meeting._id),
    workspaceId,
    userId,
    analysis
  });

  const tasks = [];
  for (const task of analysis.tasks) {
    const taskDto: CreateTaskDTO = {
      title: task.title,
      description: task.description,
      priority: task.priority || 'Medium',
      status: 'Open',
      projectId,
      meetingId: String(meeting._id),
      workspaceId,
      createdBy: userId
    };
    tasks.push(await taskService.createTask(taskDto));
  }

  try {
    await recordActivity({
      workspaceId,
      userId,
      type: 'AI Workflow Confirmed',
      meta: { meetingId: String(meeting._id), analysisId: String(savedAnalysis._id), taskCount: tasks.length, projectId }
    });
  } catch {}
  try {
    notifications.notify(workspaceId, 'aiWorkflowConfirmed', { meetingId: String(meeting._id), taskCount: tasks.length }, `AI workflow saved with ${tasks.length} tasks`);
  } catch {}

  return { meeting, analysis: savedAnalysis, tasks, projectId };
}

export async function getAnalysisForMeeting(meetingId: string, workspaceId: string): Promise<IAIAnalysis | null> {
  const doc = await AIAnalysisModel.findOne({ meetingId, workspaceId }).lean();
  return doc as IAIAnalysis | null;
}

export async function deleteAnalysisForMeeting(meetingId: string, workspaceId: string, userId: string): Promise<void> {
  const doc = await AIAnalysisModel.findOneAndDelete({ meetingId, workspaceId });
  if (!doc) throw { status: 404, message: 'Analysis not found' };
  try { await recordActivity({ workspaceId, userId, type: 'AI Analysis Deleted', meta: { analysisId: String(doc._id), meetingId } }); } catch {}
  try { notifications.notify(workspaceId, 'ai.analysis.deleted', { analysisId: String(doc._id), meetingId }); } catch {}
}
