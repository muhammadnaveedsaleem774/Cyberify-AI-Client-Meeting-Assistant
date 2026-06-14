import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import api from '../../lib/api';

type Props = {
  open?: boolean;
  onClose?: () => void;
};

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/projects', label: 'Projects' },
  { href: '/meetings', label: 'Meetings' },
  { href: '/tasks', label: 'Tasks' },
  { href: '/activity-logs', label: 'Activity Logs' }
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

  const items = isAdmin ? [...navItems, { href: '/admin', label: 'Admin' }] : navItems;

  const content = (
    <aside className="flex h-full w-72 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 lg:w-64">
      <div className="border-b border-slate-200 p-5 dark:border-slate-800">
        <div className="text-lg font-bold text-slate-950 dark:text-white">Cyberify</div>
        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">AI Meeting Assistant</div>
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
                  className={`block rounded-md px-3 py-2 text-sm font-medium transition ${active ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900'}`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );

  return (
    <>
      <div className="hidden lg:block">{content}</div>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button className="absolute inset-0 bg-slate-950/40" onClick={onClose} aria-label="Close navigation" />
          <div className="relative h-full">{content}</div>
        </div>
      )}
    </>
  );
}
