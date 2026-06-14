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
  if (error) return <DashboardLayout><div className="alert-error">{error}</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <div className="mb-3 inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            System overview
          </div>
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
                <div className="mt-4 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className="h-full w-2/3 rounded-full bg-blue-500" />
                </div>
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
