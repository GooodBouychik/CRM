'use client';

import { useState, useCallback } from 'react';
import type { ParticipantName } from '@/types';

export interface CommentFilterState {
  author: ParticipantName | null;
  systemOnly: boolean;
}

export interface CommentFiltersProps {
  filters: CommentFilterState;
  onFiltersChange: (filters: CommentFilterState) => void;
}

const PARTICIPANTS: ParticipantName[] = ['Никита', 'Саня', 'Ксюша'];

const AVATAR_COLORS: Record<ParticipantName, string> = {
  'Никита': 'bg-blue-500',
  'Саня': 'bg-green-500',
  'Ксюша': 'bg-purple-500',
};

export function CommentFilters({ filters, onFiltersChange }: CommentFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleAuthorChange = useCallback((author: ParticipantName | null) => {
    onFiltersChange({ ...filters, author });
  }, [filters, onFiltersChange]);

  const handleSystemOnlyChange = useCallback((systemOnly: boolean) => {
    onFiltersChange({ ...filters, systemOnly });
  }, [filters, onFiltersChange]);

  const clearFilters = useCallback(() => {
    onFiltersChange({ author: null, systemOnly: false });
  }, [onFiltersChange]);

  const hasActiveFilters = filters.author !== null || filters.systemOnly;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1 px-2 py-1 text-sm rounded border transition-colors ${
          hasActiveFilters
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
            : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        Фильтры
        {hasActiveFilters && (
          <span className="w-2 h-2 rounded-full bg-primary-500"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 p-3">
          {/* Author filter */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
              По автору
            </label>
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => handleAuthorChange(null)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  filters.author === null
                    ? 'bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Все
              </button>
              {PARTICIPANTS.map(participant => (
                <button
                  key={participant}
                  onClick={() => handleAuthorChange(participant)}
                  className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                    filters.author === participant
                      ? 'bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className={`w-3 h-3 rounded-full ${AVATAR_COLORS[participant]}`}></span>
                  {participant}
                </button>
              ))}
            </div>
          </div>

          {/* System comments filter */}
          <div className="mb-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.systemOnly}
                onChange={(e) => handleSystemOnlyChange(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-primary-500 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Только системные
              </span>
            </label>
          </div>

          {/* Clear filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="w-full text-center text-xs text-primary-500 hover:text-primary-600 py-1"
            >
              Сбросить фильтры
            </button>
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

/**
 * Filters comments based on filter state
 */
export function filterComments(
  comments: Comment[],
  filters: CommentFilterState
): Comment[] {
  return comments.filter(comment => {
    // Filter by author
    if (filters.author !== null && comment.author !== filters.author) {
      return false;
    }
    // Filter system comments only
    if (filters.systemOnly && !comment.isSystem) {
      return false;
    }
    return true;
  });
}

// Import Comment type for the filter function
import type { Comment } from '@/types';
