import React from 'react';

export function Badge({ children, variant = 'info', size = 'md', className = '' }) {
  const variantStyles = {
    safe: 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60',
    low: 'bg-blue-950/80 text-blue-400 border-blue-800/60',
    medium: 'bg-amber-950/80 text-amber-400 border-amber-800/60',
    high: 'bg-orange-950/80 text-orange-400 border-orange-800/60',
    critical: 'bg-rose-950/80 text-rose-400 border-rose-800/60',
    info: 'bg-cyan-950/80 text-cyan-400 border-cyan-800/60',
    neutral: 'bg-slate-800 text-slate-300 border-slate-700',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-semibold',
    lg: 'px-3 py-1.5 text-sm font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border backdrop-blur-sm ${variantStyles[variant] || variantStyles.info} ${sizeStyles[size]} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      {children}
    </span>
  );
}
