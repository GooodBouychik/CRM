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
      className={`px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-accent select-none ${className}`}
      onClick={() => onSort(column)}
    >
      <div className="flex items-center gap-1">
        {label}
        {sortColumn === column && (
          <span className="text-primary">
            {sortDirection === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </div>
    </th>
  );

  // Column widths for consistent alignment
  const colWidths = {
    id: 'w-[70px]',
    client: 'w-[120px]',
    title: 'w-[200px] min-w-[200px]',
    amount: 'w-[100px]',
    status: 'w-[100px]',
    priority: 'w-[100px]',
    viewers: 'w-[80px]',
    comments: 'w-[50px]',
    deadline: 'w-[90px]',
    updated: 'w-[110px]',
    tags: 'w-[150px]',
    actions: 'w-[50px]',
  };

  return (
    <div className="flex flex-col h-full border border-border rounded-xl overflow-hidden bg-card">
      <div className="overflow-x-auto flex-shrink-0">
        <table className="w-full table-fixed">
          <thead className="bg-card">
            <tr>
              <SortableHeader column="orderNumber" label="ID" className={colWidths.id} />
              <SortableHeader column="clientName" label="Клиент" className={colWidths.client} />
              <SortableHeader column="title" label="Название" className={colWidths.title} />
              <SortableHeader column="amount" label="Сумма" className={colWidths.amount} />
              <SortableHeader column="status" label="Статус" className={colWidths.status} />
              <SortableHeader column="priority" label="Приоритет" className={colWidths.priority} />
              <th className={`px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider ${colWidths.viewers}`}>
                👁
              </th>
              <th className={`px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider ${colWidths.comments}`}>
                💬
              </th>
              <SortableHeader column="dueDate" label="Дедлайн" className={colWidths.deadline} />
              <SortableHeader column="updatedAt" label="Обновлено" className={colWidths.updated} />
              <th className={`px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider ${colWidths.tags}`}>
                Теги
              </th>
              <th className={`px-3 py-3 ${colWidths.actions}`}></th>
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
                <table className="w-full table-fixed">
                  <tbody>
                    <tr
                      className={`hover:bg-accent/50 cursor-pointer border-b border-border ${
                        isSelected ? 'bg-primary/10' : ''
                      }`}
                      onClick={() => onOrderClick(order)}
                    >
                      <td className={`px-3 py-3 text-sm font-mono text-foreground ${colWidths.id}`}>
                        #{String(order.orderNumber).padStart(3, '0')}
                      </td>
                      <td className={`px-3 py-3 text-sm text-muted-foreground truncate ${colWidths.client}`}>
                        {order.clientName || '—'}
                      </td>
                      <td className={`px-3 py-3 text-sm font-medium text-foreground truncate ${colWidths.title}`}>
                        {order.title}
                      </td>
                      <td className={`px-3 py-3 text-sm text-muted-foreground ${colWidths.amount}`}>
                        {order.amount ? `${order.amount.toLocaleString('ru-RU')} ₽` : '—'}
                      </td>
                      <td className={`px-3 py-3 ${colWidths.status}`}>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full bg-status-${order.status.replace('_', '-')}/20 text-status-${order.status.replace('_', '-')}`}>
                          {STATUS_LABELS[order.status]}
                        </span>
                      </td>
                      <td className={`px-3 py-3 ${colWidths.priority}`}>
                        <span className={`inline-flex items-center gap-1 text-xs font-medium text-priority-${order.priority}`}>
                          {order.priority === 'high' && '🔴'}
                          {order.priority === 'medium' && '🟡'}
                          {order.priority === 'low' && '⚪'}
                          {PRIORITY_LABELS[order.priority]}
                        </span>
                      </td>
                      <td className={`px-3 py-3 ${colWidths.viewers}`}>
                        <div className="flex -space-x-1">
                          {viewers.slice(0, 3).map((viewer, i) => (
                            <div
                              key={i}
                              className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center border border-card"
                              title={viewer}
                            >
                              {viewer[0]}
                            </div>
                          ))}
                          {viewers.length > 3 && (
                            <div className="w-5 h-5 rounded-full bg-muted text-muted-foreground text-xs flex items-center justify-center border border-card">
                              +{viewers.length - 3}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className={`px-3 py-3 text-sm text-muted-foreground ${colWidths.comments}`}>
                        0
                      </td>
                      <td className={`px-3 py-3 text-sm ${deadlineClass} ${colWidths.deadline}`}>
                        {order.dueDate ? format(new Date(order.dueDate), 'd MMM', { locale: ru }) : '—'}
                      </td>
                      <td className={`px-3 py-3 text-sm text-muted-foreground ${colWidths.updated}`}>
                        {format(new Date(order.updatedAt), 'd MMM HH:mm', { locale: ru })}
                      </td>
                      <td className={`px-3 py-3 ${colWidths.tags}`}>
                        <div className="flex flex-wrap gap-1 overflow-hidden">
                          {order.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex px-1.5 py-0.5 text-xs bg-muted text-muted-foreground rounded truncate max-w-[60px]"
                            >
                              {tag}
                            </span>
                          ))}
                          {order.tags.length > 2 && (
                            <span className="text-xs text-muted-foreground">+{order.tags.length - 2}</span>
                          )}
                        </div>
                      </td>
                      <td className={`px-3 py-3 ${colWidths.actions}`} onClick={(e) => e.stopPropagation()}>
                        {onDeleteOrder && (
                          <button
                            onClick={() => onDeleteOrder(order)}
                            className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
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
