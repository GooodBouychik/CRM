'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { AppLayout } from '@/components/layout';
import {
  MonthGroup,
  ArchiveFilters,
  ArchiveDetail,
  type ArchivedOrder,
  type ArchiveFiltersType,
} from '@/components/archive';
import { EmptyArchiveState, EmptySearchState } from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/Skeleton';
import {
  fetchArchivedOrders,
  fetchArchivedOrderDetail,
  type ArchiveDetailResponse,
} from '@/lib/api';
import type { Comment } from '@/types';
import type { OrderHistoryEntry } from '@/lib/api';

// Helper to group orders by month
function groupOrdersByMonth(orders: ArchivedOrder[]): Map<string, { label: string; orders: ArchivedOrder[] }> {
  const groups = new Map<string, { label: string; orders: ArchivedOrder[] }>();

  for (const order of orders) {
    const date = new Date(order.completedAt);
    const monthKey = format(date, 'yyyy-MM');
    const monthLabel = format(date, 'LLLL yyyy', { locale: ru });
    // Capitalize first letter
    const capitalizedLabel = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

    if (!groups.has(monthKey)) {
      groups.set(monthKey, { label: capitalizedLabel, orders: [] });
    }
    groups.get(monthKey)!.orders.push(order);
  }

  // Sort by month descending (newest first)
  const sortedEntries = Array.from(groups.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  return new Map(sortedEntries);
}

const initialFilters: ArchiveFiltersType = {
  search: '',
  dateFrom: null,
  dateTo: null,
  participant: null,
  status: null,
};

export default function ArchivePage() {
  const [orders, setOrders] = useState<ArchivedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ArchiveFiltersType>(initialFilters);

  // Detail modal state
  const [selectedOrder, setSelectedOrder] = useState<ArchivedOrder | null>(null);
  const [detailData, setDetailData] = useState<{
    comments: Comment[];
    history: OrderHistoryEntry[];
  } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Fetch archived orders
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const apiFilters: Record<string, string | undefined> = {};
      if (filters.search) apiFilters.search = filters.search;
      if (filters.dateFrom) apiFilters.dateFrom = filters.dateFrom;
      if (filters.dateTo) apiFilters.dateTo = filters.dateTo;
      if (filters.participant) apiFilters.participant = filters.participant;
      if (filters.status) apiFilters.status = filters.status;

      const data = await fetchArchivedOrders(apiFilters);
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки архива');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Group orders by month
  const monthGroups = useMemo(() => groupOrdersByMonth(orders), [orders]);

  // Handle order click - fetch detail
  const handleOrderClick = useCallback(async (order: ArchivedOrder) => {
    setSelectedOrder(order);
    setDetailLoading(true);
    setDetailData(null);

    try {
      const data = await fetchArchivedOrderDetail(order.id);
      setDetailData({
        comments: data.comments,
        history: data.history,
      });
    } catch (err) {
      console.error('Failed to fetch order details:', err);
      // Still show the modal with basic info
      setDetailData({ comments: [], history: [] });
    } finally {
      setDetailLoading(false);
    }
  }, []);

  // Close detail modal
  const handleCloseDetail = useCallback(() => {
    setSelectedOrder(null);
    setDetailData(null);
  }, []);

  // Clear filters
  const handleClearFilters = useCallback(() => {
    setFilters(initialFilters);
  }, []);

  // Check if any filters are active
  const hasActiveFilters =
    filters.search ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.participant ||
    filters.status;

  return (
    <AppLayout
      title="Архив заказов"
      subtitle="Завершённые и отклонённые заказы"
    >
      <div className="p-6">
        {/* Filters */}
        <ArchiveFilters
          filters={filters}
          onFiltersChange={setFilters}
          onClear={handleClearFilters}
        />

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
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
            <EmptyArchiveState />
          )
        ) : (
          <div className="space-y-2">
            {Array.from(monthGroups.entries()).map(([monthKey, { label, orders: monthOrders }]) => (
              <MonthGroup
                key={monthKey}
                month={monthKey}
                label={label}
                orders={monthOrders}
                onOrderClick={handleOrderClick}
              />
            ))}
          </div>
        )}

        {/* Stats footer */}
        {!loading && orders.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap gap-6 text-sm text-gray-500 dark:text-gray-400">
              <span>
                Всего: <strong className="text-gray-900 dark:text-gray-100">{orders.length}</strong> заказов
              </span>
              <span>
                Завершённых:{' '}
                <strong className="text-green-600 dark:text-green-400">
                  {orders.filter((o) => o.status === 'completed').length}
                </strong>
              </span>
              <span>
                Отклонённых:{' '}
                <strong className="text-red-600 dark:text-red-400">
                  {orders.filter((o) => o.status === 'rejected').length}
                </strong>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedOrder && (
        <ArchiveDetail
          order={selectedOrder}
          comments={detailData?.comments || []}
          history={detailData?.history || []}
          isLoading={detailLoading}
          onClose={handleCloseDetail}
        />
      )}
    </AppLayout>
  );
}
