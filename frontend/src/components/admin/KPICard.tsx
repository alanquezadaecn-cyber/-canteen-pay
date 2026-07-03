import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  gradient: string; // e.g., "from-blue-500 to-cyan-500"
  trend?: number; // percentage change
  delay?: number;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  gradient,
  trend,
  delay = 0
}) => {
  const trendPositive = trend && trend > 0;

  return (
    <div
      className="group relative animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Gradient border effect */}
      <div className={`absolute -inset-0.5 bg-gradient-to-r ${gradient} rounded-2xl opacity-0 group-hover:opacity-75 blur-xl transition-opacity duration-500 pointer-events-none`}></div>

      {/* Card background with glassmorphism */}
      <div className="relative bg-gradient-to-br from-white/20 to-white/10 dark:from-white/5 dark:to-white/[0.02] backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl p-6 hover:border-white/40 dark:hover:border-white/20 transition-all duration-300 shadow-lg dark:shadow-2xl">

        {/* Header with icon and title */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-600 dark:text-slate-400">
              {title}
            </p>
          </div>

          {/* Icon with gradient background */}
          <div className={`flex-shrink-0 ml-3 p-3 rounded-xl bg-gradient-to-br ${gradient} opacity-10 group-hover:opacity-20 transition-opacity duration-300`}>
            <Icon className={`w-6 h-6 bg-gradient-to-br ${gradient} bg-clip-text text-transparent`} />
          </div>
        </div>

        {/* Main value */}
        <div className="mb-3">
          <p className={`text-4xl md:text-5xl font-bold bg-gradient-to-br ${gradient} bg-clip-text text-transparent leading-tight`}>
            {value}
          </p>
        </div>

        {/* Subtitle and trend */}
        <div className="flex items-center justify-between">
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-500">{subtitle}</p>
          )}

          {trend !== undefined && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${
              trendPositive
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-red-500/10 text-red-600 dark:text-red-400'
            }`}>
              <span>{trendPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend)}%</span>
            </div>
          )}
        </div>

        {/* Animated bottom border */}
        <div className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${gradient} rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
          style={{
            width: '0%',
            animation: 'slideIn 0.6s ease-out forwards',
            animationDelay: `${delay + 100}ms`
          }}
        ></div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
};
