import React from 'react';

export default function EmptyState({ title, subtitle, action }: { title?: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-8 text-center dark:border-slate-800 dark:bg-slate-950/40">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-lg font-semibold text-blue-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-blue-300">
        +
      </div>
      <div className="text-lg font-semibold text-slate-950 dark:text-white">{title || 'No items'}</div>
      {subtitle && <div className="mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">{subtitle}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
