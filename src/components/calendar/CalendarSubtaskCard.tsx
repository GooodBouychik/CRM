'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Clock } from 'lucide-react';
import type { ParticipantName, SubtaskStatus } from '@/types';
import type { CalendarSubtask } from '@/lib/api';

// Status colors for background
const statusColors: Record<SubtaskStatus, string> = {
  planning: 'bg-blue-500',
  development: 'bg-cyan-500',
  review: 'bg-purple-500',
  completed: 'bg-green-500',
  archived: 'bg-gray-500',
};

interface CalendarSubtaskCardProps {
  subtask: CalendarSubtask;
  isDragging?: boolean;
  onClick?: () => void;
}

export function CalendarSubtaskCard({ subtask, isDragging, onClick }: CalendarSubtaskCardProps) {
  return (
    <div
      className={`
        ${statusColors[subtask.status]} 
        rounded px-2 py-1 cursor-pointer
        transition-all duration-200
        ${isDragging ? 'opacity-80 shadow-xl scale-105 rotate-1' : 'hover:opacity-90'}
      `}
      onClick={onClick}
      title={`${subtask.title} - ${subtask.orderTitle}`}
    >
      <p className="text-xs font-medium text-white truncate">
        {subtask.title}
      </p>
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
