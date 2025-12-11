'use client';

import { useState, useEffect } from 'react';
import type { OrderStatus, Priority } from '@/types';

interface OrderFiltersProps {
  statusFilter: OrderStatus | null;
  priorityFilter: Priority | null;
  searchQuery: string;
  onStatusChange: (status: OrderStatus | null) => void;
  onPriorityChange: (priority: Priority | null) => void;
  onSearchChange: (query: string) => void;
}

const STATUS_OPTIONS: { value: OrderStatus; label: string; shortLabel: string }[] = [
  { value: 'new', label: 'Новый', shortLabel: 'Нов' },
  { value: 'in_progress', label: 'В работе', shortLabel: 'Раб' },
  { value: 'review', label: 'На проверке', shortLabel: 'Пров' },
  { value: 'completed', label: 'Завершён', shortLabel: 'Гот' },
  { value: 'rejected', label: 'Отклонён', shortLabel: 'Откл' },
];

const PRIORITY_OPTIONS: { value: Priority; label: string; icon: string }[] = [
  { value: 'high', label: 'Высокий', icon: '🔴' },
  { value: 'medium', label: 'Средний', icon: '🟡' },
  { value: 'low', label: 'Низкий', icon: '⚪' },
];

export function OrderFilters({
  statusFilter,
  priorityFilter,
  searchQuery,
  onStatusChange,
  onPriorityChange,
  onSearchChange,
}: OrderFiltersProps) {
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [showFilters, setShowFilters] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(localSearch);
    }, 200);
    return () => clearTimeout(timer);
  }, [localSearch, onSearchChange]);

  // Count active filters
  const activeFiltersCount = (statusFilter ? 1 : 0) + (priorityFilter ? 1 : 0);

  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      {/* Mobile: Search + Filter toggle */}
      <div className="flex items-center gap-2 p-3 md:p-4">
        {/* Search */}
        <div className="flex-1">
          <input
            type="text"
            placeholder="Поиск..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full px-3 md:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm md:text-base touch-manipulation"
          />
        </div>

        {/* Mobile filter toggle button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="md:hidden flex items-center gap-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 touch-manipulation"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          {activeFiltersCount > 0 && (
            <span className="bg-primary-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* Desktop: Always visible filters / Mobile: Collapsible */}
      <div className={`${showFilters ? 'block' : 'hidden'} md:block px-3 md:px-4 pb-3 md:pb-4`}>
        <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
          {/* Status Filter */}
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Статус:</span>
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => onStatusChange(null)}
                className={`px-2 md:px-3 py-1.5 text-xs md:text-sm rounded-lg transition-colors touch-manipulation ${
                  statusFilter === null
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Все
              </button>
              {STATUS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => onStatusChange(statusFilter === option.value ? null : option.value)}
                  className={`px-2 md:px-3 py-1.5 text-xs md:text-sm rounded-lg transition-colors touch-manipulation ${
                    statusFilter === option.value
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <span className="md:hidden">{option.shortLabel}</span>
                  <span className="hidden md:inline">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Priority Filter */}
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Приоритет:</span>
            <div className="flex gap-1">
              <button
                onClick={() => onPriorityChange(null)}
                className={`px-2 md:px-3 py-1.5 text-xs md:text-sm rounded-lg transition-colors touch-manipulation ${
                  priorityFilter === null
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Все
              </button>
              {PRIORITY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => onPriorityChange(priorityFilter === option.value ? null : option.value)}
                  className={`px-2 md:px-3 py-1.5 text-xs md:text-sm rounded-lg transition-colors touch-manipulation ${
                    priorityFilter === option.value
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <span className="md:hidden">{option.icon}</span>
                  <span className="hidden md:inline">{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
