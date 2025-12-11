'use client';

import { useState, useCallback, useMemo } from 'react';
import type { Comment } from '@/types';

export interface CommentTimelineProps {
  comments: Comment[];
  onNavigateToDate: (date: Date) => void;
}

/**
 * Finds the first comment on or after the given date
 */
export function findCommentByDate(comments: Comment[], targetDate: Date): Comment | null {
  const targetTime = new Date(targetDate).setHours(0, 0, 0, 0);
  
  // Sort comments by date
  const sorted = [...comments].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  
  // Find first comment on or after target date
  for (const comment of sorted) {
    const commentDate = new Date(comment.createdAt).setHours(0, 0, 0, 0);
    if (commentDate >= targetTime) {
      return comment;
    }
  }
  
  // If no comment found after date, return the last comment
  return sorted.length > 0 ? sorted[sorted.length - 1] : null;
}

/**
 * Gets a date N days ago from today
 */
export function getDateDaysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatDateForInput(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function CommentTimeline({ comments, onNavigateToDate }: CommentTimelineProps) {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);

  // Get date range from comments
  const dateRange = useMemo(() => {
    if (comments.length === 0) return null;
    
    const dates = comments.map(c => new Date(c.createdAt).getTime());
    return {
      min: new Date(Math.min(...dates)),
      max: new Date(Math.max(...dates)),
    };
  }, [comments]);

  const handleDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const dateStr = e.target.value;
    setSelectedDate(dateStr);
    if (dateStr) {
      onNavigateToDate(new Date(dateStr));
    }
  }, [onNavigateToDate]);

  const handleQuickLink = useCallback((days: number) => {
    const date = getDateDaysAgo(days);
    setSelectedDate(formatDateForInput(date));
    onNavigateToDate(date);
    setIsOpen(false);
  }, [onNavigateToDate]);

  const handleGoToStart = useCallback(() => {
    if (dateRange) {
      setSelectedDate(formatDateForInput(dateRange.min));
      onNavigateToDate(dateRange.min);
      setIsOpen(false);
    }
  }, [dateRange, onNavigateToDate]);

  const handleGoToEnd = useCallback(() => {
    if (dateRange) {
      setSelectedDate(formatDateForInput(dateRange.max));
      onNavigateToDate(dateRange.max);
      setIsOpen(false);
    }
  }, [dateRange, onNavigateToDate]);

  if (comments.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        Перейти к дате
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 p-3">
          {/* Date picker */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Выберите дату
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              min={dateRange ? formatDateForInput(dateRange.min) : undefined}
              max={formatDateForInput(new Date())}
              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>

          {/* Quick links */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
              Быстрый переход
            </label>
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => handleQuickLink(7)}
                className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Неделю назад
              </button>
              <button
                onClick={() => handleQuickLink(30)}
                className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Месяц назад
              </button>
              <button
                onClick={handleGoToStart}
                className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                В начало
              </button>
              <button
                onClick={handleGoToEnd}
                className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                В конец
              </button>
            </div>
          </div>

          {/* Date range info */}
          {dateRange && (
            <div className="text-xs text-gray-400 dark:text-gray-500">
              Комментарии с {dateRange.min.toLocaleDateString('ru-RU')} по {dateRange.max.toLocaleDateString('ru-RU')}
            </div>
          )}
        </div>
      )}

      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
