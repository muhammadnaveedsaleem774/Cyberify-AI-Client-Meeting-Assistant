import React from 'react';
import { useRouter } from 'next/router';
import { logout } from '../../lib/auth';
import NotificationCenter from '../Notifications/NotificationCenter';
import Button from '../ui/Button';
import { useTheme } from '../Theme/ThemeProvider';

function MenuIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5 7 7 0 1 0 20.5 14.5Z" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 17 15 12 10 7" />
      <path d="M15 12H3" />
      <path d="M21 19V5" />
    </svg>
  );
}

export default function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-slate-200/80 bg-white/85 px-3 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/85 sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <Button variant="secondary" onClick={onMenuClick} className="h-10 min-h-0 w-10 shrink-0 p-0 lg:hidden" aria-label="Open menu" title="Open menu" icon={<MenuIcon />} />
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-slate-950 dark:text-white">Workspace</div>
          <div className="hidden truncate text-xs text-slate-500 dark:text-slate-400 sm:block">Client meetings, AI analysis, tasks, and reports</div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <NotificationCenter />
        <Button
          variant="secondary"
          onClick={toggleTheme}
          className="h-10 min-h-0 w-10 shrink-0 p-0"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          icon={theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        />
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="h-10 min-h-0 px-2 text-red-600 dark:text-red-400 sm:px-3"
          aria-label="Logout"
          title="Logout"
          icon={<LogoutIcon />}
        >
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </div>
  );
}
