import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { inviteWorkspaceMember } from '../../lib/auth';

export default function InviteMemberModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'member' | 'admin'>('member');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await inviteWorkspaceMember(email, role);
      setMessage(res?.message || 'Invite sent');
      setEmail('');
      setRole('member');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to invite member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Invite Member" open={open} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="name@company.com" />
        </div>
        <div>
          <label className="label">Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value as 'member' | 'admin')} className="input">
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        {message && <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">{message}</div>}
        {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">{error}</div>}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>{loading ? 'Sending...' : 'Send Invite'}</Button>
        </div>
      </form>
    </Modal>
  );
}
