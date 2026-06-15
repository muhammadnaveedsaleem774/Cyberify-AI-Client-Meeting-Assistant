import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import api from '../../lib/api';
import EmptyState from '../../components/ui/EmptyState';
import ProjectForm from '../../components/forms/ProjectForm';
import Link from 'next/link';
import Button from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { ListSkeleton } from '../../components/ui/Skeleton';

type Project = { _id: string; name: string; clientName?: string; status?: string };

function statusClass(status?: string) {
  if (status === 'completed') return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300';
  if (status === 'paused') return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300';
  return 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300';
}

export default function ProjectsPage() {
  const [list, setList] = useState<Project[] | null>(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetch = async () => {
    const res = await api.get('/api/projects', { params: { q, status, dateFrom, dateTo } });
    setList(res.data.data);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetch().catch(() => setList([]));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [q, status, dateFrom, dateTo]);

  const create = async (payload: any) => {
    await api.post('/api/projects', payload);
    await fetch();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete project?')) return;
    await api.delete(`/api/projects/${id}`);
    await fetch();
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col gap-2">
        <div className="inline-flex w-fit rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          Client delivery
        </div>
        <h1 className="page-title">Projects</h1>
        <p className="page-subtitle">Manage client workspaces, delivery status, documents, and AI-generated delivery context.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader title="Create Project" subtitle="Add a client project to this workspace." />
          <CardBody><ProjectForm onSubmit={create} /></CardBody>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader title="Project List" subtitle="Search and filter projects across your workspace." />
          <CardBody className="border-b border-slate-200 dark:border-slate-800">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-[minmax(220px,1fr)_150px_160px_160px_auto]">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search projects" className="input sm:col-span-2 lg:col-span-1" />
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="input min-w-0">
              <option value="">All</option>
              <option value="active">active</option>
              <option value="paused">paused</option>
              <option value="completed">completed</option>
            </select>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input min-w-0" title="Created from" />
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input min-w-0" title="Created to" />
            <Button onClick={fetch} variant="secondary" className="w-full 2xl:w-auto">Apply</Button>
          </div>
          </CardBody>

          <div>
            {!list && <ListSkeleton />}
            {list && list.length === 0 && <EmptyState title="No projects yet" subtitle="Create your first client project or adjust your filters." />}
            {list && list.length > 0 && (
              <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                {list.map(p => (
                  <li key={p._id} className="flex flex-col gap-4 p-4 transition hover:bg-slate-50/80 dark:hover:bg-slate-950/40 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                      <Link href={`/projects/${p._id}`} className="font-semibold text-slate-950 hover:text-blue-600 dark:text-white dark:hover:text-blue-300">{p.name}</Link>
                      <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{p.clientName || 'No client name'}</div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`badge ${statusClass(p.status)}`}>{p.status || 'active'}</span>
                      <Button onClick={() => remove(p._id)} variant="ghost" className="text-red-600 dark:text-red-400">Delete</Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
