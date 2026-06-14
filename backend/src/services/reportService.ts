import PDFDocument from 'pdfkit';
import WorkspaceModel from '../models/workspace.model';
import { getWorkspaceStats } from './dashboardService';
import { listActivities } from './activityService';

function formatDate(value?: Date | string | null) {
  if (!value) return '-';
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString();
}

function safeText(value: unknown) {
  if (value === null || value === undefined) return '-';
  return String(value);
}

export async function buildWorkspaceReport(workspaceId: string) {
  const [workspace, stats, activities] = await Promise.all([
    WorkspaceModel.findById(workspaceId).lean(),
    getWorkspaceStats(workspaceId),
    listActivities({ workspaceId, page: 1, limit: 10, sort: 'desc' })
  ]);

  return { workspace, stats, activities };
}

export async function writeWorkspaceReportPdf(doc: PDFKit.PDFDocument, workspaceId: string) {
  const report = await buildWorkspaceReport(workspaceId);

  doc.fontSize(18).fillColor('#0f172a').text('Cyberify AI Client Meeting Assistant', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(12).fillColor('#475569').text('Workspace Report', { align: 'center' });
  doc.moveDown(1);

  doc.fontSize(12).fillColor('#0f172a').text(`Workspace: ${safeText(report.workspace?.name)}`);
  doc.text(`Generated At: ${formatDate(new Date())}`);
  doc.text(`Owner ID: ${safeText(report.workspace?.ownerId)}`);
  doc.moveDown(1);

  doc.fontSize(14).fillColor('#0f172a').text('Summary');
  doc.moveDown(0.5);
  const summaryRows = [
    ['Total Projects', report.stats.totalProjects],
    ['Total Meetings', report.stats.totalMeetings],
    ['Open Tasks', report.stats.openTasks],
    ['Completed Tasks', report.stats.completedTasks]
  ];
  for (const [label, value] of summaryRows) {
    doc.fontSize(11).fillColor('#334155').text(`${label}: ${value}`);
  }

  doc.moveDown(1);
  doc.fontSize(14).fillColor('#0f172a').text('Projects by Status');
  Object.entries(report.stats.projectsByStatus || {}).forEach(([status, count]) => {
    doc.fontSize(11).fillColor('#334155').text(`${status}: ${count}`);
  });

  doc.moveDown(1);
  doc.fontSize(14).fillColor('#0f172a').text('Tasks by Status');
  Object.entries(report.stats.tasksByStatus || {}).forEach(([status, count]) => {
    doc.fontSize(11).fillColor('#334155').text(`${status}: ${count}`);
  });

  doc.moveDown(1);
  doc.fontSize(14).fillColor('#0f172a').text('Meetings by Date');
  Object.entries(report.stats.meetingsByDate || {}).forEach(([date, count]) => {
    doc.fontSize(11).fillColor('#334155').text(`${date}: ${count}`);
  });

  doc.addPage();
  doc.fontSize(14).fillColor('#0f172a').text('Recent Activity');
  doc.moveDown(0.5);
  if (!report.activities.items.length) {
    doc.fontSize(11).fillColor('#64748b').text('No activity found.');
  } else {
    report.activities.items.forEach((activity, index) => {
      doc.fontSize(11).fillColor('#0f172a').text(`${index + 1}. ${safeText(activity.type)} - ${formatDate(activity.createdAt)}`);
      doc.fillColor('#475569').text(`   Entity: ${safeText(activity.entityType)} ${activity.entityId ? `(${activity.entityId})` : ''}`);
      if (activity.meta && Object.keys(activity.meta).length > 0) {
        doc.fillColor('#64748b').text(`   Meta: ${JSON.stringify(activity.meta)}`);
      }
      doc.moveDown(0.5);
    });
  }

  return doc;
}
