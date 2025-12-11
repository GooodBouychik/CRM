'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Order } from '@/types';

interface StatsWidgetProps {
  orders: Order[];
  period?: 'week' | 'month';
}

export function StatsWidget({ orders, period = 'week' }: StatsWidgetProps) {
  const stats = useMemo(() => {
    const now = new Date();
    const periodStart = new Date();
    
    if (period === 'week') {
      periodStart.setDate(now.getDate() - 7);
    } else {
      periodStart.setMonth(now.getMonth() - 1);
    }
    
    // Filter orders in period
    const periodOrders = orders.filter(o => new Date(o.createdAt) >= periodStart);
    const completedInPeriod = orders.filter(o => 
      o.status === 'completed' && new Date(o.updatedAt) >= periodStart
    );
    
    // Calculate daily stats for chart
    const days = period === 'week' ? 7 : 30;
    const dailyStats: { date: string; completed: number; created: number }[] = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const completed = orders.filter(o => {
        if (o.status !== 'completed') return false;
        const updated = new Date(o.updatedAt);
        return updated >= date && updated < nextDate;
      }).length;
      
      const created = orders.filter(o => {
        const created = new Date(o.createdAt);
        return created >= date && created < nextDate;
      }).length;
      
      dailyStats.push({
        date: date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
        completed,
        created,
      });
    }
    
    const maxValue = Math.max(...dailyStats.map(d => Math.max(d.completed, d.created)), 1);
    
    return {
      totalCreated: periodOrders.length,
      totalCompleted: completedInPeriod.length,
      dailyStats,
      maxValue,
      avgPerDay: (completedInPeriod.length / days).toFixed(1),
    };
  }, [orders, period]);

  return (
    <div className="bg-surface-50 border border-surface-200 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">📊</span>
          <h3 className="font-semibold text-gray-100">
            Статистика за {period === 'week' ? 'неделю' : 'месяц'}
          </h3>
        </div>
      </div>
      
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-surface-100 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-emerald-400">{stats.totalCompleted}</p>
          <p className="text-xs text-gray-500">Завершено</p>
        </div>
        <div className="bg-surface-100 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-blue-400">{stats.totalCreated}</p>
          <p className="text-xs text-gray-500">Создано</p>
        </div>
        <div className="bg-surface-100 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-amber-400">{stats.avgPerDay}</p>
          <p className="text-xs text-gray-500">В день</p>
        </div>
      </div>
      
      {/* Mini chart */}
      <div className="h-24 flex items-end gap-1">
        {stats.dailyStats.slice(-14).map((day, index) => (
          <motion.div
            key={day.date}
            initial={{ height: 0 }}
            animate={{ height: '100%' }}
            transition={{ delay: index * 0.03, duration: 0.3 }}
            className="flex-1 flex flex-col justify-end gap-0.5"
          >
            {/* Completed bar */}
            <div 
              className="bg-emerald-500/60 rounded-t transition-all duration-300"
              style={{ 
                height: `${(day.completed / stats.maxValue) * 100}%`,
                minHeight: day.completed > 0 ? '4px' : '0'
              }}
            />
            {/* Created bar */}
            <div 
              className="bg-blue-500/40 rounded-b transition-all duration-300"
              style={{ 
                height: `${(day.created / stats.maxValue) * 100}%`,
                minHeight: day.created > 0 ? '4px' : '0'
              }}
            />
          </motion.div>
        ))}
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-3 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded bg-emerald-500/60" />
          <span>Завершено</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded bg-blue-500/40" />
          <span>Создано</span>
        </div>
      </div>
    </div>
  );
}
