import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import api from '../../lib/api';

type Props = {
  open?: boolean;
  onClose?: () => void;
};

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: 'D' },
  { href: '/projects', label: 'Projects', icon: 'P' },
  { href: '/meetings', label: 'Meetings', icon: 'M' },
  { href: '/tasks', label: 'Tasks', icon: 'T' },
  { href: '/activity-logs', label: 'Activity', icon: 'A' }
];

export default function Sidebar({ open = false, onClose }: Props) {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get('/api/auth/me');
        if (!mounted) return;
        if (res.data && res.data.user && res.data.user.role === 'admin') setIsAdmin(true);
      } catch (err) {
        // ignore - unauthenticated or not admin
      }
    })();
    return () => { mounted = false; };
  }, []);

  const items = isAdmin ? [...navItems, { href: '/admin', label: 'Admin', icon: 'S' }] : navItems;

  const content = (
    <aside className="flex h-full w-72 flex-col border-r border-slate-200/80 bg-white/95 shadow-xl shadow-slate-200/60 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 dark:shadow-black/20 lg:w-72">
      <div className="border-b border-slate-200/80 p-5 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-sm font-bold text-white dark:bg-white dark:text-slate-950">C</div>
          <div>
            <div className="text-lg font-bold tracking-tight text-slate-950 dark:text-white">Cyberify</div>
            <div className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">AI Meeting Assistant</div>
          </div>
        </div>
        <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50/80 p-3 dark:border-blue-950/70 dark:bg-blue-950/30">
          <div className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">Workspace</div>
          <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">Client operations</div>
        </div>
      </div>
      <nav className="flex-1 p-3">
        <ul className="space-y-1">
          {items.map((item) => {
            const active = router.pathname === item.href || router.pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${active ? 'bg-slate-950 text-white shadow-sm dark:bg-white dark:text-slate-950' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white'}`}
                >
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${active ? 'bg-white/15 dark:bg-slate-950/10' : 'bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-400'}`}>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="border-t border-slate-200/80 p-4 dark:border-slate-800">
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900/80">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Status</div>
          <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Live workspace
          </div>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      <div className="hidden lg:block">{content}</div>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={onClose} aria-label="Close navigation" />
          <div className="relative h-full">{content}</div>
        </div>
      )}
    </>
  );
}
