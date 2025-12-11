'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Order, DashboardTask } from '@/types';

interface DeadlinesWidgetProps {
  orders: Order[];
  tasks: DashboardTask[];
  onOrderClick?: (order: Order) => void;
  onTaskClick?: (task: DashboardTask) => void;
}

interface DeadlineItem {
  id: string;
  title: string;
  dueDate: Date;
  type: 'order' | 'task';
  priority?: 'high' | 'medium' | 'low';
  status: string;
  original: Order | DashboardTask;
}

export function DeadlinesWidget({ orders, tasks, onOrderClick, onTaskClick }: DeadlinesWidgetProps) {
  const deadlines = useMemo(() => {
    const items: DeadlineItem[] = [];
    
    // Add orders with due dates
    orders.forEach(order => {
      if (order.dueDate && order.status !== 'completed' && order.status !== 'rejected') {
        items.push({
          id: order.id,
          title: order.title,
          dueDate: new Date(order.dueDate),
          type: 'order',
          priority: order.priority,
          status: order.status,
          original: order,
        });
      }
    });
    
    // Add tasks with due dates
    tasks.forEach(task => {
      if (task.dueDate && task.status !== 'done') {
        items.push({
          id: task.id,
          title: task.title,
          dueDate: new Date(task.dueDate),
          type: 'task',
          status: task.status,
          original: task,
        });
      }
    });
    
    // Sort by due date
    return items.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime()).slice(0, 5);
  }, [orders, tasks]);

  const getDaysUntil = (date: Date) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);
    return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getUrgencyColor = (days: number) => {
    if (days < 0) return 'text-red-400 bg-red-500/10 border-red-500/20';
    if (days === 0) return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
    if (days <= 2) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  };

  const formatDaysLabel = (days: number) => {
    if (days < 0) return `${Math.abs(days)} дн. назад`;
    if (days === 0) return 'Сегодня';
    if (days === 1) return 'Завтра';
    return `${days} дн.`;
  };

  const handleClick = (item: DeadlineItem) => {
    if (item.type === 'order' && onOrderClick) {
      onOrderClick(item.original as Order);
    } else if (item.type === 'task' && onTaskClick) {
      onTaskClick(item.original as DashboardTask);
    }
  };

  return (
    <div className="bg-surface-50 border border-surface-200 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">⏰</span>
        <h3 className="font-semibold text-gray-100">Ближайшие дедлайны</h3>
      </div>
      
      {deadlines.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-4">
          Нет активных дедлайнов 🎉
        </p>
      ) : (
        <div className="space-y-2">
          {deadlines.map((item, index) => {
            const days = getDaysUntil(item.dueDate);
            const urgencyClass = getUrgencyColor(days);
            
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleClick(item)}
                className={`
                  flex items-center gap-3 p-3 rounded-xl border cursor-pointer
                  bg-surface-100/50 border-surface-200 hover:border-surface-300
                  transition-all duration-200 hover:-translate-x-1
                `}
              >
                <div className={`
                  flex-shrink-0 w-14 h-14 rounded-xl flex flex-col items-center justify-center
                  border ${urgencyClass}
                `}>
                  <span className="text-xs font-medium opacity-70">
                    {item.dueDate.toLocaleDateString('ru-RU', { day: 'numeric' })}
                  </span>
                  <span className="text-[10px] uppercase opacity-50">
                    {item.dueDate.toLocaleDateString('ru-RU', { month: 'short' })}
                  </span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs text-gray-500">
                      {item.type === 'order' ? '📋' : '✓'}
                    </span>
                    <span className={`text-xs font-medium ${urgencyClass.split(' ')[0]}`}>
                      {formatDaysLabel(days)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-200 truncate">{item.title}</p>
                </div>
                
                {item.priority && (
                  <div className={`
                    w-2 h-2 rounded-full flex-shrink-0
                    ${item.priority === 'high' ? 'bg-red-500' : 
                      item.priority === 'medium' ? 'bg-amber-500' : 'bg-gray-500'}
                  `} />
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
