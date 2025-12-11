'use client';

import { ReactNode } from 'react';

export interface SkeletonProps {
  className?: string;
  children?: ReactNode;
}

// Base skeleton component with shimmer animation
export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div 
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}
      aria-hidden="true"
    />
  );
}

// Text skeleton - single line
export function SkeletonText({ width = 'w-full', className = '' }: { width?: string; className?: string }) {
  return <Skeleton className={`h-4 ${width} ${className}`} />;
}

// Avatar skeleton
export function SkeletonAvatar({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };
  return <Skeleton className={`${sizeClasses[size]} rounded-full`} />;
}

// Card skeleton
export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="flex items-start gap-3">
        <SkeletonAvatar size="sm" />
        <div className="flex-1 space-y-2">
          <SkeletonText width="w-3/4" />
          <SkeletonText width="w-1/2" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <SkeletonText />
        <SkeletonText width="w-5/6" />
      </div>
    </div>
  );
}

// List item skeleton
export function SkeletonListItem({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 py-3 ${className}`}>
      <SkeletonAvatar size="sm" />
      <div className="flex-1 space-y-2">
        <SkeletonText width="w-1/3" />
        <SkeletonText width="w-2/3" />
      </div>
      <Skeleton className="w-16 h-6 rounded-full" />
    </div>
  );
}

// Table row skeleton
export function SkeletonTableRow({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="border-b border-gray-200 dark:border-gray-700">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <SkeletonText width={i === 0 ? 'w-8' : i === 1 ? 'w-full' : 'w-20'} />
        </td>
      ))}
    </tr>
  );
}

// Stats bar skeleton
export function SkeletonStatsBar({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
        >
          <Skeleton className="w-10 h-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-12" />
            <SkeletonText width="w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Kanban column skeleton
export function SkeletonKanbanColumn({ cards = 3 }: { cards?: number }) {
  return (
    <div className="flex-1 min-w-[280px] bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
      <div className="flex items-center justify-between mb-3">
        <SkeletonText width="w-24" />
        <Skeleton className="w-6 h-6 rounded" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: cards }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}

// Full page skeleton
export function SkeletonPage() {
  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <SkeletonText width="w-32" />
        </div>
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
      
      {/* Stats */}
      <SkeletonStatsBar />
      
      {/* Content */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonListItem key={i} />
        ))}
      </div>
    </div>
  );
}

// Loading overlay for buttons and forms
export function LoadingOverlay({ message = 'Загрузка...' }: { message?: string }) {
  return (
    <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-[inherit]">
      <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
        <span className="inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  );
}

// Inline loading spinner
export function InlineSpinner({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizeClasses = {
    sm: 'w-3 h-3 border',
    md: 'w-4 h-4 border-2',
    lg: 'w-6 h-6 border-2',
  };

  return (
    <span
      className={`inline-block ${sizeClasses[size]} border-current border-t-transparent rounded-full animate-spin ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}

// Full screen loading state
export function FullScreenLoader({ message = 'Загрузка...' }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-primary-200 dark:border-primary-800 rounded-full" />
          <div className="absolute inset-0 w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
        <span className="text-gray-600 dark:text-gray-300 font-medium">{message}</span>
      </div>
    </div>
  );
}

// Content placeholder with fade-in animation
export function ContentPlaceholder({ children, loading }: { children: React.ReactNode; loading: boolean }) {
  if (loading) {
    return <div className="animate-pulse">{children}</div>;
  }
  return <div className="animate-fade-in">{children}</div>;
}

// Order list skeleton
export function SkeletonOrderList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

// Order table skeleton
export function SkeletonOrderTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {['#', 'Название', 'Клиент', 'Статус', 'Приоритет', 'Дедлайн'].map((header) => (
              <th key={header} className="px-4 py-3 text-left">
                <SkeletonText width="w-16" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonTableRow key={i} columns={6} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Skeleton;
