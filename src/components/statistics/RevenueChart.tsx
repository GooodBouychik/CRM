'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { MonthlyRevenue } from '@/lib/api';

interface RevenueChartProps {
  data: MonthlyRevenue[];
  loading?: boolean;
}

// Format month string to Russian locale
function formatMonth(month: string): string {
  const [year, monthNum] = month.split('-');
  const date = new Date(parseInt(year), parseInt(monthNum) - 1);
  return date.toLocaleDateString('ru-RU', { month: 'short', year: '2-digit' });
}

// Format currency
function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M ₽`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K ₽`;
  }
  return `${value.toLocaleString('ru-RU')} ₽`;
}

// Custom tooltip component
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-3 shadow-xl">
      <p className="text-muted-foreground text-sm mb-2">{label}</p>
      <div className="space-y-1">
        <p className="text-emerald-400 font-semibold">
          {payload[0]?.value?.toLocaleString('ru-RU')} ₽
        </p>
        <p className="text-muted-foreground text-sm">
          Заказов: {payload[0]?.payload?.orderCount}
        </p>
      </div>
    </div>
  );
}

export function RevenueChart({ data, loading }: RevenueChartProps) {
  // Transform data for chart
  const chartData = useMemo(() => {
    return data.map((item) => ({
      ...item,
      monthLabel: formatMonth(item.month),
    }));
  }, [data]);

  // Calculate totals
  const totals = useMemo(() => {
    const totalRevenue = data.reduce((sum, item) => sum + item.totalAmount, 0);
    const totalOrders = data.reduce((sum, item) => sum + item.orderCount, 0);
    const avgPerMonth = data.length > 0 ? totalRevenue / data.length : 0;
    return { totalRevenue, totalOrders, avgPerMonth };
  }, [data]);

  if (loading) {
    return (
      <div className="bg-surface-50 border border-surface-200 rounded-2xl p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-surface-200 rounded w-48 mb-6" />
          <div className="h-64 bg-surface-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-50 border border-surface-200 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="text-xl">💰</span>
          <h3 className="font-semibold text-gray-100">Выручка по месяцам</h3>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-surface-100 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Общая выручка</p>
          <p className="text-xl font-bold text-emerald-400">
            {formatCurrency(totals.totalRevenue)}
          </p>
        </div>
        <div className="bg-surface-100 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Всего заказов</p>
          <p className="text-xl font-bold text-blue-400">{totals.totalOrders}</p>
        </div>
        <div className="bg-surface-100 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Среднее в месяц</p>
          <p className="text-xl font-bold text-amber-400">
            {formatCurrency(totals.avgPerMonth)}
          </p>
        </div>
      </div>

      {/* Chart */}
      {chartData.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-muted-foreground animate-fade-in">
          <span className="text-4xl mb-3">📊</span>
          <p className="text-foreground mb-1">Нет данных за выбранный период</p>
          <p className="text-sm text-muted-foreground">Попробуйте выбрать другой период</p>
        </div>
      ) : (
        <div className="h-64 bg-card rounded-lg">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis
                dataKey="monthLabel"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={{ stroke: 'hsl(var(--border))' }}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--accent))' }} />
              <Bar
                dataKey="totalAmount"
                fill="#10B981"
                radius={[4, 4, 0, 0]}
                name="Выручка"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
