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
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-accent rounded-lg transition-colors border border-border"
            title="Предыдущий месяц"
          >
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <h2 className="text-xl font-semibold text-foreground min-w-[200px] text-center capitalize">
            {format(currentDate, 'LLLL yyyy', { locale: ru })}
          </h2>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-accent rounded-lg transition-colors border border-border"
            title="Следующий месяц"
          >
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <button
          onClick={handleToday}
          className="px-4 py-2 text-sm bg-card hover:bg-accent text-foreground rounded-lg transition-colors border border-border"
        >
          Сегодня
        </button>
      </div>

      {/* Calendar container */}
      <div className="bg-card rounded-xl border border-border overflow-hidden flex-1">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-border bg-muted/30">
          {WEEKDAYS.map((day, index) => (
            <div
              key={day}
              className={`text-center text-sm font-medium py-3 ${
                index >= 5 ? 'text-muted-foreground/70' : 'text-muted-foreground'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 flex-1">
          {calendarDays.map((day, index) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const daySubtasks = subtasksByDate.get(dateKey) || [];
            const dayWorkload = workloadByDate.get(dateKey);
            const isWeekend = day.getDay() === 0 || day.getDay() === 6;

            return (
              <CalendarDay
                key={dateKey}
                date={day}
                subtasks={daySubtasks}
                workload={dayWorkload}
                isCurrentMonth={isSameMonth(day, currentDate)}
                isToday={isSameDay(day, today)}
                isWeekend={isWeekend}
                onSubtaskClick={onSubtaskClick}
                onQuickCreate={onQuickCreate}
              />
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-500" />
          <span className="text-muted-foreground">Планирование</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-cyan-500" />
          <span className="text-muted-foreground">Разработка</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-purple-500" />
          <span className="text-muted-foreground">Проверка</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-500" />
          <span className="text-muted-foreground">Завершено</span>
        </div>
      </div>
    </div>
  );
}
