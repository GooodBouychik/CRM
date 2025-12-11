'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { DashboardTask, ParticipantName } from '@/types';

// Avatar colors for participants
const avatarColors: Record<ParticipantName, string> = {
  'Никита': 'bg-blue-500',
  'Саня': 'bg-green-500',
  'Ксюша': 'bg-purple-500',
};

export interface TaskCardProps {
  task: DashboardTask;
  isDragging?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onClick?: () => void;
}

export function TaskCard({ task, isDragging, onEdit, onDelete, onClick }: TaskCardProps) {
  const formatDate = (date: Date | null) => {
    if (!date) return null;
    const d = new Date(date);
    const now = new Date();
    const isOverdue = d < now && task.status !== 'done';
    
    return {
      text: d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
      isOverdue,
    };
  };

  const dueInfo = formatDate(task.dueDate);

  return (
    <div
      className={`group bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 cursor-pointer transition-all duration-200 ease-out ${
        isDragging 
          ? 'opacity-50 shadow-xl rotate-2 scale-105 ring-2 ring-primary-400' 
          : 'hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600 hover:-translate-y-0.5 active:scale-[0.98]'
      }`}
      onClick={onClick}
    >
      {/* Drag handle indicator */}
      <div className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-50 transition-opacity">
        <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
        </svg>
      </div>

      {/* Title */}
      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 line-clamp-2 pr-6">
        {task.title}
      </h4>

      {/* Hover actions */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {onEdit && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            title="Редактировать"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        )}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-500 hover:text-red-600 dark:hover:text-red-400"
            title="Удалить"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      {/* Footer with assignee and due date */}
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2">
          {/* Assignee avatar */}
          {task.assignedTo && (
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium ${
                avatarColors[task.assignedTo] || 'bg-gray-500'
              }`}
              title={task.assignedTo}
            >
              {task.assignedTo.charAt(0)}
            </div>
          )}
        </div>

        {/* Due date */}
        {dueInfo && (
          <span 
            className={`text-xs flex items-center gap-1 ${
              dueInfo.isOverdue 
                ? 'text-red-500 dark:text-red-400' 
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {dueInfo.text}
          </span>
        )}
      </div>
    </div>
  );
}

// Sortable wrapper for TaskCard with drag-and-drop
export interface SortableTaskCardProps {
  task: DashboardTask;
  onEdit?: () => void;
  onDelete?: () => void;
  onClick?: () => void;
}

export function SortableTaskCard({ task, onEdit, onDelete, onClick }: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="relative"
    >
      <TaskCard
        task={task}
        isDragging={isDragging}
        onEdit={onEdit}
        onDelete={onDelete}
        onClick={onClick}
      />
    </div>
  );
}

export default TaskCard;
