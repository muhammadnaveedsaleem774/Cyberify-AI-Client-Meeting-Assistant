import React, { useEffect, useRef, useState } from 'react';
import { useNotifications } from '../../hooks/useNotifications';

const EVENT_LABELS: Record<string, string> = {
  taskCreated: 'Task created',
  taskCompleted: 'Task completed',
  meetingCreated: 'Meeting created'
};

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const { items, connected, toast, unreadCount, markAllRead } = useNotifications();

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const toggleOpen = () => {
    setOpen((value) => {
      const nextOpen = !value;
      if (nextOpen) markAllRead();
      return nextOpen;
    });
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={toggleOpen}
        className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-blue-500/15 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:hover:border-slate-700 dark:hover:bg-slate-900"
        aria-label="Notifications"
        aria-expanded={open}
        title={connected ? 'Live notifications connected' : 'Reconnecting notifications'}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
          <path d="M10 21h4" />
        </svg>
        <span className={`absolute bottom-1.5 right-1.5 h-2 w-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 min-w-[18px] rounded-full bg-red-600 px-1 text-[11px] leading-[18px] text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed left-3 right-3 top-16 z-40 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl shadow-slate-950/10 dark:border-slate-800 dark:bg-slate-900 sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-[22rem]">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/50">
            <div>
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Notifications</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{connected ? 'Live' : 'Reconnecting'}</div>
            </div>
            <button type="button" onClick={markAllRead} className="text-xs font-medium text-blue-600 dark:text-blue-400">
              Mark read
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 && <div className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">No notifications yet</div>}
            {items.map((item) => (
              <div key={item.id} className="border-b border-slate-100 px-4 py-3 last:border-b-0 dark:border-slate-800">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{EVENT_LABELS[item.type] || item.type}</div>
                    <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">{item.message}</div>
                    <div className="mt-1 text-xs text-slate-400 dark:text-slate-500">{new Date(item.timestamp).toLocaleString()}</div>
                  </div>
                  {!item.read && <span className="mt-1 h-2 w-2 rounded-full bg-blue-600" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed right-4 top-20 z-30 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-950/10 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{EVENT_LABELS[toast.type] || toast.type}</div>
          <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">{toast.message}</div>
          <div className="mt-2 text-xs text-slate-400 dark:text-slate-500">{new Date(toast.timestamp).toLocaleString()}</div>
        </div>
      )}
    </div>
  );
}
