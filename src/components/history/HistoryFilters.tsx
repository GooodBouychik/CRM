'use client';

import { useState, useEffect } from 'react';
import type { ParticipantName, OrderStatus } from '@/types';
import { getUniqueClients } from '@/lib/api';

export interface HistoryFiltersType {
  search: string;
  dateFrom: string | null;
  dateTo: string | null;
  status: OrderStatus | null;
  clientName: string | null;
}

export interface HistoryFiltersProps {
  filters: HistoryFiltersType;
  onFiltersChange: (filters: HistoryFiltersType) => void;
  onClear: () => void;
}

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: 'new', label: 'Новый' },
  { value: 'in_progress', label: 'В работе' },
  { value: 'review', label: 'Проверка' },
  { value: 'completed', label: 'Завершён' },
  { value: 'rejected', label: 'Отклонён' },
];

export function HistoryFilters({
  filters,
  onFiltersChange,
  onClear,
}: HistoryFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [clients, setClients] = useState<string[]>([]);

  useEffect(() => {
    getUniqueClients().then(setClients).catch(console.error);
  }, []);

  const hasActiveFilters =
    filters.search ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.status ||
    filters.clientName;

  const activeFilterCount = [
    filters.search,
    filters.dateFrom || filters.dateTo,
    filters.status,
    filters.clientName,
  ].filter(Boolean).length;


  return (
    <div className="bg-surface-50 rounded-xl border border-surface-200 p-4 mb-6 animate-fade-in">
      {/* Search and toggle row */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search input */}
        <div className="flex-1 relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Поиск по названию, клиенту или номеру..."
            value={filters.search}
            onChange={(e) =>
              onFiltersChange({ ...filters, search: e.target.value })
            }
            className="w-full pl-10 pr-4 py-2.5 bg-surface-100 border border-surface-200 rounded-lg text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Filter toggle button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all duration-200 ${
            isExpanded || hasActiveFilters
              ? 'bg-primary-500/10 border-primary-500/50 text-primary-400'
              : 'bg-surface-100 border-surface-200 text-gray-300 hover:bg-surface-200 hover:text-gray-100'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          <span className="text-sm font-medium">Фильтры</span>
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium bg-primary-500 text-white rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>


      {/* Expanded filters */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-surface-200 animate-slide-up">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date from */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Дата от
              </label>
              <input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    dateFrom: e.target.value || null,
                  })
                }
                className="w-full px-3 py-2 bg-surface-100 border border-surface-200 rounded-lg text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Date to */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Дата до
              </label>
              <input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    dateTo: e.target.value || null,
                  })
                }
                className="w-full px-3 py-2 bg-surface-100 border border-surface-200 rounded-lg text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Status filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Статус
              </label>
              <select
                value={filters.status || ''}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    status: (e.target.value as OrderStatus) || null,
                  })
                }
                className="w-full px-3 py-2 bg-surface-100 border border-surface-200 rounded-lg text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              >
                <option value="">Все статусы</option>
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Client filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Клиент
              </label>
              <select
                value={filters.clientName || ''}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    clientName: e.target.value || null,
                  })
                }
                className="w-full px-3 py-2 bg-surface-100 border border-surface-200 rounded-lg text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              >
                <option value="">Все клиенты</option>
                {clients.map((client) => (
                  <option key={client} value={client}>
                    {client}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Clear filters button */}
          {hasActiveFilters && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={onClear}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:text-gray-100 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Сбросить фильтры
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default HistoryFilters;
