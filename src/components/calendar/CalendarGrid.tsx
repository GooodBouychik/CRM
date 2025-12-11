'use client';

import { useMemo } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  format,
  addMonths,
  subMonths,
} from 'date-fns';
import { ru } from 'date-fns/locale';
import { CalendarDay } from './CalendarDay';
import type { CalendarSubtask, DayWorkload } from '@/lib/api';

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

interface CalendarGridProps {
  currentDate: Date;
  subtasks: CalendarSubtask[];
  workload: DayWorkload[];
  onMonthChange: (date: Date) => void;
  onSubtaskClick?: (subtask: CalendarSubtask) => void;
  onQuickCreate?: (date: Date) => void;
}

export function CalendarGrid({
  currentDate,
  subtasks,
  workload,
  onMonthChange,
  onSubtaskClick,
  onQuickCreate,
}: CalendarGridProps) {
  const today = new Date();

  // Calculate calendar days for the current month view
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentDate]);

  // Group subtasks by date
  const subtasksByDate = useMemo(() => {
    const map = new Map<string, CalendarSubtask[]>();
    subtasks.forEach((subtask) => {
      const dateKey = subtask.dueDate.split('T')[0];
      const existing = map.get(dateKey) || [];
      map.set(dateKey, [...existing, subtask]);
    });
    return map;
  }, [subtasks]);

  // Create workload map by date
  const workloadByDate = useMemo(() => {
    const map = new Map<string, DayWorkload>();
    workload.forEach((w) => {
      map.set(w.date, w);
    });
    return map;
  }, [workload]);

  // Navigation handlers
  const handlePrevMonth = () => {
    onMonthChange(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    onMonthChange(addMonths(currentDate, 1));
  };

  const handleToday = () => {
    onMonthChange(new Date());
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with navigation */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-surface-100 rounded-lg transition-colors"
            title="Предыдущий месяц"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-xl font-semibold text-gray-100 min-w-[180px] text-center capitalize">
            {format(currentDate, 'LLLL yyyy', { locale: ru })}
          </h2>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-surface-100 rounded-lg transition-colors"
            title="Следующий месяц"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <button
          onClick={handleToday}
          className="px-3 py-1.5 text-sm bg-surface-100 hover:bg-surface-200 text-gray-300 rounded-lg transition-colors"
        >
          Сегодня
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-px mb-1">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-gray-500 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px flex-1 bg-surface-200 rounded-lg overflow-hidden">
        {calendarDays.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const daySubtasks = subtasksByDate.get(dateKey) || [];
          const dayWorkload = workloadByDate.get(dateKey);

          return (
            <CalendarDay
              key={dateKey}
              date={day}
              subtasks={daySubtasks}
              workload={dayWorkload}
              isCurrentMonth={isSameMonth(day, currentDate)}
              isToday={isSameDay(day, today)}
              onSubtaskClick={onSubtaskClick}
              onQuickCreate={onQuickCreate}
            />
          );
        })}
      </div>
    </div>
  );
}
