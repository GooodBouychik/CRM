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
  Cell,
} from 'recharts';
import type { TeamMemberWorkload } from '@/lib/api';

interface TeamWorkloadChartProps {
  data: TeamMemberWorkload[];
  loading?: boolean;
}

// Status colors
const statusColors = {
  new: '#3B82F6',
  in_progress: '#F59E0B',
  review: '#8B5CF6',
  completed: '#10B981',
  rejected: '#EF4444',
};

const statusLabels: Record<string, string> = {
  new: 'Новые',
  in_progress: 'В работе',
  review: 'На проверке',
  completed: 'Завершённые',
  rejected: 'Отклонённые',
};

// Participant colors
const participantColors: Record<string, string> = {
  'Никита': '#3B82F6',
  'Саня': '#10B981',
  'Ксюша': '#F59E0B',
};

// Custom tooltip component
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0]?.payload;
  if (!data) return null;

  return (
    <div className="bg-surface-100 border border-surface-200 rounded-xl p-3 shadow-xl">
      <p className="text-gray-100 font-semibold mb-2">{label}</p>
      <div className="space-y-1 text-sm">
        <p className="text-gray-400">
          Активных заказов: <span className="text-blue-400 font-medium">{data.activeOrders}</span>
        </p>
        <p className="text-gray-400">
          Часов работы: <span className="text-amber-400 font-medium">{data.totalEstimatedHours}ч</span>
        </p>
        <div className="pt-2 border-t border-surface-200 mt-2">
          <p className="text-gray-500 text-xs mb-1">По статусам:</p>
          {Object.entries(data.ordersByStatus).map(([status, count]) => {
            const countNum = count as number;
            return countNum > 0 && (
              <p key={status} className="text-gray-400 text-xs">
                {statusLabels[status]}: <span className="font-medium">{countNum}</span>
              </p>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function TeamWorkloadChart({ data, loading }: TeamWorkloadChartProps) {
  // Transform data for chart
  const chartData = useMemo(() => {
    return data.map((item) => ({
      ...item,
      name: item.participant,
    }));
  }, [data]);

  // Calculate totals
  const totals = useMemo(() => {
    const totalActive = data.reduce((sum, item) => sum + item.activeOrders, 0);
    const totalHours = data.reduce((sum, item) => sum + item.totalEstimatedHours, 0);
    return { totalActive, totalHours };
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
          <span className="text-xl">👥</span>
          <h3 className="font-semibold text-gray-100">Загрузка команды</h3>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-surface-100 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Активных заказов</p>
          <p className="text-xl font-bold text-blue-400">{totals.totalActive}</p>
        </div>
        <div className="bg-surface-100 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Часов работы</p>
          <p className="text-xl font-bold text-amber-400">{totals.totalHours}ч</p>
        </div>
      </div>

      {/* Chart */}
      {chartData.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-gray-500 animate-fade-in">
          <span className="text-4xl mb-3">👥</span>
          <p className="text-gray-400 mb-1">Нет данных о загрузке команды</p>
          <p className="text-sm text-gray-500">Назначьте заказы участникам команды</p>
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 10, right: 10, left: 60, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis
                type="number"
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                axisLine={{ stroke: '#374151' }}
                tickLine={{ stroke: '#374151' }}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                axisLine={{ stroke: '#374151' }}
                tickLine={{ stroke: '#374151' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="activeOrders" radius={[0, 4, 4, 0]} name="Активные заказы">
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={participantColors[entry.participant] || '#6B7280'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Status distribution per member */}
      <div className="mt-6 space-y-4">
        <h4 className="text-sm font-medium text-gray-400">Распределение по статусам</h4>
        {data.map((member) => (
          <div key={member.participant} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">{member.participant}</span>
              <span className="text-xs text-gray-500">
                {member.activeOrders} активных
              </span>
            </div>
            <div className="flex h-2 rounded-full overflow-hidden bg-surface-200">
              {Object.entries(member.ordersByStatus).map(([status, count]) => {
                const total = Object.values(member.ordersByStatus).reduce((a, b) => a + b, 0);
                const width = total > 0 ? (count / total) * 100 : 0;
                if (width === 0) return null;
                return (
                  <div
                    key={status}
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${width}%`,
                      backgroundColor: statusColors[status as keyof typeof statusColors],
                    }}
                    title={`${statusLabels[status]}: ${count}`}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-surface-200">
        {Object.entries(statusLabels).map(([status, label]) => (
          <div key={status} className="flex items-center gap-1.5 text-xs text-gray-500">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: statusColors[status as keyof typeof statusColors] }}
            />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
