import React from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">Cyberify</div>
          <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">AI Client Meeting Assistant</div>
        </div>
        <div className="w-full rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">{children}</div>
      </div>
    </div>
  );
}
