import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import api from '../../lib/api';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { PageSkeleton } from '../../components/ui/Skeleton';

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/api/admin/stats');
        setStats(res.data.stats);
      } catch (err: any) {
        setError(err?.response?.data?.message || err?.message || 'Failed');
      } finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <DashboardLayout><PageSkeleton /></DashboardLayout>;
  if (error) return <DashboardLayout><div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">{error}</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">Workspace-wide operating metrics and system health.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ['Total Users', stats.totalUsers],
            ['Total Projects', stats.totalProjects],
            ['Total Meetings', stats.totalMeetings]
          ].map(([label, value]) => (
            <Card key={label}>
              <CardBody>
                <div className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</div>
                <div className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">{value}</div>
              </CardBody>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader title="System Statistics" subtitle="Raw operational snapshot for production checks." />
          <CardBody>
            <pre className="overflow-x-auto rounded-md bg-slate-950 p-4 text-xs text-slate-100">{JSON.stringify(stats.systemStatistics, null, 2)}</pre>
          </CardBody>
        </Card>
      </div>
    </DashboardLayout>
  );
}
