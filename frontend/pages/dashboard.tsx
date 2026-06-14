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
  const COLORS = ['#3182ce', '#2f855a', '#dd6b20', '#e53e3e', '#6b46c1'];

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Workspace activity, delivery health, and meeting volume.</p>
      </div>

      <div className="mb-6 flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={exportPdf} loading={exporting}>{exporting ? 'Exporting...' : 'Export PDF'}</Button>
        <Button onClick={() => setInviteOpen(true)}>Invite Member</Button>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Total Projects', stats.totalProjects],
          ['Total Meetings', stats.totalMeetings],
          ['Open Tasks', stats.openTasks],
          ['Completed Tasks', stats.completedTasks]
        ].map(([label, value]) => (
          <Card key={String(label)} className="p-4">
            <div className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</div>
            <div className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">{value}</div>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader title="Tasks by Status" />
          <CardBody>
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer>
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
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer>
              <BarChart data={projectsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#2f855a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Meetings Over Time" />
          <CardBody>
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#6b46c1" strokeWidth={2} />
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
