'use client';

import { useState, useEffect } from 'react';
import { fetchOrderHistory, type OrderHistoryEntry } from '@/lib/api';
import type { ParticipantName } from '@/types';

// Field name translations for display
const fieldNameLabels: Record<string, string> = {
  title: 'Название',
  description: 'Описание',
  clientName: 'Клиент',
  amount: 'Сумма',
  status: 'Статус',
  priority: 'Приоритет',
  dueDate: 'Дедлайн',
  tags: 'Теги',
  assignedTo: 'Исполнители',
  isFavorite: 'Избранное',
};

// Status translations
const statusLabels: Record<string, string> = {
  new: 'Новый',
  in_progress: 'В работе',
  review: 'На проверке',
  completed: 'Завершён',
  rejected: 'Отклонён',
};

// Priority translations
const priorityLabels: Record<string, string> = {
  high: 'Высокий',
  medium: 'Средний',
  low: 'Низкий',
};

// Avatar colors for participants
const avatarColors: Record<ParticipantName, string> = {
  'Никита': 'bg-blue-500',
  'Саня': 'bg-green-500',
  'Ксюша': 'bg-purple-500',
};

interface OrderHistoryProps {
  orderId: string;
  isOpen: boolean;
  onClose: () => void;
}

function formatValue(fieldName: string, value: string | null): string {
  if (value === null || value === '') {
    return '(пусто)';
  }

  // Handle status field
  if (fieldName === 'status' && statusLabels[value]) {
    return statusLabels[value];
  }

  // Handle priority field
  if (fieldName === 'priority' && priorityLabels[value]) {
    return priorityLabels[value];
  }

  // Handle boolean values
  if (value === 'true') return 'Да';
  if (value === 'false') return 'Нет';

  // Handle arrays (tags, assignedTo)
  if (value.startsWith('[')) {
    try {
      const arr = JSON.parse(value);
      if (Array.isArray(arr)) {
        return arr.length > 0 ? arr.join(', ') : '(пусто)';
      }
    } catch {
      // Not valid JSON, return as-is
    }
  }

  // Handle dates
  if (fieldName === 'dueDate' && value) {
    try {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('ru-RU');
      }
    } catch {
      // Not a valid date
    }
  }

  // Handle amount (add currency symbol)
  if (fieldName === 'amount' && !isNaN(Number(value))) {
    return `${Number(value).toLocaleString('ru-RU')} ₽`;
  }

  // Truncate long values
  if (value.length > 100) {
    return value.substring(0, 100) + '...';
  }

  return value;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function groupByDate(entries: OrderHistoryEntry[]): Map<string, OrderHistoryEntry[]> {
  const groups = new Map<string, OrderHistoryEntry[]>();
  
  for (const entry of entries) {
    const date = new Date(entry.changedAt).toLocaleDateString('ru-RU');
    const existing = groups.get(date) || [];
    existing.push(entry);
    groups.set(date, existing);
  }
  
  return groups;
}

export function OrderHistory({ orderId, isOpen, onClose }: OrderHistoryProps) {
  const [history, setHistory] = useState<OrderHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && orderId) {
      loadHistory();
    }
  }, [isOpen, orderId]);

  async function loadHistory() {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchOrderHistory(orderId);
      setHistory(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки истории');
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  const groupedHistory = groupByDate(history);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            История изменений
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Закрыть"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
          )}

          {error && (
            <div className="text-center py-8 text-red-500">
              {error}
            </div>
          )}

          {!loading && !error && history.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              История изменений пуста
            </div>
          )}

          {!loading && !error && history.length > 0 && (
            <div className="space-y-6">
              {Array.from(groupedHistory.entries()).map(([date, entries]) => (
                <div key={date}>
                  {/* Date header */}
                  <div className="sticky top-0 bg-white dark:bg-gray-800 py-2 mb-3">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {date}
                    </span>
                  </div>

                  {/* Timeline entries */}
                  <div className="relative pl-8 space-y-4">
                    {/* Timeline line */}
                    <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gray-200 dark:bg-gray-700"></div>

                    {entries.map((entry) => (
                      <div key={entry.id} className="relative">
                        {/* Timeline dot */}
                        <div className={`absolute -left-5 w-3 h-3 rounded-full ${avatarColors[entry.changedBy]} ring-2 ring-white dark:ring-gray-800`}></div>

                        {/* Entry content */}
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {entry.changedBy}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(entry.changedAt).toLocaleTimeString('ru-RU', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>

                          <div className="text-sm text-gray-700 dark:text-gray-300">
                            <span className="text-gray-500 dark:text-gray-400">
                              Изменил(а){' '}
                            </span>
                            <span className="font-medium">
                              {fieldNameLabels[entry.fieldName] || entry.fieldName}
                            </span>
                          </div>

                          <div className="mt-2 flex items-center gap-2 text-sm">
                            <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded line-through">
                              {formatValue(entry.fieldName, entry.oldValue)}
                            </span>
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
                              {formatValue(entry.fieldName, entry.newValue)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
