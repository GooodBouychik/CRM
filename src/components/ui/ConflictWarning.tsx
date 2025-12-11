'use client';

import { useEffect, useState } from 'react';
import type { ParticipantName } from '@/types';
import { PARTICIPANT_COLORS } from '@/stores/presenceStore';

interface ConflictWarningProps {
  fieldName: string;
  otherUser: ParticipantName;
  onDismiss: () => void;
}

// Field name translations
const fieldLabels: Record<string, string> = {
  title: 'название',
  description: 'описание',
  clientName: 'клиент',
  amount: 'сумма',
  dueDate: 'дедлайн',
  status: 'статус',
  priority: 'приоритет',
  assignedTo: 'исполнители',
  tags: 'теги',
};

export function ConflictWarning({ fieldName, otherUser, onDismiss }: ConflictWarningProps) {
  const [isVisible, setIsVisible] = useState(true);
  
  useEffect(() => {
    // Auto-dismiss after 5 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onDismiss, 300); // Wait for animation
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const fieldLabel = fieldLabels[fieldName] || fieldName;
  const userColor = PARTICIPANT_COLORS[otherUser];

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg shadow-lg max-w-md">
        <div className="flex-shrink-0">
          <svg
            className="w-5 h-5 text-amber-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            Конфликт редактирования
          </p>
          <p className="text-sm text-amber-700 dark:text-amber-300">
            <span
              className="font-medium"
              style={{ color: userColor }}
            >
              {otherUser}
            </span>
            {' '}сейчас редактирует поле «{fieldLabel}»
          </p>
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onDismiss, 300);
          }}
          className="flex-shrink-0 p-1 hover:bg-amber-200 dark:hover:bg-amber-800 rounded"
        >
          <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// Inline indicator showing who is editing a field
interface FieldEditIndicatorProps {
  editingBy: ParticipantName;
}

export function FieldEditIndicator({ editingBy }: FieldEditIndicatorProps) {
  const userColor = PARTICIPANT_COLORS[editingBy];
  
  return (
    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 animate-pulse">
      <div
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: userColor }}
      />
      <span>{editingBy} редактирует...</span>
    </div>
  );
}
