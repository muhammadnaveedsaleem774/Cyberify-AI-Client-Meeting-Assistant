import React from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-bg flex min-h-screen items-center justify-center px-4 py-10 text-slate-900 dark:text-slate-100">
      <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1fr_440px] lg:items-center">
        <div className="hidden lg:block">
          <div className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/50 dark:text-blue-300">
            AI Meeting Operations
          </div>
          <h1 className="mt-5 max-w-xl text-4xl font-semibold tracking-normal text-slate-950 dark:text-white">
            Turn client conversations into clear delivery work.
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-7 text-slate-600 dark:text-slate-300">
            Analyze notes, generate requirements, create tasks, track risks, and keep every workspace isolated.
          </p>
          <div className="mt-8 grid max-w-lg gap-3 sm:grid-cols-3">
            {['Structured AI', 'Workspace Safe', 'Live Updates'].map((item) => (
              <div key={item} className="rounded-xl border border-slate-200 bg-white/80 p-4 text-sm font-semibold text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-200">
                {item}
              </div>
            ))}
          </div>
        </div>
        <div className="w-full">
          <div className="mb-6 text-center lg:text-left">
            <div className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">Cyberify</div>
            <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">AI Client Meeting Assistant</div>
          </div>
          <div className="w-full rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-xl shadow-slate-200/70 dark:border-slate-800 dark:bg-slate-900/95 dark:shadow-black/20 sm:p-7">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
