'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOrderStore } from '@/stores/orderStore';
import { useUser } from '@/providers/UserProvider';
import { OrderTable, OrderFilters, OrderForm, MobileOrderList, type SortColumn, type SortDirection } from '@/components/orders';
import { AppLayout } from '@/components/layout';
import { sortOrders, filterOrders } from '@/lib/orderUtils';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useToast } from '@/components/ui/Toast';
import { fetchOrders, deleteOrder } from '@/lib/api';
import { SkeletonCard } from '@/components/ui/Skeleton';
import type { Order, OrderStatus, Priority } from '@/types';

export default function Home() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { showToast } = useToast();
  const { currentUser } = useUser();
  const { orders: ordersMap, selectOrder, deleteOrder: deleteOrderFromStore, setOrders } = useOrderStore();
  const orders = useMemo(() => Object.values(ordersMap), [ordersMap]);
  const [loading, setLoading] = useState(true);

  // Load orders on mount
  useEffect(() => {
    let mounted = true;
    const loadOrders = async () => {
      try {
        const data = await fetchOrders();
        if (mounted) {
          setOrders(data);
        }
      } catch (err) {
        console.error('Failed to load orders:', err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    loadOrders();
    return () => { mounted = false; };
  }, [setOrders]);

  // Selection state
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());

  // Sorting state
  const [sortColumn, setSortColumn] = useState<SortColumn | null>('updatedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Filter state
  const [statusFilter, setStatusFilter] = useState<OrderStatus | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<Priority | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form visibility state
  const [showOrderForm, setShowOrderForm] = useState(false);

  // Handle sorting
  const handleSort = useCallback((column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  }, [sortColumn]);

  // Handle selection
  const handleSelectOrder = useCallback((id: string, selected: boolean) => {
    setSelectedOrderIds((prev) => {
      const next = new Set(prev);
      if (selected) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback((selected: boolean) => {
    if (selected) {
      setSelectedOrderIds(new Set(orders.map((o) => o.id)));
    } else {
      setSelectedOrderIds(new Set());
    }
  }, [orders]);

  // Handle order click - navigate to detail page
  const handleOrderClick = useCallback((order: Order) => {
    selectOrder(order.id);
    router.push(`/orders/${order.id}`);
  }, [selectOrder, router]);

  // Handle order delete
  const handleDeleteOrder = useCallback(async (order: Order) => {
    const confirmed = window.confirm(`Удалить заказ #${String(order.orderNumber).padStart(3, '0')} "${order.title}"?`);
    if (!confirmed) return;

    try {
      await deleteOrder(order.id);
      deleteOrderFromStore(order.id);
      showToast('Заказ удалён', { type: 'success' });
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Ошибка удаления', { type: 'error' });
    }
  }, [deleteOrderFromStore, showToast]);

  // Process orders: filter then sort
  const processedOrders = useMemo(() => {
    const filtered = filterOrders(orders, {
      status: statusFilter,
      priority: priorityFilter,
      search: searchQuery,
    });
    return sortOrders(filtered, sortColumn, sortDirection);
  }, [orders, statusFilter, priorityFilter, searchQuery, sortColumn, sortDirection]);

  return (
    <AppLayout
      title="Заказы"
      subtitle={`${processedOrders.length} заказов`}
      actions={
        <button
          onClick={() => setShowOrderForm(true)}
          className="px-3 md:px-4 py-1.5 md:py-2 text-sm md:text-base bg-accent-500 text-white rounded-xl hover:bg-accent-600 transition-all duration-200 shadow-lg shadow-accent-500/25 hover:shadow-accent-500/40 touch-manipulation"
        >
          <span className="hidden sm:inline">+ Новый заказ</span>
          <span className="sm:hidden">+ Заказ</span>
        </button>
      }
    >
      <div className="flex flex-col h-full">
        {/* Order form */}
        {showOrderForm && (
          <div className="px-3 md:px-6 py-2 md:py-4 border-b border-surface-200 bg-surface-50">
            <OrderForm onClose={() => setShowOrderForm(false)} />
          </div>
        )}

        {/* Filters */}
        <OrderFilters
          statusFilter={statusFilter}
          priorityFilter={priorityFilter}
          searchQuery={searchQuery}
          onStatusChange={setStatusFilter}
          onPriorityChange={setPriorityFilter}
          onSearchChange={setSearchQuery}
        />

        {/* Order list */}
        <div className="flex-1 p-2 md:p-4 overflow-hidden">
          {loading ? (
            <div className="grid grid-cols-1 gap-3 md:gap-4 p-2 md:p-4">
              {[...Array(5)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : processedOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in px-4">
              <span className="text-5xl md:text-6xl mb-3 md:mb-4">📋</span>
              <h3 className="text-lg md:text-xl font-semibold text-gray-200 mb-2">
                {searchQuery || statusFilter || priorityFilter ? 'Заказы не найдены' : 'Нет заказов'}
              </h3>
              <p className="text-sm md:text-base text-gray-500 mb-4 md:mb-6">
                {searchQuery || statusFilter || priorityFilter 
                  ? 'Попробуйте изменить фильтры' 
                  : 'Создайте первый заказ'}
              </p>
              {!searchQuery && !statusFilter && !priorityFilter && (
                <button
                  onClick={() => setShowOrderForm(true)}
                  className="px-4 py-2 bg-accent-500 text-white rounded-xl hover:bg-accent-600 transition-all duration-200 touch-manipulation"
                >
                  + Создать заказ
                </button>
              )}
            </div>
          ) : isMobile ? (
            <MobileOrderList
              orders={processedOrders}
              selectedOrderIds={selectedOrderIds}
              onSelectOrder={handleSelectOrder}
              onOrderClick={handleOrderClick}
            />
          ) : (
            <OrderTable
              orders={processedOrders}
              selectedOrderIds={selectedOrderIds}
              onSelectOrder={handleSelectOrder}
              onSelectAll={handleSelectAll}
              onOrderClick={handleOrderClick}
              onDeleteOrder={handleDeleteOrder}
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
          )}
        </div>
      </div>
    </AppLayout>
  );
}
