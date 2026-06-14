import React from 'react';

export default function EmptyState({ title, subtitle, action }: { title?: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center p-8 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-lg font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
        +
      </div>
      <div className="text-lg font-semibold text-slate-950 dark:text-white">{title || 'No items'}</div>
      {subtitle && <div className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">{subtitle}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
