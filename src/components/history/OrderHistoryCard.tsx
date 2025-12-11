'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Order } from '@/types';
import type { ViewMode } from './ViewModeToggle';
import { OrderJourney } from '@/components/clients/OrderJourney';
import { fetchOrderJourney, type OrderJourneyStep } from '@/lib/api';

export interface OrderHistoryCardProps {
  order: Order;
  viewMode: ViewMode;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  new: { label: 'Новый', color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
  in_progress: { label: 'В работе', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10' },
  review: { label: 'Проверка', color: 'text-purple-400', bgColor: 'bg-purple-500/10' },
  completed: { label: 'Готов', color: 'text-green-400', bgColor: 'bg-green-500/10' },
  rejected: { label: 'Отклонён', color: 'text-red-400', bgColor: 'bg-red-500/10' },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  high: { label: 'Высокий', color: 'text-red-400' },
  medium: { label: 'Средний', color: 'text-yellow-400' },
  low: { label: 'Низкий', color: 'text-green-400' },
};

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatAmount(amount: number | null) {
  if (amount === null) return '—';
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(amount);
}


export function OrderHistoryCard({ order, viewMode }: OrderHistoryCardProps) {
  const [journey, setJourney] = useState<OrderJourneyStep[]>([]);
  const [loadingJourney, setLoadingJourney] = useState(false);

  useEffect(() => {
    if (viewMode === 'comfortable') {
      setLoadingJourney(true);
      fetchOrderJourney(order.id)
        .then((data) => {
          if (data) {
            setJourney(data.steps);
          }
        })
        .catch(console.error)
        .finally(() => setLoadingJourney(false));
    }
  }, [order.id, viewMode]);

  const status = statusConfig[order.status] || statusConfig.new;
  const priority = priorityConfig[order.priority] || priorityConfig.medium;

  if (viewMode === 'compact') {
    return (
      <Link
        href={`/orders/${order.id}`}
        className="flex items-center gap-4 px-4 py-3 bg-surface-50 hover:bg-surface-100 border-b border-surface-200 transition-colors"
      >
        <span className="text-sm text-gray-500 w-16">#{order.orderNumber}</span>
        <span className="flex-1 font-medium text-gray-200 truncate">{order.title}</span>
        <span className="text-sm text-gray-400 w-32 truncate">{order.clientName || '—'}</span>
        <span className={`text-sm ${status.color} w-24`}>{status.label}</span>
        <span className="text-sm text-gray-400 w-28">{formatAmount(order.amount)}</span>
        <span className="text-sm text-gray-500 w-28">{formatDate(order.createdAt)}</span>
      </Link>
    );
  }

  // Comfortable mode - card with details
  return (
    <Link
      href={`/orders/${order.id}`}
      className="block bg-surface-50 hover:bg-surface-100 rounded-xl border border-surface-200 p-5 transition-all hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm text-gray-500">#{order.orderNumber}</span>
            <span className={`px-2 py-0.5 text-xs rounded-full ${status.bgColor} ${status.color}`}>
              {status.label}
            </span>
            <span className={`text-xs ${priority.color}`}>● {priority.label}</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-100 truncate">{order.title}</h3>
          {order.clientName && (
            <p className="text-sm text-gray-400 mt-1">Клиент: {order.clientName}</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold text-accent-400">{formatAmount(order.amount)}</p>
          <p className="text-xs text-gray-500 mt-1">{formatDate(order.createdAt)}</p>
        </div>
      </div>


      {/* Description preview */}
      {order.description && (
        <p className="text-sm text-gray-400 mb-4 line-clamp-2">{order.description}</p>
      )}

      {/* Tags */}
      {order.tags && order.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {order.tags.slice(0, 5).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-xs bg-surface-200 text-gray-400 rounded-full"
            >
              {tag}
            </span>
          ))}
          {order.tags.length > 5 && (
            <span className="px-2 py-0.5 text-xs text-gray-500">
              +{order.tags.length - 5}
            </span>
          )}
        </div>
      )}

      {/* Assigned to */}
      {order.assignedTo && order.assignedTo.length > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-gray-500">Исполнители:</span>
          <div className="flex gap-1">
            {order.assignedTo.map((name) => (
              <span
                key={name}
                className="px-2 py-0.5 text-xs bg-accent-500/20 text-accent-400 rounded-full"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Order Journey */}
      <div className="pt-4 border-t border-surface-200">
        <p className="text-xs text-gray-500 mb-3">История статусов</p>
        {loadingJourney ? (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-surface-200 animate-pulse" />
            <div className="w-4 h-0.5 bg-surface-200" />
            <div className="w-6 h-6 rounded-full bg-surface-200 animate-pulse" />
          </div>
        ) : journey.length > 0 ? (
          <OrderJourney steps={journey} compact />
        ) : (
          <p className="text-xs text-gray-500">Нет данных о переходах</p>
        )}
      </div>
    </Link>
  );
}

export default OrderHistoryCard;
