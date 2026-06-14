import React, { useState } from 'react';
import Button from '../ui/Button';

type Props = {
  initial?: { name?: string; clientName?: string; description?: string; status?: string };
  onSubmit: (payload: { name: string; clientName?: string; description?: string; status?: string }) => Promise<void>;
  submitLabel?: string;
};

export default function ProjectForm({ initial, onSubmit, submitLabel = 'Save' }: Props) {
  const [name, setName] = useState(initial?.name || '');
  const [clientName, setClientName] = useState(initial?.clientName || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [status, setStatus] = useState(initial?.status || 'active');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name) return setError('Name is required');
    setLoading(true);
    try {
      await onSubmit({ name, clientName, description, status });
    } catch (err: any) {
      setError(err?.message || 'Failed');
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handle} className="space-y-4">
      <div>
        <label className="label">Name</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <label className="label">Client</label>
        <input className="input" value={clientName} onChange={(e) => setClientName(e.target.value)} />
      </div>
      <div>
        <label className="label">Status</label>
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="active">active</option>
          <option value="paused">paused</option>
          <option value="completed">completed</option>
        </select>
      </div>
      <div>
        <label className="label">Description</label>
        <textarea className="input min-h-[100px]" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      {error && <div className="alert-error">{error}</div>}
      <div>
        <Button type="submit" loading={loading}>{loading ? 'Saving...' : submitLabel}</Button>
      </div>
    </form>
  );
}
