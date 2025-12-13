'use client';

import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Order, OrderStatus, Priority } from '@/types';
import { classifyDeadline } from './OrderTable';

interface MobileOrderCardProps {
  order: Order;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onClick: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'Новый',
  in_progress: 'В работе',
  review: 'На проверке',
  completed: 'Завершён',
  rejected: 'Отклонён',
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  new: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200',
  in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200',
  review: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200',
};

const PRIORITY_ICONS: Record<Priority, string> = {
  high: '🔴',
  medium: '🟡',
  low: '⚪',
};

export function MobileOrderCard({
  order,
  isSelected,
  onSelect,
  onClick,
}: MobileOrderCardProps) {
  const deadlineClass = order.dueDate ? classifyDeadline(new Date(order.dueDate)) : 'normal';
  const deadlineColorClass = deadlineClass === 'urgent' 
    ? 'text-red-500' 
    : deadlineClass === 'warning' 
      ? 'text-yellow-500' 
      : 'text-gray-500';

  return (
    <div
      className={`
        bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700
        p-3 mb-2 active:scale-[0.98] transition-transform touch-manipulation
        ${isSelected ? 'ring-2 ring-primary-500' : ''}
      `}
      onClick={onClick}
    >
      {/* Header row */}
      <div className="flex items-start justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              onSelect(e.target.checked);
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 touch-manipulation"
          />
          <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
            #{String(order.orderNumber).padStart(3, '0')}
          </span>
          <span className="text-sm">{PRIORITY_ICONS[order.priority]}</span>
        </div>
        <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded-full ${STATUS_COLORS[order.status]}`}>
          {STATUS_LABELS[order.status]}
        </span>
      </div>

      {/* Title */}
      <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-1 line-clamp-2">
        {order.title}
      </h3>

      {/* Client */}
      {order.clientName && (
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1.5 truncate">
          {order.clientName}
        </p>
      )}

      {/* Bottom row */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          {order.amount && (
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {order.amount.toLocaleString('ru-RU')} ₽
            </span>
          )}
          {order.dueDate && (
            <span className={deadlineColorClass}>
              📅 {format(new Date(order.dueDate), 'd MMM', { locale: ru })}
            </span>
          )}
        </div>
        <span className="text-gray-400 dark:text-gray-500 text-[10px]">
          {format(new Date(order.updatedAt), 'd MMM HH:mm', { locale: ru })}
        </span>
      </div>

      {/* Tags + Assigned - combined row */}
      {(order.tags.length > 0 || order.assignedTo.length > 0) && (
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
          {/* Tags */}
          <div className="flex flex-wrap gap-1 flex-1 min-w-0">
            {order.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="px-1.5 py-0.5 text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded truncate max-w-[80px]"
              >
                {tag}
              </span>
            ))}
            {order.tags.length > 2 && (
              <span className="text-[10px] text-gray-400">+{order.tags.length - 2}</span>
            )}
          </div>

          {/* Assigned avatars */}
          {order.assignedTo.length > 0 && (
            <div className="flex -space-x-1 flex-shrink-0 ml-2">
              {order.assignedTo.slice(0, 3).map((name) => (
                <div
                  key={name}
                  className="w-5 h-5 rounded-full bg-primary-500 text-white text-[10px] flex items-center justify-center border border-white dark:border-gray-800"
                  title={name}
                >
                  {name[0]}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
