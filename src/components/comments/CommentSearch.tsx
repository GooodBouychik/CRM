'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { Comment, ParticipantName } from '@/types';

export interface CommentSearchProps {
  comments: Comment[];
  onSearchResults: (results: Comment[], searchTerm: string) => void;
  onNavigateToResult: (comment: Comment) => void;
}

export interface SearchResult {
  comment: Comment;
  matchIndices: { start: number; end: number }[];
}

/**
 * Highlights search matches in text by wrapping them in <mark> tags
 */
export function highlightMatches(text: string, searchTerm: string): React.ReactNode {
  if (!searchTerm.trim()) {
    return text;
  }

  const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (part.toLowerCase() === searchTerm.toLowerCase()) {
      return (
        <mark
          key={index}
          className="bg-yellow-200 dark:bg-yellow-800 text-gray-900 dark:text-gray-100 px-0.5 rounded"
        >
          {part}
        </mark>
      );
    }
    return part;
  });
}

/**
 * Escapes special regex characters in a string
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Searches comments for matching text
 */
export function searchComments(comments: Comment[], searchTerm: string): Comment[] {
  if (!searchTerm.trim()) {
    return [];
  }

  const term = searchTerm.toLowerCase();
  return comments.filter(comment => 
    comment.content.toLowerCase().includes(term)
  );
}


export function CommentSearch({
  comments,
  onSearchResults,
  onNavigateToResult,
}: CommentSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Comment[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      const searchResults = searchComments(comments, searchTerm);
      setResults(searchResults);
      setCurrentIndex(0);
      onSearchResults(searchResults, searchTerm);
    }, 200);

    return () => clearTimeout(timer);
  }, [searchTerm, comments, onSearchResults]);

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (e.target.value.trim()) {
      setIsOpen(true);
    }
  }, []);

  const handleClear = useCallback(() => {
    setSearchTerm('');
    setResults([]);
    setCurrentIndex(0);
    onSearchResults([], '');
    inputRef.current?.focus();
  }, [onSearchResults]);

  const navigateToPrevious = useCallback(() => {
    if (results.length === 0) return;
    const newIndex = currentIndex === 0 ? results.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
    onNavigateToResult(results[newIndex]);
  }, [results, currentIndex, onNavigateToResult]);

  const navigateToNext = useCallback(() => {
    if (results.length === 0) return;
    const newIndex = currentIndex === results.length - 1 ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
    onNavigateToResult(results[newIndex]);
  }, [results, currentIndex, onNavigateToResult]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        navigateToPrevious();
      } else {
        navigateToNext();
      }
    } else if (e.key === 'Escape') {
      handleClear();
      setIsOpen(false);
    }
  }, [navigateToNext, navigateToPrevious, handleClear]);

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        {/* Search icon */}
        <svg
          className="w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>

        {/* Search input */}
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleSearch}
          onKeyDown={handleKeyDown}
          placeholder="Поиск в комментариях..."
          className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        />

        {/* Results count and navigation */}
        {searchTerm && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
              {results.length > 0
                ? `${currentIndex + 1} / ${results.length}`
                : 'Не найдено'}
            </span>

            {results.length > 0 && (
              <>
                <button
                  onClick={navigateToPrevious}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  title="Предыдущий (Shift+Enter)"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  onClick={navigateToNext}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  title="Следующий (Enter)"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </>
            )}

            {/* Clear button */}
            <button
              onClick={handleClear}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              title="Очистить (Esc)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
