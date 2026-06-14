import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  loading?: boolean;
  icon?: React.ReactNode;
};

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-blue-600 text-white shadow-sm shadow-blue-600/20 hover:bg-blue-700 disabled:bg-blue-400',
  secondary: 'border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-slate-700 dark:hover:bg-slate-900',
  danger: 'bg-red-600 text-white shadow-sm shadow-red-600/20 hover:bg-red-700 disabled:bg-red-400',
  ghost: 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900',
  success: 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20 hover:bg-emerald-700 disabled:bg-emerald-400'
};

export default function Button({ variant = 'primary', className = '', type = 'button', loading = false, disabled, children, icon, ...props }: Props) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-blue-500/15 disabled:cursor-not-allowed disabled:opacity-70 ${variants[variant]} ${className}`}
      {...props}
    >
      {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent opacity-80" />}
      {!loading && icon}
      {children}
    </button>
  );
}
