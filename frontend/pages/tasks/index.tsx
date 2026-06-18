import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import api from '../../lib/api';
import EmptyState from '../../components/ui/EmptyState';
import Button from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { ListSkeleton } from '../../components/ui/Skeleton';

type Task = {
  _id: string;
  title: string;
  description?: string;
  priority: string;
  status: string;
  assigneeEmail?: string;
  projectId?: string;
  meetingId?: string;
};

function priorityClass(priority: string) {
  if (priority === 'High') return 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300';
  if (priority === 'Low') return 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300';
  return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300';
}

export default function TasksPage() {
  const [list, setList] = useState<Task[] | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [assigneeEmail, setAssigneeEmail] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [q, setQ] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    status: 'Open',
    assigneeEmail: ''
  });
  const [editError, setEditError] = useState<string | null>(null);

  const fetch = async () => {
    const r = await api.get('/api/tasks', { params: { q, status: statusFilter, priority: priorityFilter, dateFrom, dateTo } });
    setList(r.data.data);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetch().catch(() => setList([]));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [q, statusFilter, priorityFilter, dateFrom, dateTo]);

  const create = async () => {
    await api.post('/api/tasks', { title, description, priority, assigneeEmail: assigneeEmail || undefined });
    setTitle('');
    setDescription('');
    setPriority('Medium');
    setAssigneeEmail('');
    await fetch();
  };

  const startEdit = (task: Task) => {
    setEditingId(task._id);
    setEditError(null);
    setEditDraft({
      title: task.title || '',
      description: task.description || '',
      priority: task.priority || 'Medium',
      status: task.status || 'Open',
      assigneeEmail: task.assigneeEmail || ''
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditError(null);
  };

  const saveEdit = async (id: string) => {
    setEditError(null);
    if (!editDraft.title.trim()) {
      setEditError('Task title is required');
      return;
    }

    try {
      await api.put(`/api/tasks/${id}`, {
        title: editDraft.title.trim(),
        description: editDraft.description,
        priority: editDraft.priority,
        status: editDraft.status,
        assigneeEmail: editDraft.assigneeEmail.trim() || undefined
      });
      setEditingId(null);
      await fetch();
    } catch (err: any) {
      setEditError(err?.response?.data?.message || err?.message || 'Failed to update task');
    }
  };

  const complete = async (id: string) => {
    await api.patch(`/api/tasks/${id}/complete`);
    await fetch();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete task?')) return;
    await api.delete(`/api/tasks/${id}`);
    await fetch();
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <div className="mb-3 inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          Delivery queue
        </div>
        <h1 className="page-title">Tasks</h1>
        <p className="page-subtitle">Track AI-generated and manually created follow-ups.</p>
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader title="Create Task" subtitle="Add an ad-hoc action item." />
          <CardBody>
          <div className="space-y-4">
            <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="input" />
            <textarea placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} className="input min-h-[90px]" />
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className="input">
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
            <input placeholder="Assignee email (optional)" value={assigneeEmail} onChange={(e) => setAssigneeEmail(e.target.value)} className="input" />
            <Button onClick={create} variant="success">Create</Button>
          </div>
          </CardBody>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader title="Task Queue" subtitle="Combine search, status, priority, and date filters." />
          <CardBody className="border-b border-slate-200 dark:border-slate-800">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-[minmax(220px,1fr)_150px_160px_160px_160px_auto]">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tasks" className="input sm:col-span-2 lg:col-span-1" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input min-w-0">
              <option value="">All</option>
              <option value="Open">Open</option>
              <option value="Completed">Completed</option>
            </select>
            <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="input min-w-0">
              <option value="">All priorities</option>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input min-w-0" title="Created from" />
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input min-w-0" title="Created to" />
            <Button onClick={fetch} variant="secondary" className="w-full 2xl:w-auto">Apply</Button>
          </div>
          </CardBody>

          {!list && <ListSkeleton />}
          {list && list.length === 0 && <EmptyState title="No tasks found" subtitle="Create a task, run AI analysis, or loosen the filters." />}
          {list && list.length > 0 && (
            <ul className="divide-y divide-slate-200 dark:divide-slate-800">
              {list.map(t => (
                <li key={t._id} className="flex flex-col gap-4 p-4 transition hover:bg-slate-50/80 dark:hover:bg-slate-950/40 sm:flex-row sm:items-center sm:justify-between">
                  {editingId === t._id ? (
                    <div className="w-full space-y-3">
                      <div className="grid gap-3 lg:grid-cols-2">
                        <input value={editDraft.title} onChange={(e) => setEditDraft((prev) => ({ ...prev, title: e.target.value }))} className="input" placeholder="Task title" />
                        <input value={editDraft.assigneeEmail} onChange={(e) => setEditDraft((prev) => ({ ...prev, assigneeEmail: e.target.value }))} className="input" placeholder="Assignee email" />
                        <select value={editDraft.priority} onChange={(e) => setEditDraft((prev) => ({ ...prev, priority: e.target.value }))} className="input">
                          <option>Low</option>
                          <option>Medium</option>
                          <option>High</option>
                        </select>
                        <select value={editDraft.status} onChange={(e) => setEditDraft((prev) => ({ ...prev, status: e.target.value }))} className="input">
                          <option>Open</option>
                          <option>Completed</option>
                        </select>
                      </div>
                      <textarea value={editDraft.description} onChange={(e) => setEditDraft((prev) => ({ ...prev, description: e.target.value }))} className="input min-h-[92px]" placeholder="Description" />
                      {editError && <div className="alert-error">{editError}</div>}
                      <div className="flex flex-wrap gap-2">
                        <Button onClick={() => saveEdit(t._id)} variant="success">Save</Button>
                        <Button onClick={cancelEdit} variant="secondary">Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {t.title.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                        <div className="font-semibold text-slate-950 dark:text-white">{t.title}</div>
                        {t.description && <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t.description}</div>}
                        <div className="mt-1 flex flex-wrap gap-2">
                          <span className={`badge ${priorityClass(t.priority)}`}>{t.priority}</span>
                          <span className={`badge ${t.status === 'Completed' ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300' : ''}`}>{t.status}</span>
                        </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button onClick={() => startEdit(t)} variant="secondary">Edit</Button>
                        {t.status !== 'Completed' && <Button onClick={() => complete(t._id)} variant="ghost" className="text-emerald-600 dark:text-emerald-400">Complete</Button>}
                        <Button onClick={() => remove(t._id)} variant="ghost" className="text-red-600 dark:text-red-400">Delete</Button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
