import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import api from '../../lib/api';
import { normalizeAnalysis, NormalizedAnalysis, NormalizedTask } from '../../lib/ai';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { PageSkeleton, Skeleton } from '../../components/ui/Skeleton';

type Meeting = { _id: string; title: string; date: string; notes?: string; projectId?: string };

function ListBlock({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <section className="rounded-md border border-slate-200 p-4 dark:border-slate-800">
      <h4 className="font-semibold text-slate-950 dark:text-white">{title}</h4>
      {items.length > 0 ? (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-300">
          {items.map((item, i) => <li key={`${title}-${i}`}>{item}</li>)}
        </ul>
      ) : (
        <div className="mt-3 text-sm text-slate-500 dark:text-slate-400">{empty}</div>
      )}
    </section>
  );
}

export default function MeetingDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<NormalizedAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [tasksPreview, setTasksPreview] = useState<NormalizedTask[]>([]);
  const [savingTasks, setSavingTasks] = useState(false);
  const [saveTasksError, setSaveTasksError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    setLoading(true);
    api.get(`/api/meetings/${id}`).then(async (r) => {
      if (!mounted) return;
      setMeeting(r.data.data);
      const pid = r.data.data?.projectId;
      if (pid) {
        try {
          const p = await api.get(`/api/projects/${pid}`);
          if (mounted) setProjectName(p.data.data?.name || null);
        } catch (_) {
          if (mounted) setProjectName(null);
        }
      }
      try {
        const a = await api.get(`/api/ai/analysis/${id}`);
        const payload = normalizeAnalysis(a.data.data);
        if (mounted && payload) {
          setAnalysis(payload);
          setTasksPreview(payload.tasks || []);
        }
      } catch (_) {
        // Analysis is optional for older meetings.
      }
    }).catch((err) => {
      if (mounted) setError(err?.message || 'Failed to load');
    }).finally(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, [id]);

  const remove = async () => {
    if (!confirm('Delete meeting?')) return;
    try {
      await api.delete(`/api/meetings/${id}`);
      router.push('/meetings');
    } catch (err: any) {
      setError(err?.message || 'Failed to delete');
    }
  };

  const analyzeMeeting = async () => {
    if (!id) return;
    setAnalysis(null);
    setAnalysisError(null);
    setAnalyzing(true);
    try {
      const res = await api.post('/api/ai/analyze-meeting', { meetingId: id });
      const data = normalizeAnalysis(res.data.data);
      if (!data) throw new Error('Analysis response was empty');
      setAnalysis(data);
      setTasksPreview(data.tasks || []);
    } catch (err: any) {
      setAnalysisError(err?.response?.data?.message || err?.message || 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const updateTaskPreview = (idx: number, patch: Partial<NormalizedTask>) => {
    setTasksPreview((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], ...patch };
      return copy;
    });
  };

  const saveTasks = async () => {
    if (tasksPreview.length === 0) return;
    setSavingTasks(true);
    setSaveTasksError(null);
    try {
      for (const t of tasksPreview) {
        await api.post('/api/tasks', { title: t.title, description: t.description, priority: t.priority, meetingId: id });
      }
      router.replace(router.asPath);
    } catch (err: any) {
      setSaveTasksError(err?.response?.data?.message || err?.message || 'Failed to save tasks');
    } finally {
      setSavingTasks(false);
    }
  };

  if (loading) return <DashboardLayout><PageSkeleton /></DashboardLayout>;
  if (error) return <DashboardLayout><div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">{error}</div></DashboardLayout>;
  if (!meeting) return <DashboardLayout><EmptyState title="Meeting not found" subtitle="This meeting does not exist or is outside your workspace." /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="page-title">{meeting.title}</h1>
            <p className="page-subtitle">{new Date(meeting.date).toLocaleString()}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => router.push(`/meetings/${id}/edit`)} variant="secondary">Edit</Button>
            <Button onClick={remove} variant="danger">Delete</Button>
          </div>
        </div>

        <Card>
          <CardHeader title="Meeting Details" subtitle={projectName ? `Project: ${projectName}` : 'Project: Unlinked'} />
          <CardBody>
            <div className="whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-300">{meeting.notes || 'No notes were added for this meeting.'}</div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="AI Analysis"
            subtitle="Generate summary, requirements, tasks, risks, and project structure from these meeting notes."
            action={<Button onClick={analyzeMeeting} loading={analyzing}>{analysis ? 'Analyze Again' : 'Analyze Meeting'}</Button>}
          />
          <CardBody>
            {analysisError && <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">{analysisError}</div>}
            {!analysis && !analyzing && <EmptyState title="No analysis yet" subtitle="Run AI analysis to extract requirements, roles, entities, tasks, and risks." />}
            {analyzing && (
              <div className="space-y-3">
                <Skeleton className="h-24" />
                <Skeleton className="h-32" />
                <Skeleton className="h-24" />
              </div>
            )}
            {analysis && (
              <div className="space-y-4">
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  Saved: {analysis.updatedAt ? new Date(analysis.updatedAt).toLocaleString() : (analysis.createdAt ? new Date(analysis.createdAt).toLocaleString() : 'Just now')}
                </div>
                <section className="rounded-md border border-slate-200 p-4 dark:border-slate-800">
                  <h4 className="font-semibold text-slate-950 dark:text-white">Project Summary</h4>
                  <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">{analysis.summary || 'No summary generated.'}</p>
                </section>
                <ListBlock title="Functional Requirements" items={analysis.functionalRequirements} empty="No requirements generated." />
                <div className="grid gap-4 lg:grid-cols-2">
                  <ListBlock title="User Roles" items={analysis.userRoles} empty="No roles generated." />
                  <ListBlock title="Database Entities" items={analysis.entities} empty="No entities generated." />
                </div>
                <ListBlock title="Development Timeline" items={analysis.timeline} empty="No timeline generated." />
                <section className="rounded-md border border-slate-200 p-4 dark:border-slate-800">
                  <h4 className="font-semibold text-slate-950 dark:text-white">Generated Tasks</h4>
                  {tasksPreview.length === 0 && <div className="mt-3 text-sm text-slate-500 dark:text-slate-400">No tasks generated.</div>}
                  {tasksPreview.length > 0 && (
                    <div className="mt-3 space-y-3">
                      {tasksPreview.map((t, idx) => (
                        <div key={idx} className="rounded-md border border-slate-200 p-3 dark:border-slate-800">
                          <input className="input mb-2" value={t.title} onChange={(e) => updateTaskPreview(idx, { title: e.target.value })} />
                          <textarea className="input mb-2 min-h-[92px]" value={t.description || ''} onChange={(e) => updateTaskPreview(idx, { description: e.target.value })} />
                          <select className="input" value={t.priority || 'medium'} onChange={(e) => updateTaskPreview(idx, { priority: e.target.value as NormalizedTask['priority'] })}>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                        </div>
                      ))}
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <Button onClick={saveTasks} loading={savingTasks} variant="success">{savingTasks ? 'Saving...' : 'Save Tasks'}</Button>
                        {saveTasksError && <div className="text-sm text-red-600 dark:text-red-400">{saveTasksError}</div>}
                      </div>
                    </div>
                  )}
                </section>
                <ListBlock title="Risks" items={analysis.risks} empty="No risks identified." />
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </DashboardLayout>
  );
}
