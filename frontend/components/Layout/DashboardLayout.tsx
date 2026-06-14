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
      <div className="app-bg min-h-screen p-6">
        <PageSkeleton />
      </div>
    );
  }

  return (
    <div className="app-bg flex min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="min-w-0 flex-1 lg:pl-0">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="min-h-[calc(100vh-64px)] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
