'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Subtask, ParticipantName } from '@/types';

// Avatar colors for participants
const avatarColors: Record<ParticipantName, string> = {
  'Никита': 'bg-blue-500',
  'Саня': 'bg-green-500',
  'Ксюша': 'bg-purple-500',
};

interface SubtaskCardProps {
  subtask: Subtask;
  isDragging?: boolean;
  onClick?: () => void;
  onTogglePin?: () => void;
}

export function SubtaskCard({ subtask, isDragging, onClick, onTogglePin }: SubtaskCardProps) {
  return (
    <div
      className={`bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 cursor-pointer hover:shadow-md transition-shadow ${
        isDragging ? 'opacity-50 shadow-lg rotate-2' : ''
      }`}
      onClick={onClick}
    >
      {/* Header with number and pin */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Sub#{String(subtask.subtaskNumber).padStart(3, '0')}
        </span>
        {subtask.isPinned && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin?.();
            }}
            className="text-yellow-500 hover:text-yellow-600"
            title="Открепить"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" />
            </svg>
          </button>
        )}
        {!subtask.isPinned && onTogglePin && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin?.();
            }}
            className="text-gray-300 hover:text-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Закрепить"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
        )}
      </div>

      {/* Title */}
      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
        {subtask.title}
      </h4>

      {/* Tags - placeholder for future implementation */}
      {/* Tags will be added when the Subtask model includes tags field */}

      {/* Footer with assignee, time, comment count */}
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2">
          {/* Assignee avatar */}
          {subtask.assignedTo && (
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium ${
                avatarColors[subtask.assignedTo as ParticipantName] || 'bg-gray-500'
              }`}
              title={subtask.assignedTo}
            >
              {subtask.assignedTo.charAt(0)}
            </div>
          )}

          {/* Time estimate */}
          {subtask.estimatedHours && (
            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {subtask.estimatedHours}ч
            </span>
          )}
        </div>

        {/* Comment count placeholder - will be implemented in Phase 5 */}
        <span className="text-xs text-gray-400 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          0
        </span>
      </div>
    </div>
  );
}

// Sortable wrapper for SubtaskCard
interface SortableSubtaskCardProps {
  subtask: Subtask;
  onClick?: () => void;
  onTogglePin?: () => void;
}

export function SortableSubtaskCard({ subtask, onClick, onTogglePin }: SortableSubtaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: subtask.id });

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
      className="group"
    >
      <SubtaskCard
        subtask={subtask}
        isDragging={isDragging}
        onClick={onClick}
        onTogglePin={onTogglePin}
      />
    </div>
  );
}
