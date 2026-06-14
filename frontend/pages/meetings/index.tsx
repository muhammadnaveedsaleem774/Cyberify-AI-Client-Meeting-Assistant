import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import api from '../../lib/api';
import { normalizeAnalysis, NormalizedAnalysis, NormalizedTask } from '../../lib/ai';
import EmptyState from '../../components/ui/EmptyState';
import Button from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { ListSkeleton } from '../../components/ui/Skeleton';

type Meeting = { _id: string; title: string; date: string; notes?: string; projectId?: string };

function RiskCategory({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-red-100 bg-red-50 p-3 dark:border-red-900/50 dark:bg-red-950/30">
      <div className="text-sm font-semibold text-red-900 dark:text-red-200">{title}</div>
      {items.length > 0 ? (
        <ul className="mt-2 list-disc pl-5 text-sm text-red-800 dark:text-red-200">
          {items.map((item, i) => <li key={`${title}-${i}`}>{item}</li>)}
        </ul>
      ) : (
        <div className="mt-2 text-sm text-red-700/70 dark:text-red-200/70">None identified</div>
      )}
    </div>
  );
}

export default function MeetingsPage() {
  const [list, setList] = useState<Meeting[] | null>(null);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [projectId, setProjectId] = useState<string | undefined>(undefined);
  const [newProjectName, setNewProjectName] = useState('');
  const [projects, setProjects] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [analysis, setAnalysis] = useState<NormalizedAnalysis | null>(null);
  const [tasksPreview, setTasksPreview] = useState<NormalizedTask[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [savingWorkflow, setSavingWorkflow] = useState(false);
  const [workflowError, setWorkflowError] = useState<string | null>(null);

  const fetch = async () => {
    const r = await api.get('/api/meetings', { params: { q, dateFrom, dateTo } });
    setList(r.data.data);
    const p = await api.get('/api/projects');
    setProjects(p.data.data || []);
  };

  useEffect(() => { fetch().catch(() => setList([])); }, []);

  const create = async () => {
    await api.post('/api/meetings', { title, date, notes, projectId });
    setTitle(''); setDate(''); setNotes(''); setProjectId(undefined);
    await fetch();
  };

  const analyzeWithAI = async () => {
    setWorkflowError(null);
    if (!title.trim()) return setWorkflowError('Title is required before AI analysis');
    if (!notes.trim()) return setWorkflowError('Meeting notes are required before AI analysis');
    setAnalyzing(true);
    try {
      const res = await api.post('/api/ai/analyze-notes', { title, date: date || new Date().toISOString(), notes });
      const normalized = normalizeAnalysis(res.data.data);
      if (!normalized) throw new Error('AI response was empty');
      setAnalysis(normalized);
      setTasksPreview(normalized.tasks);
    } catch (err: any) {
      setWorkflowError(err?.response?.data?.message || err?.message || 'AI analysis failed');
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

  const addTaskPreview = () => {
    setTasksPreview((prev) => [...prev, { title: '', description: '', priority: 'Medium' }]);
  };

  const removeTaskPreview = (idx: number) => {
    setTasksPreview((prev) => prev.filter((_, index) => index !== idx));
  };

  const saveConfirmedWorkflow = async () => {
    setWorkflowError(null);
    if (!analysis) return setWorkflowError('Analyze with AI before saving');
    if (!date) return setWorkflowError('Meeting date is required');
    setSavingWorkflow(true);
    try {
      await api.post('/api/ai/confirm-analysis', {
        title,
        date,
        notes,
        projectId,
        newProject: !projectId && newProjectName.trim() ? { name: newProjectName.trim(), description: analysis.summary, status: 'active' } : undefined,
        analysis: {
          ...analysis,
          tasks: tasksPreview.filter((task) => task.title.trim())
        }
      });
      setTitle('');
      setDate('');
      setNotes('');
      setProjectId(undefined);
      setNewProjectName('');
      setAnalysis(null);
      setTasksPreview([]);
      await fetch();
    } catch (err: any) {
      setWorkflowError(err?.response?.data?.message || err?.message || 'Failed to save AI workflow');
    } finally {
      setSavingWorkflow(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete meeting?')) return;
    await api.delete(`/api/meetings/${id}`);
    await fetch();
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <div className="mb-3 inline-flex rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/40 dark:text-violet-300">
          AI workflow
        </div>
        <h1 className="page-title">Meetings</h1>
        <p className="page-subtitle">Capture notes, analyze requirements, and confirm generated work.</p>
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader title="New Meeting" subtitle="Analyze notes before saving or save directly." />
          <CardBody>
          <div className="space-y-4">
            <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="input" />
            <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
            <select value={projectId || ''} onChange={(e) => setProjectId(e.target.value || undefined)} className="input">
              <option value="">No project</option>
              {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
            {!projectId && (
              <input placeholder="Or create new project from AI summary" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} className="input" />
            )}
            <textarea placeholder="Meeting notes" className="input min-h-[140px]" value={notes} onChange={(e) => setNotes(e.target.value)} />
            {workflowError && <div className="alert-error">{workflowError}</div>}
            <div className="flex flex-wrap gap-2">
              <Button onClick={analyzeWithAI} disabled={analyzing}>
                {analyzing ? 'Analyzing...' : 'Analyze with AI'}
              </Button>
              <Button onClick={create} variant="secondary">Save without AI</Button>
            </div>

            {analysis && (
              <div className="mt-5 space-y-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">AI requirement report</div>
                  <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">Review, edit tasks, then save this workflow into the workspace.</div>
                </div>
                <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <h5 className="font-semibold text-slate-950 dark:text-white">Project Summary</h5>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{analysis.summary || 'No summary generated'}</p>
                </section>
                <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <h5 className="font-semibold text-slate-950 dark:text-white">Functional Requirements</h5>
                  {analysis.functionalRequirements.length > 0 ? <ul className="list-disc pl-5 text-sm text-slate-600 dark:text-slate-300">{analysis.functionalRequirements.map((item, i) => <li key={i}>{item}</li>)}</ul> : <div className="text-sm text-slate-500">None generated</div>}
                </section>
                <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <h5 className="font-semibold text-slate-950 dark:text-white">User Roles</h5>
                  <div className="text-sm text-slate-600 dark:text-slate-300">{analysis.userRoles.join(', ') || 'No roles generated'}</div>
                </section>
                <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <h5 className="font-semibold text-slate-950 dark:text-white">Database Entities</h5>
                  {analysis.entities.length > 0 ? <ul className="list-disc pl-5 text-sm text-slate-600 dark:text-slate-300">{analysis.entities.map((item, i) => <li key={i}>{item}</li>)}</ul> : <div className="text-sm text-slate-500">None generated</div>}
                </section>
                <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <h5 className="font-semibold text-slate-950 dark:text-white">Timeline</h5>
                  {analysis.timeline.length > 0 ? <ul className="list-disc pl-5 text-sm text-slate-600 dark:text-slate-300">{analysis.timeline.map((item, i) => <li key={i}>{item}</li>)}</ul> : <div className="text-sm text-slate-500">None generated</div>}
                </section>
                <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <h5 className="font-semibold text-slate-950 dark:text-white">Risk Alerts</h5>
                  <div className="mt-2 grid gap-2">
                    <RiskCategory title="Missing Requirements" items={analysis.riskAnalysis.missingRequirements} />
                    <RiskCategory title="Ambiguous Requirements" items={analysis.riskAnalysis.ambiguousRequirements} />
                    <RiskCategory title="Potential Risks" items={analysis.riskAnalysis.potentialRisks} />
                  </div>
                </section>
                <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between">
                    <h5 className="font-semibold text-slate-950 dark:text-white">Generated Tasks</h5>
                    <Button onClick={addTaskPreview} variant="ghost" className="text-blue-600 dark:text-blue-300">Add task</Button>
                  </div>
                  <div className="space-y-2">
                    {tasksPreview.map((task, idx) => (
                      <div key={idx} className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/60">
                        <input value={task.title} onChange={(e) => updateTaskPreview(idx, { title: e.target.value })} className="input" />
                        <textarea value={task.description || ''} onChange={(e) => updateTaskPreview(idx, { description: e.target.value })} className="input" rows={2} />
                        <div className="flex gap-2">
                          <select value={task.priority || 'Medium'} onChange={(e) => updateTaskPreview(idx, { priority: e.target.value as NormalizedTask['priority'] })} className="input max-w-[160px]">
                            <option>Low</option>
                            <option>Medium</option>
                            <option>High</option>
                          </select>
                          <Button onClick={() => removeTaskPreview(idx)} variant="ghost" className="text-red-600 dark:text-red-400">Remove</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
                <Button onClick={saveConfirmedWorkflow} disabled={savingWorkflow} variant="success" className="w-full">
                  {savingWorkflow ? 'Saving...' : 'Confirm & Save AI Workflow'}
                </Button>
              </div>
            )}
          </div>
          </CardBody>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader title="Meeting History" subtitle="Browse saved meetings and open details for analysis." />
          <CardBody className="border-b border-slate-200 dark:border-slate-800">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_150px_150px_auto]">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search meetings" className="input" />
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input" title="Meeting from" />
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input" title="Meeting to" />
            <Button onClick={fetch} variant="secondary">Filter</Button>
          </div>
          </CardBody>
          {!list && <ListSkeleton />}
          {list && list.length === 0 && <EmptyState title="No meetings yet" subtitle="Create a meeting or adjust your search filters." />}
          {list && list.length > 0 && (
            <ul className="divide-y divide-slate-200 dark:divide-slate-800">
              {list.map(m => (
                <li key={m._id} className="flex flex-col gap-4 p-4 transition hover:bg-slate-50/80 dark:hover:bg-slate-950/40 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-sm font-bold text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
                      {m.title.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                    <div className="font-semibold text-slate-950 dark:text-white">{m.title}</div>
                    <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{new Date(m.date).toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => location.href = `/meetings/${m._id}`} variant="secondary">Open</Button>
                    <Button onClick={() => remove(m._id)} variant="ghost" className="text-red-600 dark:text-red-400">Delete</Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
