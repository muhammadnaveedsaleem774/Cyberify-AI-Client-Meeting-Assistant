import React, { useState } from 'react';
import { useNotifications } from '../../hooks/useNotifications';

const EVENT_LABELS: Record<string, string> = {
  taskCreated: 'Task created',
  taskCompleted: 'Task completed',
  meetingCreated: 'Meeting created'
};

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const { items, connected, toast, unreadCount, markAllRead } = useNotifications();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((value) => !value);
          markAllRead();
        }}
        className="relative h-9 w-9 rounded-md border border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
        aria-label="Notifications"
        title={connected ? 'Live notifications connected' : 'Reconnecting notifications'}
      >
        N
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 min-w-[18px] rounded-full bg-red-600 px-1 text-[11px] leading-[18px] text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2 dark:border-slate-800">
            <div>
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Notifications</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{connected ? 'Live' : 'Reconnecting'}</div>
            </div>
            <button type="button" onClick={markAllRead} className="text-xs font-medium text-blue-600 dark:text-blue-400">
              Mark read
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 && <div className="px-3 py-6 text-center text-sm text-slate-500 dark:text-slate-400">No notifications yet</div>}
            {items.map((item) => (
              <div key={item.id} className="border-b border-slate-100 px-3 py-3 last:border-b-0 dark:border-slate-800">
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
        <div className="fixed right-4 top-16 z-30 w-80 rounded-lg border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{EVENT_LABELS[toast.type] || toast.type}</div>
          <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">{toast.message}</div>
          <div className="mt-2 text-xs text-slate-400 dark:text-slate-500">{new Date(toast.timestamp).toLocaleString()}</div>
        </div>
      )}
    </div>
  );
}
