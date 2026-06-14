import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../../../components/Layout/DashboardLayout';
import api from '../../../lib/api';
import MeetingForm from '../../../components/forms/MeetingForm';
import EmptyState from '../../../components/ui/EmptyState';
import { Card, CardBody, CardHeader } from '../../../components/ui/Card';
import { PageSkeleton } from '../../../components/ui/Skeleton';

type Meeting = { _id: string; title: string; date: string; notes?: string; projectId?: string };

export default function EditMeeting() {
  const router = useRouter();
  const { id } = router.query;
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    setLoading(true);
    api.get(`/api/meetings/${id}`).then(r => { if (mounted) setMeeting(r.data.data); }).catch(err => { if (mounted) setError(err?.message || 'Failed'); }).finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [id]);

  const submit = async (payload: { title: string; date: string; notes?: string; projectId?: string }) => {
    if (!id) return;
    setError(null);
    try {
      await api.put(`/api/meetings/${id}`, payload);
      router.push(`/meetings/${id}`);
    } catch (err: any) {
      setError(err?.message || 'Failed to update');
      throw err;
    }
  };

  if (loading) return <DashboardLayout><PageSkeleton /></DashboardLayout>;
  if (error) return <DashboardLayout><div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">{error}</div></DashboardLayout>;
  if (!meeting) return <DashboardLayout><EmptyState title="Meeting not found" subtitle="This meeting may have been deleted or is outside your workspace." /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="page-title">Edit Meeting</h1>
          <p className="page-subtitle">Update notes, timing, and project context before re-running AI analysis.</p>
        </div>
        <Card>
          <CardHeader title="Meeting Details" />
          <CardBody>
            <MeetingForm initial={meeting} onSubmit={submit} submitLabel="Update Meeting" />
          </CardBody>
        </Card>
      </div>
    </DashboardLayout>
  );
}
