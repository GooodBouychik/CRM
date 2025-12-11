'use client';

import { useState } from 'react';
import { ArchiveOrderCard, type ArchivedOrder } from './ArchiveOrderCard';

export interface MonthGroupProps {
  month: string; // "2024-12"
  label: string; // "Декабрь 2024"
  orders: ArchivedOrder[];
  defaultExpanded?: boolean;
  onOrderClick?: (order: ArchivedOrder) => void;
}

export function MonthGroup({
  month,
  label,
  orders,
  defaultExpanded = true,
  onOrderClick,
}: MonthGroupProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const completedCount = orders.filter(o => o.status === 'completed').length;
  const rejectedCount = orders.filter(o => o.status === 'rejected').length;

  return (
    <div className="mb-6">
      {/* Month header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
      >
        <div className="flex items-center gap-3">
          {/* Expand/collapse icon */}
          <svg
            className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${
              isExpanded ? 'rotate-90' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>

          {/* Month label */}
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {label}
          </h3>

          {/* Order count badge */}
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
            {orders.length} заказ{orders.length === 1 ? '' : orders.length < 5 ? 'а' : 'ов'}
          </span>
        </div>

        {/* Status breakdown */}
        <div className="flex items-center gap-3 text-sm">
          {completedCount > 0 && (
            <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              {completedCount}
            </span>
          )}
          {rejectedCount > 0 && (
            <span className="flex items-center gap-1 text-red-500 dark:text-red-400">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              {rejectedCount}
            </span>
          )}
        </div>
      </button>

      {/* Orders grid */}
      {isExpanded && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pl-8">
          {orders.map((order) => (
            <ArchiveOrderCard
              key={order.id}
              order={order}
              onClick={() => onOrderClick?.(order)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default MonthGroup;
