'use client';

import { useState } from 'react';
import type { ParticipantName } from '@/types';
import type { CreateSubtaskInput } from '@/lib/api';

const PARTICIPANTS: ParticipantName[] = ['Никита', 'Саня', 'Ксюша'];

interface QuickSubtaskFormProps {
  onSubmit: (input: CreateSubtaskInput) => Promise<void>;
  onCancel: () => void;
}

export function QuickSubtaskForm({ onSubmit, onCancel }: QuickSubtaskFormProps) {
  const [title, setTitle] = useState('');
  const [assignedTo, setAssignedTo] = useState<ParticipantName | ''>('');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [tags, setTags] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        assignedTo: assignedTo || null,
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null,
      });
    } finally {
      setSubmitting(false);
    }
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
      className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 space-y-3"
    >
      {/* Title input */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Название подзадачи..."
        className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-800"
        autoFocus
        disabled={submitting}
      />

      {/* Assignee select */}
      <select
        value={assignedTo}
        onChange={(e) => setAssignedTo(e.target.value as ParticipantName | '')}
        className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-800"
        disabled={submitting}
      >
        <option value="">Исполнитель...</option>
        {PARTICIPANTS.map((name) => (
          <option key={name} value={name}>{name}</option>
        ))}
      </select>

      {/* Time estimate */}
      <input
        type="number"
        value={estimatedHours}
        onChange={(e) => setEstimatedHours(e.target.value)}
        placeholder="Время (часы)..."
        min="0"
        step="0.5"
        className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-800"
        disabled={submitting}
      />

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!title.trim() || submitting}
          className="flex-1 px-3 py-1.5 text-sm bg-primary-500 text-white rounded hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Создание...' : 'Создать'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          Отмена
        </button>
      </div>
    </form>
  );
}
