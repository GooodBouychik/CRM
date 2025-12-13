'use client';

import { useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { Order, OrderStatus, Priority } from '@/types';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export type SortColumn = 'orderNumber' | 'clientName' | 'title' | 'amount' | 'status' | 'priority' | 'dueDate' | 'updatedAt';
export type SortDirection = 'asc' | 'desc';

interface OrderTableProps {
  orders: Order[];
  selectedOrderIds: Set<string>;
  onSelectOrder: (id: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onOrderClick: (order: Order) => void;
  onDeleteOrder?: (order: Order) => void;
  sortColumn: SortColumn | null;
  sortDirection: SortDirection;
  onSort: (column: SortColumn) => void;
  currentViewers?: Record<string, string[]>;
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'Новый',
  in_progress: 'В работе',
  review: 'На проверке',
  completed: 'Завершён',
  rejected: 'Отклонён',
};

const PRIORITY_LABELS: Record<Priority, string> = {
  high: 'Высокий',
  medium: 'Средний',
  low: 'Низкий',
};

export function getDeadlineClass(dueDate: Date | null): string {
  if (!dueDate) return '';
  const now = new Date();
  const diffTime = dueDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 3) return 'text-deadline-urgent';
  if (diffDays <= 7) return 'text-deadline-warning';
  return '';
}

export function classifyDeadline(dueDate: Date | null, now: Date = new Date()): 'urgent' | 'warning' | 'normal' {
  if (!dueDate) return 'normal';
  const diffTime = dueDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 3) return 'urgent';
  if (diffDays <= 7) return 'warning';
  return 'normal';
}


export function OrderTable({
  orders,
  selectedOrderIds,
  onSelectOrder,
  onSelectAll,
  onOrderClick,
  onDeleteOrder,
  sortColumn,
  sortDirection,
  onSort,
  currentViewers = {},
}: OrderTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: orders.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 52,
    overscan: 10,
  });

  const allSelected = orders.length > 0 && orders.every(o => selectedOrderIds.has(o.id));
  const someSelected = orders.some(o => selectedOrderIds.has(o.id)) && !allSelected;

  const SortableHeader = ({ column, label, className = '' }: { column: SortColumn; label: string; className?: string }) => (
    <th
      className={`px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none ${className}`}
      onClick={() => onSort(column)}
    >
      <div className="flex items-center gap-1">
        {label}
        {sortColumn === column && (
          <span className="text-primary-500">
            {sortDirection === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </div>
    </th>
  );

  return (
    <div className="flex flex-col h-full border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
            <tr>
              <th className="px-3 py-3 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => { if (el) el.indeterminate = someSelected; }}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="rounded border-gray-300 dark:border-gray-600"
                />
              </th>
              <SortableHeader column="orderNumber" label="ID" className="w-20" />
              <SortableHeader column="clientName" label="Клиент" className="w-32" />
              <SortableHeader column="title" label="Название" className="min-w-[200px]" />
              <SortableHeader column="amount" label="Сумма" className="w-28" />
              <SortableHeader column="status" label="Статус" className="w-28" />
              <SortableHeader column="priority" label="Приоритет" className="w-28" />
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-24">
                Просмотр
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-20">
                💬
              </th>
              <SortableHeader column="dueDate" label="Дедлайн" className="w-28" />
              <SortableHeader column="updatedAt" label="Обновлено" className="w-32" />
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Теги
              </th>
              <th className="px-3 py-3 w-12"></th>
            </tr>
          </thead>
        </table>
      </div>

      <div ref={parentRef} className="flex-1 overflow-auto">
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const order = orders[virtualRow.index];
            const isSelected = selectedOrderIds.has(order.id);
            const viewers = currentViewers[order.id] || [];
            const deadlineClass = getDeadlineClass(order.dueDate);

            return (
              <div
                key={order.id}
                data-index={virtualRow.index}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <table className="min-w-full">
                  <tbody>
                    <tr
                      className={`hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer border-b border-gray-200 dark:border-gray-700 ${
                        isSelected ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                      }`}
                      onClick={() => onOrderClick(order)}
                    >
                      <td className="px-3 py-3 w-10" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => onSelectOrder(order.id, e.target.checked)}
                          className="rounded border-gray-300 dark:border-gray-600"
                        />
                      </td>
                      <td className="px-3 py-3 w-20 text-sm font-mono text-gray-900 dark:text-gray-100">
                        #{String(order.orderNumber).padStart(3, '0')}
                      </td>
                      <td className="px-3 py-3 w-32 text-sm text-gray-700 dark:text-gray-300 truncate">
                        {order.clientName || '—'}
                      </td>
                      <td className="px-3 py-3 min-w-[200px] text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {order.title}
                      </td>
                      <td className="px-3 py-3 w-28 text-sm text-gray-700 dark:text-gray-300">
                        {order.amount ? `${order.amount.toLocaleString('ru-RU')} ₽` : '—'}
                      </td>
                      <td className="px-3 py-3 w-28">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full bg-status-${order.status.replace('_', '-')}/20 text-status-${order.status.replace('_', '-')}`}>
                          {STATUS_LABELS[order.status]}
                        </span>
                      </td>
                      <td className="px-3 py-3 w-28">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium text-priority-${order.priority}`}>
                          {order.priority === 'high' && '🔴'}
                          {order.priority === 'medium' && '🟡'}
                          {order.priority === 'low' && '⚪'}
                          {PRIORITY_LABELS[order.priority]}
                        </span>
                      </td>
                      <td className="px-3 py-3 w-24">
                        <div className="flex -space-x-1">
                          {viewers.slice(0, 3).map((viewer, i) => (
                            <div
                              key={i}
                              className="w-6 h-6 rounded-full bg-primary-500 text-white text-xs flex items-center justify-center border-2 border-white dark:border-gray-900"
                              title={viewer}
                            >
                              {viewer[0]}
                            </div>
                          ))}
                          {viewers.length > 3 && (
                            <div className="w-6 h-6 rounded-full bg-gray-400 text-white text-xs flex items-center justify-center border-2 border-white dark:border-gray-900">
                              +{viewers.length - 3}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 w-20 text-sm text-gray-500 dark:text-gray-400">
                        0
                      </td>
                      <td className={`px-3 py-3 w-28 text-sm ${deadlineClass}`}>
                        {order.dueDate ? format(new Date(order.dueDate), 'd MMM', { locale: ru }) : '—'}
                      </td>
                      <td className="px-3 py-3 w-32 text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(order.updatedAt), 'd MMM HH:mm', { locale: ru })}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-1">
                          {order.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                          {order.tags.length > 3 && (
                            <span className="text-xs text-gray-400">+{order.tags.length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 w-12" onClick={(e) => e.stopPropagation()}>
                        {onDeleteOrder && (
                          <button
                            onClick={() => onDeleteOrder(order)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Удалить"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
