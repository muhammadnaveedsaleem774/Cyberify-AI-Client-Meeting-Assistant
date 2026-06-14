import React from 'react';

export default function Spinner() {
  return (
    <div className="flex items-center justify-center py-6 text-sm text-slate-500 dark:text-slate-400">
      <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600 dark:border-slate-700 dark:border-t-blue-400" />
      Loading
    </div>
  );
}
