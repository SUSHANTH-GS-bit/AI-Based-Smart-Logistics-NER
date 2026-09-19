import React from 'react';

export function DashboardCard({ title, value, subtitle, icon: Icon, color = 'cyan', trend, action }) {
  const borderGradients = {
    cyan: 'border-cyan-500/20 hover:border-cyan-500/50 shadow-cyan-950/20',
    emerald: 'border-emerald-500/20 hover:border-emerald-500/50 shadow-emerald-950/20',
    amber: 'border-amber-500/20 hover:border-amber-500/50 shadow-amber-950/20',
    rose: 'border-rose-500/20 hover:border-rose-500/50 shadow-rose-950/20',
    purple: 'border-purple-500/20 hover:border-purple-500/50 shadow-purple-950/20',
  };

  const iconBg = {
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  };

  return (
    <div
      className={`bg-dark-700/80 backdrop-blur-md rounded-xl p-5 border transition-all duration-300 hover:scale-[1.01] shadow-xl ${borderGradients[color] || borderGradients.cyan}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider font-medium text-slate-400">{title}</p>
          <h3 className="text-2xl font-bold mt-1 text-white tracking-tight">{value}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`p-3 rounded-lg border ${iconBg[color] || iconBg.cyan}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {(trend || action) && (
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
          {trend && <span className="text-emerald-400 font-medium">{trend}</span>}
          {action && <div className="ml-auto">{action}</div>}
        </div>
      )}
    </div>
  );
}
