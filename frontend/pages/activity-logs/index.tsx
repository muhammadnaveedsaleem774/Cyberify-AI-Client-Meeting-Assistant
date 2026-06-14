import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import api from '../../lib/api';
import EmptyState from '../../components/ui/EmptyState';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { ListSkeleton } from '../../components/ui/Skeleton';

type Activity = { _id: string; type: string; entityType?: string; entityId?: string; meta?: any; createdAt: string; userId?: string };

export default function ActivityLogsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{ items: Activity[]; total: number; page: number; limit: number } | null>(null);

  const fetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await api.get('/api/activity-logs');
      setData(r.data.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  if (loading) return <DashboardLayout><ListSkeleton rows={6} /></DashboardLayout>;
  if (error) return <DashboardLayout><EmptyState title="Activity unavailable" subtitle={error} /></DashboardLayout>;
  if (!data || data.items.length === 0) {
    return <DashboardLayout><EmptyState title="No activity yet" subtitle="Workspace events will appear here after projects, meetings, tasks, files, or AI analysis change." /></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <div className="mb-3 inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          Audit trail
        </div>
        <h1 className="page-title">Activity Logs</h1>
        <p className="page-subtitle">Timeline of workspace events and operational changes.</p>
      </div>
      <Card>
        <CardHeader title="Recent Activity" subtitle={`${data.total || data.items.length} recorded events`} />
        <CardBody>
          <ul className="space-y-3">
            {data.items.map((a) => (
              <li key={a._id} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/40">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                  {a.type.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-slate-900 dark:text-slate-100"><strong>{a.type}</strong> {a.entityType ? `- ${a.entityType}` : ''}</div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{new Date(a.createdAt).toLocaleString()}</div>
                  {a.meta && <div className="mt-3 break-words rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">{JSON.stringify(a.meta)}</div>}
                </div>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </DashboardLayout>
  );
}
