import React from 'react';
import Button from './Button';

export default function Modal({ title, children, open, onClose }: { title: string; children: React.ReactNode; open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="w-full max-w-lg rounded-lg border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
          <h3 className="text-base font-semibold text-slate-950 dark:text-white">{title}</h3>
          <Button variant="ghost" onClick={onClose} className="h-8 min-h-0 w-8 p-0">x</Button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
