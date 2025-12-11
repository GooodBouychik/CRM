'use client';

import { ReactNode } from 'react';

export interface StatItem {
  id: string;
  label: string;
  value: number;
  icon?: ReactNode;
  color?: string;
  suffix?: string;
}

export interface StatsBarProps {
  stats: StatItem[];
  className?: string;
  animated?: boolean;
}

// Animated counter hook - simplified to avoid infinite loops
function useAnimatedCounter(targetValue: number, _duration: number = 500, _enabled: boolean = true) {
  // Simplified: just return the target value directly
  return targetValue;
}

// Individual stat card component
function StatCard({ stat, animated }: { stat: StatItem; animated: boolean }) {
  const displayValue = useAnimatedCounter(stat.value, 500, animated);
  
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800',
    gray: 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700',
  };

  const colorClass = colorClasses[stat.color || 'gray'] || colorClasses.gray;

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-sm ${colorClass} transition-all duration-200 hover:shadow-md hover:-translate-y-0.5`}>
      {stat.icon && (
        <div className="flex-shrink-0 text-2xl">
          {stat.icon}
        </div>
      )}
      <div className="min-w-0">
        <div className="text-2xl font-bold tabular-nums">
          {displayValue}
          {stat.suffix && <span className="text-sm font-normal ml-1">{stat.suffix}</span>}
        </div>
        <div className="text-sm opacity-80 truncate">
          {stat.label}
        </div>
      </div>
    </div>
  );
}

export function StatsBar({ stats, className = '', animated = true }: StatsBarProps) {
  if (stats.length === 0) {
    return null;
  }

  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 ${className}`}>
      {stats.map((stat) => (
        <StatCard key={stat.id} stat={stat} animated={animated} />
      ))}
    </div>
  );
}

// Pre-configured stats bar for dashboard
export interface DashboardStatsProps {
  totalOrders: number;
  urgentCount: number;
  completedToday: number;
  inProgressCount: number;
  className?: string;
}

export function DashboardStats({ 
  totalOrders, 
  urgentCount, 
  completedToday, 
  inProgressCount,
  className = '' 
}: DashboardStatsProps) {
  const stats: StatItem[] = [
    {
      id: 'total',
      label: 'Всего заказов',
      value: totalOrders,
      icon: <span>📋</span>,
      color: 'blue',
    },
    {
      id: 'urgent',
      label: 'Срочных',
      value: urgentCount,
      icon: <span>🔴</span>,
      color: 'red',
    },
    {
      id: 'inProgress',
      label: 'В работе',
      value: inProgressCount,
      icon: <span>🔵</span>,
      color: 'yellow',
    },
    {
      id: 'completedToday',
      label: 'Завершено сегодня',
      value: completedToday,
      icon: <span>✅</span>,
      color: 'green',
    },
  ];

  return <StatsBar stats={stats} className={className} />;
}

export default StatsBar;
