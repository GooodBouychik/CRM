'use client';

import { useState } from 'react';
import Link from 'next/link';
import { OrderJourney } from './OrderJourney';
import { fetchOrderJourney, deleteOrder, type ClientOrder, type OrderJourney as OrderJourneyType } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

export interface ClientOrdersProps {
  orders: ClientOrder[];
  onOrderDeleted?: (orderId: string) => void;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  new: { label: 'Новый', color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
  in_progress: { label: 'В работе', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10' },
  review: { label: 'Проверка', color: 'text-purple-400', bgColor: 'bg-purple-500/10' },
  completed: { label: 'Готов', color: 'text-green-400', bgColor: 'bg-green-500/10' },
  rejected: { label: 'Отклонён', color: 'text-red-400', bgColor: 'bg-red-500/10' },
};

export function ClientOrders({ orders, onOrderDeleted }: ClientOrdersProps) {
  const { showToast } = useToast();
  const [journeys, setJourneys] = useState<Map<string, OrderJourneyType>>(new Map());
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [loadingJourneys, setLoadingJourneys] = useState<Set<string>>(new Set());
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);

  const handleDeleteOrder = async (e: React.MouseEvent, order: ClientOrder) => {
    e.stopPropagation();
    const confirmed = window.confirm(`Удалить заказ #${order.orderNumber} "${order.title}"?`);
    if (!confirmed) return;

    setDeletingOrderId(order.id);
    try {
      await deleteOrder(order.id);
      showToast('Заказ удалён', { type: 'success' });
      onOrderDeleted?.(order.id);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Ошибка удаления', { type: 'error' });
    } finally {
      setDeletingOrderId(null);
    }
  };

  const formatAmount = (amount: number | null) => {
    if (amount === null) return '—';
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const loadJourney = async (orderId: string) => {
    if (journeys.has(orderId) || loadingJourneys.has(orderId)) return;
    
    setLoadingJourneys(prev => new Set(prev).add(orderId));
    try {
      const journey = await fetchOrderJourney(orderId);
      if (journey) {
        setJourneys(prev => new Map(prev).set(orderId, journey));
      }
    } catch (err) {
      console.error('Failed to load journey:', err);
    } finally {
      setLoadingJourneys(prev => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
    }
  };

  const handleToggleExpand = (orderId: string) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
    } else {
      setExpandedOrderId(orderId);
      loadJourney(orderId);
    }
  };

  return (
    <div className="rounded-xl bg-surface-50 border border-surface-200 p-6">
      <h2 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
        <span>📋</span>
        История заказов
        <span className="text-sm font-normal text-gray-500">({orders.length})</span>
      </h2>

      {orders.length === 0 ? (
        <div className="text-center py-8 text-gray-500 animate-fade-in">
          <span className="text-4xl mb-3 block">📋</span>
          <p className="text-gray-400 mb-1">Нет заказов</p>
          <p className="text-sm text-gray-500">У этого клиента пока нет заказов</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order, index) => {
            const config = statusConfig[order.status] || statusConfig.new;
            const isExpanded = expandedOrderId === order.id;
            const journey = journeys.get(order.id);
            const isLoadingJourney = loadingJourneys.has(order.id);

            return (
              <div
                key={order.id}
                className="rounded-lg bg-surface-100 border border-surface-200 overflow-hidden transition-all duration-200 hover:border-surface-300 animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Order header */}
                <div
                  className="p-4 cursor-pointer hover:bg-surface-200/50 transition-colors"
                  onClick={() => handleToggleExpand(order.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm text-gray-500">#{order.orderNumber}</span>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${config.bgColor} ${config.color}`}>
                          {config.label}
                        </span>
                      </div>
                      <Link
                        href={`/orders/${order.id}`}
                        className="font-medium text-gray-100 hover:text-accent-400 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {order.title}
                      </Link>
                      {order.description && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                          {order.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0 flex items-start gap-2">
                      <div>
                        <p className="font-medium text-gray-200">{formatAmount(order.amount)}</p>
                        <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                      </div>
                      <button
                        onClick={(e) => handleDeleteOrder(e, order)}
                        disabled={deletingOrderId === order.id}
                        className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50"
                        title="Удалить заказ"
                      >
                        {deletingOrderId === order.id ? (
                          <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expand indicator */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-surface-200">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      {order.assignedTo.length > 0 && (
                        <span>👥 {order.assignedTo.join(', ')}</span>
                      )}
                    </div>
                    <button className="text-gray-500 hover:text-gray-300 transition-colors">
                      <svg
                        className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Expanded journey */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-surface-200 bg-surface-50/50">
                    <div className="pt-4">
                      <h4 className="text-sm font-medium text-gray-400 mb-3">Order Journey</h4>
                      {isLoadingJourney ? (
                        <div className="flex items-center gap-2 text-gray-500">
                          <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                          <span>Загрузка...</span>
                        </div>
                      ) : journey ? (
                        <OrderJourney steps={journey.steps} />
                      ) : (
                        <p className="text-gray-500">Не удалось загрузить историю</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ClientOrders;
