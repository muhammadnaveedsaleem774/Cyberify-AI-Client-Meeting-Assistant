import React, { useState } from 'react';
import AuthLayout from '../components/Layout/AuthLayout';
import { joinWorkspace, signup } from '../lib/auth';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Button from '../components/ui/Button';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inviteToken = typeof router.query.inviteToken === 'string' ? router.query.inviteToken : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name || !email || !password) return setError('All fields are required');
    setLoading(true);
    try {
      await signup(name, email, password, workspaceName || undefined);
      if (inviteToken) {
        await joinWorkspace(inviteToken);
      }
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Signup failed');
    } finally { setLoading(false); }
  };

  return (
    <AuthLayout>
      <div className="mb-5">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">Create your workspace</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Start organizing client meetings, tasks, and AI analysis.</p>
        {inviteToken && <p className="mt-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300">You are joining an invited workspace after signup.</p>}
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="input" />
        </div>
        <div>
          <label className="label">Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
        </div>
        <div>
          <label className="label">Password</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="input" />
        </div>
        <div>
          <label className="label">Workspace name (optional)</label>
          <input value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)} className="input" />
        </div>
        {error && <div className="alert-error">{error}</div>}
        <Button type="submit" loading={loading} className="w-full">{loading ? 'Creating...' : 'Create account'}</Button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-600 dark:text-slate-400">
        Already have an account? <Link href="/login" className="font-medium text-blue-600 dark:text-blue-400">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
