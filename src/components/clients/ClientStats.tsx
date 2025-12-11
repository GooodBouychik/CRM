'use client';

import type { ClientStats as ClientStatsType } from '@/lib/api';

export interface ClientStatsProps {
  stats: ClientStatsType;
}

export function ClientStats({ stats }: ClientStatsProps) {
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatFrequency = (days: number | null) => {
    if (days === null) return 'Недостаточно данных';
    if (days === 0) return 'Менее дня';
    if (days === 1) return '1 день';
    if (days < 5) return `${days} дня`;
    return `${days} дней`;
  };

  const statItems = [
    {
      icon: '📋',
      label: 'Всего заказов',
      value: stats.totalOrders.toString(),
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      icon: '💰',
      label: 'Общая сумма',
      value: formatAmount(stats.totalAmount),
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
    },
    {
      icon: '📊',
      label: 'Средний чек',
      value: formatAmount(stats.averageOrderValue),
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
    },
    {
      icon: '📅',
      label: 'Частота заказов',
      value: formatFrequency(stats.orderFrequencyDays),
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
    },
    {
      icon: '✅',
      label: 'Завершённых',
      value: stats.completedOrders.toString(),
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
    },
    {
      icon: '🔄',
      label: 'Активных',
      value: stats.activeOrders.toString(),
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
    },
  ];

  return (
    <div className="rounded-xl bg-surface-50 border border-surface-200 p-6">
      <h2 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
        <span>📈</span>
        Статистика клиента
      </h2>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statItems.map((item, index) => (
          <div
            key={index}
            className={`rounded-lg ${item.bgColor} p-4 transition-all duration-200 hover:scale-105 animate-slide-up`}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs text-gray-400">{item.label}</span>
            </div>
            <p className={`text-lg font-bold ${item.color} tabular-nums`}>{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ClientStats;
