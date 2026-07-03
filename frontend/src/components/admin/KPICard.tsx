import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string; // tailwind color class like "text-slate-700"
  delay?: number;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  icon: Icon,
  color,
  delay = 0
}) => {
  return (
    <div
      className="animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">

        {/* Header con icon y title */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 tracking-normal">
            {title}
          </h3>
          <div className={`${color} opacity-20`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>

        {/* Main Value */}
        <div className="flex items-baseline gap-2">
          <p className={`text-4xl font-bold ${color}`}>
            {value}
          </p>
        </div>
      </div>
    </div>
  );
};
