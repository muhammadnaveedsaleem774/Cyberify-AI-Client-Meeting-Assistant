import React from 'react';
import { useRouter } from 'next/router';
import { logout } from '../../lib/auth';
import NotificationCenter from '../Notifications/NotificationCenter';
import Button from '../ui/Button';
import { useTheme } from '../Theme/ThemeProvider';

export default function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/85 px-4 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/85 sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <Button variant="secondary" onClick={onMenuClick} className="h-10 min-h-0 w-16 p-0 lg:hidden">Menu</Button>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-slate-950 dark:text-white">Workspace Command Center</div>
          <div className="hidden truncate text-xs text-slate-500 dark:text-slate-400 sm:block">Client meetings, AI analysis, tasks, and reports</div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <NotificationCenter />
        <Button variant="secondary" onClick={toggleTheme} className="hidden h-10 min-h-0 px-3 sm:inline-flex">{theme === 'dark' ? 'Light' : 'Dark'}</Button>
        <Button variant="ghost" onClick={handleLogout} className="text-red-600 dark:text-red-400">Logout</Button>
      </div>
    </div>
  );
}
