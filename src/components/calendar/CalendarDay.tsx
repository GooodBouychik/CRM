'use client';

import { useDroppable } from '@dnd-kit/core';
import { DraggableCalendarSubtaskCard } from './CalendarSubtaskCard';
import type { CalendarSubtask, DayWorkload } from '@/lib/api';

interface CalendarDayProps {
  date: Date;
  subtasks: CalendarSubtask[];
  workload?: DayWorkload;
  isCurrentMonth: boolean;
  isToday: boolean;
  onSubtaskClick?: (subtask: CalendarSubtask) => void;
  onQuickCreate?: (date: Date) => void;
}

export function CalendarDay({
  date,
  subtasks,
  workload,
  isCurrentMonth,
  isToday,
  onSubtaskClick,
  onQuickCreate,
}: CalendarDayProps) {
  const dateStr = date.toISOString().split('T')[0];
  
  const { setNodeRef, isOver } = useDroppable({
    id: `day-${dateStr}`,
    data: {
      type: 'day',
      date: dateStr,
    },
  });

  const dayNumber = date.getDate();
  const isOverloaded = workload?.isOverloaded ?? false;
  const totalHours = workload?.totalEstimatedHours ?? 0;

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[120px] border border-surface-200 p-1 transition-all duration-200 ${
        isCurrentMonth ? 'bg-surface-50' : 'bg-surface-100/50'
      } ${isOver ? 'bg-primary-500/10 border-primary-500 scale-[1.02]' : ''} ${
        isToday ? 'ring-2 ring-primary-500 ring-inset' : ''
      }`}
    >
      {/* Day header */}
      <div className="flex items-center justify-between mb-1">
        <span
          className={`text-sm font-medium ${
            isToday
              ? 'bg-primary-500 text-white w-6 h-6 rounded-full flex items-center justify-center'
              : isCurrentMonth
              ? 'text-gray-100'
              : 'text-gray-500'
          }`}
        >
          {dayNumber}
        </span>

        {/* Workload indicator */}
        {totalHours > 0 && (
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              isOverloaded
                ? 'bg-red-500/20 text-red-400'
                : 'bg-surface-200 text-gray-400'
            }`}
            title={isOverloaded ? 'Перегрузка! Более 8 часов' : `${totalHours}ч запланировано`}
          >
            {totalHours}ч
          </span>
        )}
      </div>

      {/* Overload warning */}
      {isOverloaded && (
        <div className="text-[10px] text-red-400 flex items-center gap-1 mb-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          Перегрузка
        </div>
      )}

      {/* Subtasks list */}
      <div className="space-y-1 max-h-[200px] overflow-y-auto">
        {subtasks.map((subtask) => (
          <DraggableCalendarSubtaskCard
            key={subtask.id}
            subtask={subtask}
            onClick={() => onSubtaskClick?.(subtask)}
          />
        ))}
      </div>

      {/* Empty state with quick create */}
      {subtasks.length === 0 && isCurrentMonth && (
        <button
          onClick={() => onQuickCreate?.(date)}
          className="w-full h-16 flex flex-col items-center justify-center text-gray-500 hover:text-primary-400 hover:bg-surface-100 rounded transition-colors group"
        >
          <svg className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
            Добавить
          </span>
        </button>
      )}
    </div>
  );
}
