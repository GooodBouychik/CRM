'use client';

import Link from 'next/link';
import type { ClientSummary } from '@/lib/api';

export interface ClientListItemProps {
  client: ClientSummary;
}

export function ClientListItem({ client }: ClientListItemProps) {
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Нет заказов';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <Link
      href={`/clients/${encodeURIComponent(client.clientName)}`}
      className="block p-4 rounded-xl bg-surface-50 border border-surface-200 hover:border-accent-500/50 hover:bg-surface-100 transition-all duration-200 group"
    >
      {/* Client name */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-500 to-primary-500 flex items-center justify-center text-white font-semibold">
          {client.clientName.charAt(0).toUpperCase()}
        </div>
        <h3 className="font-semibold text-gray-100 group-hover:text-accent-400 transition-colors truncate">
          {client.clientName}
        </h3>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3">
        {/* Orders count */}
        <div className="flex items-center gap-2">
          <span className="text-lg">📋</span>
          <div>
            <p className="text-xs text-gray-500">Заказов</p>
            <p className="font-medium text-gray-200">{client.totalOrders}</p>
          </div>
        </div>

        {/* Total amount */}
        <div className="flex items-center gap-2">
          <span className="text-lg">💰</span>
          <div>
            <p className="text-xs text-gray-500">Сумма</p>
            <p className="font-medium text-gray-200">{formatAmount(client.totalAmount)}</p>
          </div>
        </div>
      </div>

      {/* Last order date */}
      <div className="mt-3 pt-3 border-t border-surface-200 flex items-center gap-2 text-sm text-gray-500">
        <span>📅</span>
        <span>Последний заказ: {formatDate(client.lastOrderDate)}</span>
      </div>
    </Link>
  );
}

export default ClientListItem;
