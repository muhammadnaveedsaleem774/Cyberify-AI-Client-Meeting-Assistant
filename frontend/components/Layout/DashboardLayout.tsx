import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { ensureAuthenticated } from '../../lib/auth';
import { PageSkeleton } from '../ui/Skeleton';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    ensureAuthenticated().then((ok) => {
      if (!mounted) return;
      if (!ok) router.replace('/login');
      else setLoading(false);
    });
    return () => { mounted = false; };
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 dark:bg-slate-950">
        <PageSkeleton />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="min-w-0 flex-1">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="min-h-[calc(100vh-56px)] p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
