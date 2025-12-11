'use client';

import { useEffect, useState } from 'react';

export type ViewMode = 'compact' | 'comfortable';

const VIEW_MODE_STORAGE_KEY = 'history-view-mode';

export interface ViewModeToggleProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export function useViewMode(): [ViewMode, (mode: ViewMode) => void] {
  const [viewMode, setViewMode] = useState<ViewMode>('comfortable');

  useEffect(() => {
    const stored = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    if (stored === 'compact' || stored === 'comfortable') {
      setViewMode(stored);
    }
  }, []);

  const handleChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
  };

  return [viewMode, handleChange];
}

export function ViewModeToggle({ value, onChange }: ViewModeToggleProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-surface-100 rounded-lg">
      <button
        onClick={() => onChange('compact')}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200
          ${value === 'compact'
            ? 'bg-surface-50 text-gray-100 shadow-sm'
            : 'text-gray-400 hover:text-gray-200'
          }
        `}
        title="Компактный вид"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
        <span className="hidden sm:inline">Компактный</span>
      </button>
      <button
        onClick={() => onChange('comfortable')}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200
          ${value === 'comfortable'
            ? 'bg-surface-50 text-gray-100 shadow-sm'
            : 'text-gray-400 hover:text-gray-200'
          }
        `}
        title="Карточки"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
        </svg>
        <span className="hidden sm:inline">Карточки</span>
      </button>
    </div>
  );
}

export default ViewModeToggle;
