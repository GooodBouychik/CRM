'use client';

import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableTaskCard } from './TaskCard';
import { QuickTaskForm } from './QuickTaskForm';
import type { DashboardTask, TaskStatus } from '@/types';

// Column configuration
export const TASK_COLUMNS: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'todo', title: 'К выполнению', color: 'bg-gray-500' },
  { id: 'in_progress', title: 'В работе', color: 'bg-blue-500' },
  { id: 'done', title: 'Готово', color: 'bg-green-500' },
];

export interface TaskColumnProps {
  status: TaskStatus;
  title: string;
  color: string;
  tasks: DashboardTask[];
  onAddTask: (title: string, description?: string) => void;
  onTaskClick?: (task: DashboardTask) => void;
  onTaskEdit?: (task: DashboardTask) => void;
  onTaskDelete?: (taskId: string) => void;
}

export function TaskColumn({
  status,
  title,
  color,
  tasks,
  onAddTask,
  onTaskClick,
  onTaskEdit,
  onTaskDelete,
}: TaskColumnProps) {
  const [isAddingTask, setIsAddingTask] = useState(false);

  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  const handleAddTask = (taskTitle: string, description?: string) => {
    onAddTask(taskTitle, description);
    setIsAddingTask(false);
  };

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col min-w-[280px] max-w-[320px] bg-gray-100 dark:bg-gray-800/50 rounded-xl transition-colors duration-200 ${
        isOver ? 'bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-300 dark:ring-primary-600' : ''
      }`}
    >
      {/* Column header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${color}`} />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h3>
          <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </div>
        
        {/* Add task button */}
        <button
          onClick={() => setIsAddingTask(true)}
          className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          title="Добавить задачу"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Tasks list */}
      <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-280px)]">
        {/* Quick add form */}
        {isAddingTask && (
          <QuickTaskForm
            onSubmit={handleAddTask}
            onCancel={() => setIsAddingTask(false)}
          />
        )}

        {/* Sortable tasks */}
        <SortableContext
          items={tasks.map(t => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick?.(task)}
              onEdit={() => onTaskEdit?.(task)}
              onDelete={() => onTaskDelete?.(task.id)}
            />
          ))}
        </SortableContext>

        {/* Empty state */}
        {tasks.length === 0 && !isAddingTask && (
          <div className="text-center py-8 text-gray-400 dark:text-gray-500">
            <p className="text-sm">Нет задач</p>
            <button
              onClick={() => setIsAddingTask(true)}
              className="mt-2 text-sm text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
            >
              + Добавить задачу
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default TaskColumn;
