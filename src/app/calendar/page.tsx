'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, format } from 'date-fns';
import { AppLayout } from '@/components/layout';
import { CalendarGrid, CalendarSubtaskCard } from '@/components/calendar';
import { CreateSubtaskModal } from '@/components/calendar/CreateSubtaskModal';
import { useToast } from '@/components/ui/Toast';
import {
  fetchCalendarSubtasks,
  fetchCalendarWorkload,
  moveCalendarSubtask,
  type CalendarSubtask,
  type DayWorkload,
} from '@/lib/api';

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [subtasks, setSubtasks] = useState<CalendarSubtask[]>([]);
  const [workload, setWorkload] = useState<DayWorkload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSubtask, setActiveSubtask] = useState<CalendarSubtask | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const toast = useToast();

  // Calculate date range for the current month view
  const dateRange = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    return {
      from: format(calendarStart, 'yyyy-MM-dd'),
      to: format(calendarEnd, 'yyyy-MM-dd'),
    };
  }, [currentDate]);

  // Load calendar data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [subtasksData, workloadData] = await Promise.all([
        fetchCalendarSubtasks(dateRange.from, dateRange.to),
        fetchCalendarWorkload(dateRange.from, dateRange.to),
      ]);
      setSubtasks(subtasksData);
      setWorkload(workloadData);
    } catch (err) {
      setError('Не удалось загрузить календарь');
      console.error('Failed to fetch calendar data:', err);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  // Load data on mount and when date range changes
  useEffect(() => {
    loadData();
  }, [loadData]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const subtask = subtasks.find((s) => s.id === active.id);
    if (subtask) {
      setActiveSubtask(subtask);
    }
  };

  // Handle drag end - move subtask to new date
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveSubtask(null);

    if (!over) return;

    const subtaskId = active.id as string;
    const overId = over.id as string;

    // Check if dropped on a day
    if (!overId.startsWith('day-')) return;

    const newDate = overId.replace('day-', '');
    const subtask = subtasks.find((s) => s.id === subtaskId);

    if (!subtask) return;

    // Check if date actually changed
    const oldDate = subtask.dueDate.split('T')[0];
    if (oldDate === newDate) return;

    // Optimistic update
    setSubtasks((prev) =>
      prev.map((s) =>
        s.id === subtaskId ? { ...s, dueDate: newDate } : s
      )
    );

    try {
      await moveCalendarSubtask(subtaskId, newDate);
      toast.success('Дедлайн обновлён');
      // Reload workload data
      const workloadData = await fetchCalendarWorkload(dateRange.from, dateRange.to);
      setWorkload(workloadData);
    } catch (err) {
      // Rollback on error
      setSubtasks((prev) =>
        prev.map((s) =>
          s.id === subtaskId ? { ...s, dueDate: oldDate } : s
        )
      );
      toast.error('Не удалось переместить подзадачу');
      console.error('Failed to move subtask:', err);
    }
  };

  // Handle month change
  const handleMonthChange = (date: Date) => {
    setCurrentDate(date);
  };

  // Handle subtask click - navigate to order
  const handleSubtaskClick = (subtask: CalendarSubtask) => {
    window.location.href = `/orders/${subtask.orderId}`;
  };

  // Handle quick create - open modal
  const handleQuickCreate = (date: Date) => {
    setSelectedDate(date);
    setShowCreateModal(true);
  };

  // Handle subtask creation success
  const handleCreateSuccess = () => {
    toast.success('Подзадача создана');
    loadData(); // Reload calendar data
  };

  return (
    <AppLayout
      title="Календарь"
      subtitle="Планирование подзадач по дням"
      actions={
        <button
          onClick={() => {
            setSelectedDate(new Date());
            setShowCreateModal(true);
          }}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <span>+</span>
          <span className="hidden sm:inline">Добавить подзадачу</span>
        </button>
      }
    >
      <div className="p-3 md:p-6 h-full flex flex-col overflow-auto">
        {/* Error state */}
        {error && (
          <div className="text-center py-12">
            <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>
            <button
              onClick={loadData}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              Попробовать снова
            </button>
          </div>
        )}

        {/* Loading state */}
        {loading && !error && (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        )}

        {/* Calendar */}
        {!loading && !error && (
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <CalendarGrid
              currentDate={currentDate}
              subtasks={subtasks}
              workload={workload}
              onMonthChange={handleMonthChange}
              onSubtaskClick={handleSubtaskClick}
              onQuickCreate={handleQuickCreate}
            />

            {/* Drag overlay */}
            <DragOverlay>
              {activeSubtask ? (
                <CalendarSubtaskCard subtask={activeSubtask} isDragging />
              ) : null}
            </DragOverlay>
          </DndContext>
        )}



        {/* Create subtask modal */}
        <CreateSubtaskModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          selectedDate={selectedDate}
          onSuccess={handleCreateSuccess}
          onError={(msg) => toast.error(msg)}
        />
      </div>
    </AppLayout>
  );
}
