'use client';

import { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '@/components/layout';
import {
  HistoryFilters,
  ViewModeToggle,
  OrderHistoryCard,
  useViewMode,
  type HistoryFiltersType,
} from '@/components/history';
import { EmptySearchState } from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { fetchOrdersForHistory, type HistoryOrder } from '@/lib/api';
import type { Order } from '@/types';

const initialFilters: HistoryFiltersType = {
  search: '',
  dateFrom: null,
  dateTo: null,
  status: null,
  clientName: null,
};

export default function HistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<HistoryFiltersType>(initialFilters);
  const [viewMode, setViewMode] = useViewMode();

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const apiFilters: Record<string, string | undefined> = {};
      if (filters.search) apiFilters.search = filters.search;
      if (filters.dateFrom) apiFilters.dateFrom = filters.dateFrom;
      if (filters.dateTo) apiFilters.dateTo = filters.dateTo;
      if (filters.status) apiFilters.status = filters.status;
      if (filters.clientName) apiFilters.clientName = filters.clientName;

      const data = await fetchOrdersForHistory(apiFilters);
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки истории');
    } finally {
      setLoading(false);
    }
  }, [filters]);


  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleClearFilters = useCallback(() => {
    setFilters(initialFilters);
  }, []);

  const hasActiveFilters =
    filters.search ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.status ||
    filters.clientName;

  return (
    <AppLayout
      title="История заказов"
      subtitle="Все заказы с фильтрацией и поиском"
    >
      <div className="p-6">
        {/* Header with filters and view toggle */}
        <div className="flex flex-col lg:flex-row lg:items-start gap-4 mb-6">
          <div className="flex-1">
            <HistoryFilters
              filters={filters}
              onFiltersChange={setFilters}
              onClear={handleClearFilters}
            />
          </div>
          <div className="flex justify-end">
            <ViewModeToggle value={viewMode} onChange={setViewMode} />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          viewMode === 'compact' ? (
            <div className="bg-surface-50 rounded-xl border border-surface-200 overflow-hidden">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-surface-200 animate-pulse">
                  <div className="w-16 h-4 bg-surface-200 rounded" />
                  <div className="flex-1 h-4 bg-surface-200 rounded" />
                  <div className="w-32 h-4 bg-surface-200 rounded" />
                  <div className="w-24 h-4 bg-surface-200 rounded" />
                  <div className="w-28 h-4 bg-surface-200 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>
            <button
              onClick={fetchOrders}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              Попробовать снова
            </button>
          </div>
        ) : orders.length === 0 ? (
          hasActiveFilters ? (
            <EmptySearchState />
          ) : (
            <div className="text-center py-12 animate-fade-in">
              <div className="text-6xl mb-4">🕐</div>
              <h3 className="text-xl font-semibold text-gray-200 mb-2">Нет заказов</h3>
              <p className="text-gray-500">Заказы появятся здесь после создания</p>
            </div>
          )
        ) : viewMode === 'compact' ? (
          <div className="bg-surface-50 rounded-xl border border-surface-200 overflow-hidden">
            {/* Table header */}
            <div className="flex items-center gap-4 px-4 py-2 bg-surface-100 border-b border-surface-200 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <span className="w-16">№</span>
              <span className="flex-1">Название</span>
              <span className="w-32">Клиент</span>
              <span className="w-24">Статус</span>
              <span className="w-28">Сумма</span>
              <span className="w-28">Дата</span>
            </div>
            {orders.map((order) => (
              <OrderHistoryCard key={order.id} order={order} viewMode={viewMode} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orders.map((order) => (
              <OrderHistoryCard key={order.id} order={order} viewMode={viewMode} />
            ))}
          </div>
        )}


        {/* Stats footer */}
        {!loading && orders.length > 0 && (
          <div className="mt-8 pt-6 border-t border-surface-200 animate-fade-in">
            <div className="flex flex-wrap gap-6 text-sm text-gray-400">
              <span>
                Всего: <strong className="text-gray-100 tabular-nums">{orders.length}</strong> заказов
              </span>
              <span>
                Новых:{' '}
                <strong className="text-blue-400 tabular-nums">
                  {orders.filter((o) => o.status === 'new').length}
                </strong>
              </span>
              <span>
                В работе:{' '}
                <strong className="text-yellow-400 tabular-nums">
                  {orders.filter((o) => o.status === 'in_progress').length}
                </strong>
              </span>
              <span>
                На проверке:{' '}
                <strong className="text-purple-400 tabular-nums">
                  {orders.filter((o) => o.status === 'review').length}
                </strong>
              </span>
              <span>
                Завершённых:{' '}
                <strong className="text-green-400 tabular-nums">
                  {orders.filter((o) => o.status === 'completed').length}
                </strong>
              </span>
              <span>
                Отклонённых:{' '}
                <strong className="text-red-400 tabular-nums">
                  {orders.filter((o) => o.status === 'rejected').length}
                </strong>
              </span>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
