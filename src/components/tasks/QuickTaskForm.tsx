'use client';

import { useState, useRef, useEffect } from 'react';

export interface QuickTaskFormProps {
  onSubmit: (title: string, description?: string) => void;
  onCancel: () => void;
}

export function QuickTaskForm({ onSubmit, onCancel }: QuickTaskFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [showDescription, setShowDescription] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    
    onSubmit(trimmedTitle, description.trim() || undefined);
    setTitle('');
    setDescription('');
    setShowDescription(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <form 
      onSubmit={handleSubmit}
      onKeyDown={handleKeyDown}
      className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-primary-300 dark:border-primary-600 p-3"
    >
      {/* Title input */}
      <input
        ref={inputRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Введите название задачи..."
        className="w-full text-sm bg-transparent border-none outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
      />

      {/* Description textarea (optional) */}
      {showDescription && (
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Добавьте описание..."
          rows={2}
          className="w-full mt-2 text-sm bg-transparent border-none outline-none text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 resize-none"
        />
      )}

      {/* Actions */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100 dark:border-gray-800">
        <button
          type="button"
          onClick={() => setShowDescription(!showDescription)}
          className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
          </svg>
          {showDescription ? 'Скрыть описание' : 'Добавить описание'}
        </button>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={!title.trim()}
            className="px-3 py-1.5 text-sm bg-primary-500 text-white rounded-md hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Добавить
          </button>
        </div>
      </div>
    </form>
  );
}

export default QuickTaskForm;
