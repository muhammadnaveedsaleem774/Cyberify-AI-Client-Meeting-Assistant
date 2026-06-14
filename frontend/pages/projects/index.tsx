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

  useEffect(() => { fetch().catch(() => setList([])); }, []);

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
      <div className="mb-6">
        <h1 className="page-title">Projects</h1>
        <p className="page-subtitle">Manage client workspaces, delivery status, and project documents.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader title="Create Project" subtitle="Add a client project to this workspace." />
          <CardBody><ProjectForm onSubmit={create} /></CardBody>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader title="Project List" subtitle="Search and filter projects across your workspace." />
          <CardBody className="border-b border-slate-200 dark:border-slate-800">
          <div className="grid gap-3 lg:grid-cols-[1fr_150px_150px_150px_auto]">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search projects" className="input" />
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="input">
              <option value="">All</option>
              <option value="active">active</option>
              <option value="paused">paused</option>
              <option value="completed">completed</option>
            </select>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input" title="Created from" />
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input" title="Created to" />
            <Button onClick={fetch} variant="secondary">Filter</Button>
          </div>
          </CardBody>

          <div>
            {!list && <ListSkeleton />}
            {list && list.length === 0 && <EmptyState title="No projects yet" subtitle="Create your first client project or adjust your filters." />}
            {list && list.length > 0 && (
              <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                {list.map(p => (
                  <li key={p._id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <Link href={`/projects/${p._id}`} className="font-semibold text-slate-950 hover:text-blue-600 dark:text-white dark:hover:text-blue-300">{p.name}</Link>
                      <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{p.clientName || 'No client name'}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="badge">{p.status || 'active'}</span>
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
