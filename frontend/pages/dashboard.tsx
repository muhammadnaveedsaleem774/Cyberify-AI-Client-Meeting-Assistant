import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import api from '../lib/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid } from 'recharts';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { PageSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import InviteMemberModal from '../components/Workspace/InviteMemberModal';
import { getWorkspaceIdFromToken } from '../lib/auth';

type Stats = {
  totalProjects: number;
  totalMeetings: number;
  openTasks: number;
  completedTasks: number;
  projectsByStatus: Record<string, number>;
  tasksByStatus: Record<string, number>;
  meetingsByDate: Record<string, number>;
};

function MetricCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <Card className="relative p-5">
      <div className={`absolute right-4 top-4 h-10 w-10 rounded-xl ${tone}`} />
      <div className="text-sm font-semibold text-slate-500 dark:text-slate-400">{label}</div>
      <div className="mt-4 text-3xl font-semibold text-slate-950 dark:text-white">{value}</div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div className={`h-full w-2/3 rounded-full ${tone}`} />
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api.get('/api/dashboard/stats').then((r) => {
      if (!mounted) return;
      // Log stats for debugging chart rendering
      // eslint-disable-next-line no-console
      console.debug('Dashboard stats fetched', r.data.stats);
      setStats(r.data.stats);
    }).catch((e) => setError('Unable to load stats')).finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  const exportPdf = async () => {
    setExporting(true);
    try {
      const workspaceId = getWorkspaceIdFromToken();
      const endpoint = workspaceId ? `/api/export/pdf/${workspaceId}` : '/api/dashboard/report';
      const res = await api.get(endpoint, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `cyberify-workspace-report-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <DashboardLayout><PageSkeleton /></DashboardLayout>;
  if (error || !stats) return <DashboardLayout><EmptyState title="Dashboard unavailable" subtitle={error || 'No stats found'} /></DashboardLayout>;

  const chartData = Object.entries(stats.meetingsByDate || {}).map(([date, count]) => ({ date, count }));
  const tasksData = Object.entries(stats.tasksByStatus || {}).map(([status, count]) => ({ name: status, value: count }));
  const projectsData = Object.entries(stats.projectsByStatus || {}).map(([status, count]) => ({ status, count }));
  const COLORS = ['#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed'];
  const metrics = [
    { label: 'Total Projects', value: stats.totalProjects, tone: 'bg-blue-500' },
    { label: 'Total Meetings', value: stats.totalMeetings, tone: 'bg-violet-500' },
    { label: 'Open Tasks', value: stats.openTasks, tone: 'bg-amber-500' },
    { label: 'Completed Tasks', value: stats.completedTasks, tone: 'bg-emerald-500' }
  ];

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/50 dark:text-blue-300">
            Workspace overview
          </div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Workspace activity, delivery health, and meeting volume.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={exportPdf} loading={exporting}>{exporting ? 'Exporting...' : 'Export PDF'}</Button>
          <Button onClick={() => setInviteOpen(true)}>Invite Member</Button>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader title="Tasks by Status" />
          <CardBody>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={tasksData} dataKey="value" nameKey="name" outerRadius={80} fill="#3182ce">
                  {tasksData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Projects by Status" />
          <CardBody>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#059669" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Meetings Over Time" />
          <CardBody>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#7c3aed" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          </CardBody>
        </Card>
      </div>

      <InviteMemberModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </DashboardLayout>
  );
}
