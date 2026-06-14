import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import api from '../../lib/api';
import EmptyState from '../../components/ui/EmptyState';
import Button from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { ListSkeleton } from '../../components/ui/Skeleton';

type Task = { _id: string; title: string; priority: string; status: string; projectId?: string; meetingId?: string };

export default function TasksPage() {
  const [list, setList] = useState<Task[] | null>(null);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [assigneeEmail, setAssigneeEmail] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [q, setQ] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetch = async () => {
    const r = await api.get('/api/tasks', { params: { q, status: statusFilter, priority: priorityFilter, dateFrom, dateTo } });
    setList(r.data.data);
  };

  useEffect(() => { fetch().catch(() => setList([])); }, []);

  const create = async () => {
    await api.post('/api/tasks', { title, priority, assigneeEmail: assigneeEmail || undefined });
    setTitle(''); setPriority('Medium');
    setAssigneeEmail('');
    await fetch();
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
        <h1 className="page-title">Tasks</h1>
        <p className="page-subtitle">Track AI-generated and manually created follow-ups.</p>
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader title="Create Task" subtitle="Add an ad-hoc action item." />
          <CardBody>
          <div className="space-y-2">
            <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="input" />
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
          <div className="grid gap-3 xl:grid-cols-[1fr_130px_150px_150px_150px_auto]">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tasks" className="input" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input">
              <option value="">All</option>
              <option value="Open">Open</option>
              <option value="Completed">Completed</option>
            </select>
            <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="input">
              <option value="">All priorities</option>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input" title="Created from" />
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input" title="Created to" />
            <Button onClick={fetch} variant="secondary">Filter</Button>
          </div>
          </CardBody>

          {!list && <ListSkeleton />}
          {list && list.length === 0 && <EmptyState title="No tasks found" subtitle="Create a task, run AI analysis, or loosen the filters." />}
          {list && list.length > 0 && (
            <ul className="divide-y divide-slate-200 dark:divide-slate-800">
              {list.map(t => (
                <li key={t._id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-950 dark:text-white">{t.title}</div>
                    <div className="mt-1 flex flex-wrap gap-2">
                      <span className="badge">{t.priority}</span>
                      <span className="badge">{t.status}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {t.status !== 'Completed' && <Button onClick={() => complete(t._id)} variant="ghost" className="text-emerald-600 dark:text-emerald-400">Complete</Button>}
                    <Button onClick={() => remove(t._id)} variant="ghost" className="text-red-600 dark:text-red-400">Delete</Button>
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
