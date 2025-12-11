'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { ParticipantName, SubtaskStatus } from '@/types';
import type { CalendarSubtask } from '@/lib/api';

// Avatar colors for participants
const avatarColors: Record<ParticipantName, string> = {
  'Никита': 'bg-blue-500',
  'Саня': 'bg-green-500',
  'Ксюша': 'bg-purple-500',
};

// Status colors
const statusColors: Record<SubtaskStatus, string> = {
  planning: 'border-l-amber-400',
  development: 'border-l-blue-400',
  review: 'border-l-violet-400',
  completed: 'border-l-emerald-400',
  archived: 'border-l-gray-400',
};

interface CalendarSubtaskCardProps {
  subtask: CalendarSubtask;
  isDragging?: boolean;
  onClick?: () => void;
}

export function CalendarSubtaskCard({ subtask, isDragging, onClick }: CalendarSubtaskCardProps) {
  return (
    <div
      className={`bg-surface-50 border border-surface-200 border-l-4 ${statusColors[subtask.status]} rounded-lg p-2 cursor-pointer hover:bg-surface-100 transition-all duration-200 ${
        isDragging ? 'opacity-70 shadow-xl scale-105 rotate-1' : 'hover:scale-[1.02]'
      }`}
      onClick={onClick}
    >
      {/* Title */}
      <h4 className="text-xs font-medium text-gray-100 line-clamp-1 mb-1">
        {subtask.title}
      </h4>

      {/* Order reference */}
      <div className="text-[10px] text-gray-500 mb-1">
        #{subtask.orderNumber} {subtask.orderTitle.length > 20 ? subtask.orderTitle.slice(0, 20) + '...' : subtask.orderTitle}
      </div>

      {/* Footer with assignee and time */}
      <div className="flex items-center justify-between">
        {/* Assignee avatar */}
        {subtask.assignedTo ? (
          <div
            className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-medium ${
              avatarColors[subtask.assignedTo] || 'bg-gray-500'
            }`}
            title={subtask.assignedTo}
          >
            {subtask.assignedTo.charAt(0)}
          </div>
        ) : (
          <div className="w-5 h-5" />
        )}

        {/* Time estimate */}
        {subtask.estimatedHours && (
          <span className="text-[10px] text-gray-500 flex items-center gap-0.5">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {subtask.estimatedHours}ч
          </span>
        )}
      </div>
    </div>
  );
}

// Draggable wrapper for CalendarSubtaskCard
interface DraggableCalendarSubtaskCardProps {
  subtask: CalendarSubtask;
  onClick?: () => void;
}

export function DraggableCalendarSubtaskCard({ subtask, onClick }: DraggableCalendarSubtaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: subtask.id,
    data: {
      type: 'subtask',
      subtask,
    },
  });

  const style = transform ? {
    transform: CSS.Translate.toString(transform),
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="touch-none"
    >
      <CalendarSubtaskCard
        subtask={subtask}
        isDragging={isDragging}
        onClick={onClick}
      />
    </div>
  );
}
