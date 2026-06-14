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
    <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={onMenuClick} className="h-9 min-h-0 w-9 p-0 lg:hidden">≡</Button>
        <div>
          <div className="text-sm font-semibold text-slate-950 dark:text-white">Workspace</div>
          <div className="hidden text-xs text-slate-500 dark:text-slate-400 sm:block">Client meeting operations</div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <NotificationCenter />
        <Button variant="secondary" onClick={toggleTheme} className="h-9 min-h-0 px-3">{theme === 'dark' ? 'Light' : 'Dark'}</Button>
        <Button variant="ghost" onClick={handleLogout} className="text-red-600 dark:text-red-400">Logout</Button>
      </div>
    </div>
  );
}
