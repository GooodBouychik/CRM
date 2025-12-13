'use client';

import { useDroppable } from '@dnd-kit/core';
import { DraggableCalendarSubtaskCard } from './CalendarSubtaskCard';
import { Plus } from 'lucide-react';
import type { CalendarSubtask, DayWorkload } from '@/lib/api';

interface CalendarDayProps {
  date: Date;
  subtasks: CalendarSubtask[];
  workload?: DayWorkload;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend?: boolean;
  onSubtaskClick?: (subtask: CalendarSubtask) => void;
  onQuickCreate?: (date: Date) => void;
}

export function CalendarDay({
  date,
  subtasks,
  workload,
  isCurrentMonth,
  isToday,
  isWeekend,
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
      className={`
        min-h-[100px] p-2 border-b border-r border-border transition-all duration-200 group
        ${isCurrentMonth ? 'bg-card' : 'bg-muted/30'}
        ${isWeekend && isCurrentMonth ? 'bg-muted/20' : ''}
        ${isOver ? 'bg-primary/10 border-primary' : ''}
        ${isToday ? 'bg-primary/5' : ''}
        hover:bg-accent/50
      `}
    >
      {/* Day header */}
      <div className="flex items-center justify-between mb-2">
        <span
          className={`
            text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
            ${isToday
              ? 'bg-primary text-primary-foreground'
              : isCurrentMonth
              ? 'text-foreground'
              : 'text-muted-foreground/50'
            }
          `}
        >
          {dayNumber}
        </span>

        {/* Workload indicator */}
        {totalHours > 0 && (
          <span
            className={`
              text-[10px] px-1.5 py-0.5 rounded-full font-medium
              ${isOverloaded
                ? 'bg-destructive/20 text-destructive'
                : 'bg-muted text-muted-foreground'
              }
            `}
            title={isOverloaded ? 'Перегрузка! Более 8 часов' : `${totalHours}ч запланировано`}
          >
            {totalHours}ч
          </span>
        )}
      </div>

      {/* Subtasks list */}
      <div className="space-y-1 max-h-[120px] overflow-y-auto">
        {subtasks.slice(0, 3).map((subtask) => (
          <DraggableCalendarSubtaskCard
            key={subtask.id}
            subtask={subtask}
            onClick={() => onSubtaskClick?.(subtask)}
          />
        ))}
        {subtasks.length > 3 && (
          <div className="text-xs text-muted-foreground pl-1">
            +{subtasks.length - 3} ещё
          </div>
        )}
      </div>

      {/* Quick create button - visible on hover */}
      {subtasks.length === 0 && isCurrentMonth && (
        <button
          onClick={() => onQuickCreate?.(date)}
          className="
            w-full h-12 flex items-center justify-center
            text-muted-foreground hover:text-primary
            opacity-0 group-hover:opacity-100 transition-all duration-200
            rounded-lg hover:bg-accent/50
          "
        >
          <Plus className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
