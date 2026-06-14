import React, { useState } from 'react';
import AuthLayout from '../components/Layout/AuthLayout';
import { login } from '../lib/auth';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Button from '../components/ui/Button';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) return setError('Email and password required');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <AuthLayout>
      <div className="mb-5">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">Sign in</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Continue to your client meeting workspace.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
        </div>
        <div>
          <label className="label">Password</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="input" />
        </div>
        {error && <div className="text-sm text-red-600 mb-2">{error}</div>}
        <Button type="submit" loading={loading} className="w-full">{loading ? 'Signing in...' : 'Sign in'}</Button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-600 dark:text-slate-400">
        New to Cyberify? <Link href="/signup" className="font-medium text-blue-600 dark:text-blue-400">Create a workspace</Link>
      </p>
    </AuthLayout>
  );
}
