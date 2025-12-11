'use client';

import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableSubtaskCard } from './SubtaskCard';
import { QuickSubtaskForm } from './QuickSubtaskForm';
import type { Subtask, SubtaskStatus } from '@/types';
import type { CreateSubtaskInput } from '@/lib/api';

interface KanbanColumnProps {
  id: SubtaskStatus;
  title: string;
  subtasks: Subtask[];
  onSubtaskClick?: (subtask: Subtask) => void;
  onCreateSubtask: (input: CreateSubtaskInput) => Promise<void>;
  onTogglePin: (subtaskId: string) => void;
}

export function KanbanColumn({
  id,
  title,
  subtasks,
  onSubtaskClick,
  onCreateSubtask,
  onTogglePin,
}: KanbanColumnProps) {
  const [showForm, setShowForm] = useState(false);

  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  const handleCreateSubtask = async (input: CreateSubtaskInput) => {
    await onCreateSubtask(input);
    setShowForm(false);
  };

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col w-full md:w-72 md:min-w-[288px] h-full bg-gray-100 dark:bg-gray-800 rounded-lg transition-colors ${
        isOver ? 'bg-gray-200 dark:bg-gray-700' : ''
      }`}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-gray-900 dark:text-gray-100">{title}</h3>
          <span className="px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
            {subtasks.length}
          </span>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          title="Добавить подзадачу"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Subtasks list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        <SortableContext items={subtasks.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          {subtasks.map((subtask) => (
            <SortableSubtaskCard
              key={subtask.id}
              subtask={subtask}
              onClick={() => onSubtaskClick?.(subtask)}
              onTogglePin={() => onTogglePin(subtask.id)}
            />
          ))}
        </SortableContext>

        {/* Quick create form */}
        {showForm && (
          <QuickSubtaskForm
            onSubmit={handleCreateSubtask}
            onCancel={() => setShowForm(false)}
          />
        )}

        {/* Empty state */}
        {subtasks.length === 0 && !showForm && (
          <div className="text-center py-8 text-gray-400 dark:text-gray-500 animate-fade-in">
            <span className="text-2xl mb-2 block opacity-50">📝</span>
            <p className="text-sm mb-2">Нет подзадач</p>
            <button
              onClick={() => setShowForm(true)}
              className="text-xs text-primary-500 hover:text-primary-400 transition-colors"
            >
              + Добавить подзадачу
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
