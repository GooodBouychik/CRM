import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchCalendarSubtasks, type CalendarSubtask } from '@/lib/api';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const CalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();

  const { data: subtasks = [], isLoading } = useQuery({
    queryKey: ['calendar', month, year],
    queryFn: () => fetchCalendarSubtasks(month, year),
    staleTime: 60000,
  });

  const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
  const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  const getDaysInMonth = (date: Date) => {
    const y = date.getFullYear();
    const m = date.getMonth();
    const firstDay = new Date(y, m, 1);
    const lastDay = new Date(y, m + 1, 0);
    const daysInMonth = lastDay.getDate();
    let startDay = firstDay.getDay() - 1;
    if (startDay < 0) startDay = 6;
    return { daysInMonth, startDay };
  };

  const { daysInMonth, startDay } = getDaysInMonth(currentDate);

  const getSubtasksForDay = (day: number) => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return subtasks.filter(s => s.dueDate.startsWith(dateStr));
  };

  const prevMonth = () => setCurrentDate(new Date(year, month - 2, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month, 1));
  const today = () => setCurrentDate(new Date());

  const isToday = (day: number) => {
    const now = new Date();
    return day === now.getDate() && month === now.getMonth() + 1 && year === now.getFullYear();
  };

  const statusColors: Record<string, string> = {
    planning: 'bg-blue-500',
    development: 'bg-cyan-500',
    review: 'bg-purple-500',
    completed: 'bg-green-500',
    archived: 'bg-gray-500',
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Главная / Календарь</p>
          <h1 className="text-2xl lg:text-3xl font-bold">Календарь</h1>
          <p className="text-muted-foreground text-sm mt-1">Дедлайны подзадач</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={prevMonth}><ChevronLeft className="w-4 h-4" /></Button>
          <Button variant="outline" size="sm" onClick={today}>Сегодня</Button>
          <Button variant="outline" size="sm" onClick={nextMonth}><ChevronRight className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* Month/Year */}
      <div className="text-center">
        <h2 className="text-xl font-semibold">{monthNames[month - 1]} {year}</h2>
      </div>

      {/* Calendar Grid */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-border">
          {dayNames.map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">{day}</div>
          ))}
        </div>

        {/* Days */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <div className="grid grid-cols-7">
            {/* Empty cells for start */}
            {Array.from({ length: startDay }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[100px] p-2 border-b border-r border-border bg-muted/30" />
            ))}
            {/* Days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const daySubtasks = getSubtasksForDay(day);
              return (
                <div key={day} className={cn("min-h-[100px] p-2 border-b border-r border-border transition-colors hover:bg-accent/50", isToday(day) && "bg-primary/10")}>
                  <div className={cn("text-sm font-medium mb-1", isToday(day) ? "text-primary" : "text-foreground")}>{day}</div>
                  <div className="space-y-1">
                    {daySubtasks.slice(0, 3).map(subtask => (
                      <div key={subtask.id} className={cn("text-xs p-1 rounded truncate text-white", statusColors[subtask.status] || 'bg-gray-500')} title={subtask.title}>
                        {subtask.title}
                      </div>
                    ))}
                    {daySubtasks.length > 3 && (
                      <div className="text-xs text-muted-foreground">+{daySubtasks.length - 3} ещё</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        {Object.entries(statusColors).map(([status, color]) => (
          <div key={status} className="flex items-center gap-2">
            <div className={cn("w-3 h-3 rounded", color)} />
            <span className="text-muted-foreground capitalize">{status === 'planning' ? 'Планирование' : status === 'development' ? 'Разработка' : status === 'review' ? 'Проверка' : status === 'completed' ? 'Завершено' : 'Архив'}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarPage;
