'use client';

import { useState, useCallback } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Order, OrderStatus, Priority } from '@/types';
import { classifyDeadline } from './OrderTable';
import { useSwipe } from '@/hooks/useSwipe';

interface SwipeableOrderCardProps {
  order: Order;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onClick: () => void;
  onQuickAction?: (action: 'complete' | 'delete' | 'archive') => void;
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

export function SwipeableOrderCard({
  order,
  isSelected,
  onSelect,
  onClick,
  onQuickAction,
}: SwipeableOrderCardProps) {
  const [showActions, setShowActions] = useState<'left' | 'right' | null>(null);

  const handleSwipeLeft = useCallback(() => {
    setShowActions('left');
  }, []);

  const handleSwipeRight = useCallback(() => {
    setShowActions('right');
  }, []);

  const { swipeOffset, isSwiping, handlers, reset } = useSwipe({
    threshold: 80,
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
  });

  const handleAction = useCallback((action: 'complete' | 'delete' | 'archive') => {
    onQuickAction?.(action);
    setShowActions(null);
    reset();
  }, [onQuickAction, reset]);

  const handleCardClick = useCallback(() => {
    if (showActions) {
      setShowActions(null);
      reset();
    } else if (!isSwiping) {
      onClick();
    }
  }, [showActions, isSwiping, onClick, reset]);

  const deadlineClass = order.dueDate ? classifyDeadline(new Date(order.dueDate)) : 'normal';
  const deadlineColorClass = deadlineClass === 'urgent' 
    ? 'text-red-500' 
    : deadlineClass === 'warning' 
      ? 'text-yellow-500' 
      : 'text-gray-500';

  // Calculate transform based on swipe state
  const getTransform = () => {
    if (showActions === 'left') return 'translateX(-100px)';
    if (showActions === 'right') return 'translateX(100px)';
    if (isSwiping) return `translateX(${swipeOffset}px)`;
    return 'translateX(0)';
  };

  return (
    <div className="relative mb-3 overflow-hidden rounded-lg">
      {/* Left action buttons (revealed on swipe right) */}
      <div className="absolute inset-y-0 left-0 flex items-center">
        <button
          onClick={() => handleAction('complete')}
          className="h-full px-4 bg-green-500 text-white flex items-center justify-center touch-manipulation"
        >
          <span className="flex flex-col items-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-xs mt-1">Готово</span>
          </span>
        </button>
      </div>

      {/* Right action buttons (revealed on swipe left) */}
      <div className="absolute inset-y-0 right-0 flex items-center">
        <button
          onClick={() => handleAction('archive')}
          className="h-full px-4 bg-gray-500 text-white flex items-center justify-center touch-manipulation"
        >
          <span className="flex flex-col items-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            <span className="text-xs mt-1">Архив</span>
          </span>
        </button>
        <button
          onClick={() => handleAction('delete')}
          className="h-full px-4 bg-red-500 text-white flex items-center justify-center touch-manipulation"
        >
          <span className="flex flex-col items-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span className="text-xs mt-1">Удалить</span>
          </span>
        </button>
      </div>

      {/* Main card content */}
      <div
        className={`
          bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700
          p-4 transition-transform duration-200 ease-out touch-manipulation
          ${isSelected ? 'ring-2 ring-primary-500' : ''}
          ${isSwiping ? 'transition-none' : ''}
        `}
        style={{ transform: getTransform() }}
        onClick={handleCardClick}
        {...handlers}
      >
        {/* Header row */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation();
                onSelect(e.target.checked);
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 touch-manipulation"
            />
            <span className="text-sm font-mono text-gray-500 dark:text-gray-400">
              #{String(order.orderNumber).padStart(3, '0')}
            </span>
            <span className="text-lg">{PRIORITY_ICONS[order.priority]}</span>
          </div>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[order.status]}`}>
            {STATUS_LABELS[order.status]}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1 line-clamp-2">
          {order.title}
        </h3>

        {/* Client */}
        {order.clientName && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {order.clientName}
          </p>
        )}

        {/* Bottom row */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-3">
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
          <span className="text-gray-400 dark:text-gray-500 text-xs">
            {format(new Date(order.updatedAt), 'd MMM HH:mm', { locale: ru })}
          </span>
        </div>

        {/* Tags */}
        {order.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {order.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded"
              >
                {tag}
              </span>
            ))}
            {order.tags.length > 3 && (
              <span className="text-xs text-gray-400">+{order.tags.length - 3}</span>
            )}
          </div>
        )}

        {/* Assigned avatars */}
        {order.assignedTo.length > 0 && (
          <div className="flex -space-x-1 mt-2">
            {order.assignedTo.map((name) => (
              <div
                key={name}
                className="w-6 h-6 rounded-full bg-primary-500 text-white text-xs flex items-center justify-center border-2 border-white dark:border-gray-800"
                title={name}
              >
                {name[0]}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
