import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import Button from '../ui/Button';

type Meeting = {
  _id?: string;
  title: string;
  date: string; // ISO string
  notes?: string;
  projectId?: string;
};

type Props = {
  initial?: Partial<Meeting>;
  submitLabel?: string;
  onSubmit: (payload: { title: string; date: string; notes?: string; projectId?: string }) => Promise<void>;
};

export default function MeetingForm({ initial = {}, submitLabel = 'Save', onSubmit }: Props) {
  const [title, setTitle] = useState(initial.title || '');
  const [date, setDate] = useState(initial.date ? initial.date : new Date().toISOString().slice(0, 16));
  const [notes, setNotes] = useState(initial.notes || '');
  const [projectId, setProjectId] = useState<string | undefined>(initial.projectId);
  const [projects, setProjects] = useState<Array<{ _id: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    api.get('/api/projects').then(r => { if (mounted) setProjects(r.data.data || []); }).catch(() => {}).finally(() => mounted && null);
    return () => { mounted = false; };
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    if (!title.trim()) return setError('Title is required');
    setLoading(true);
    try {
      await onSubmit({ title: title.trim(), date, notes, projectId });
    } catch (err: any) {
      setError(err?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="alert-error">{error}</div>}
      <div>
        <label className="label">Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="input" />
      </div>

      <div>
        <label className="label">Date & Time</label>
        <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
      </div>

      <div>
        <label className="label">Project</label>
        <select value={projectId || ''} onChange={(e) => setProjectId(e.target.value || undefined)} className="input">
          <option value="">Unlinked</option>
          {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
        </select>
      </div>

      <div>
        <label className="label">Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={6} className="input min-h-[160px]" />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" loading={loading}>
          {loading ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
