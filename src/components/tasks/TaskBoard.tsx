'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { TaskColumn, TASK_COLUMNS } from './TaskColumn';
import { TaskCard } from './TaskCard';
import type { DashboardTask, TaskStatus, ParticipantName } from '@/types';

export interface TaskBoardProps {
  tasks: DashboardTask[];
  currentUser: ParticipantName;
  onCreateTask: (status: TaskStatus, title: string, description?: string) => Promise<void>;
  onMoveTask: (taskId: string, newStatus: TaskStatus, newPosition: number) => Promise<void>;
  onEditTask: (task: DashboardTask) => void;
  onDeleteTask: (taskId: string) => Promise<void>;
  onTaskClick?: (task: DashboardTask) => void;
}

export function TaskBoard({
  tasks,
  currentUser,
  onCreateTask,
  onMoveTask,
  onEditTask,
  onDeleteTask,
  onTaskClick,
}: TaskBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [localTasks, setLocalTasks] = useState<DashboardTask[]>(tasks);
  const isDraggingRef = useRef(false);

  // Sync local tasks with props when they change (but not during drag)
  // Use JSON comparison to avoid unnecessary updates
  const tasksJson = JSON.stringify(tasks.map(t => ({ id: t.id, status: t.status, position: t.position })));
  useEffect(() => {
    if (!isDraggingRef.current) {
      setLocalTasks(tasks);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasksJson]);

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Get tasks for a specific column, sorted by position
  const getColumnTasks = useCallback((status: TaskStatus): DashboardTask[] => {
    return localTasks
      .filter((t) => t.status === status)
      .sort((a, b) => a.position - b.position);
  }, [localTasks]);

  // Find which column a task is in
  const findTaskColumn = (taskId: string): TaskStatus | null => {
    const task = localTasks.find((t) => t.id === taskId);
    return task?.status ?? null;
  };

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    isDraggingRef.current = true;
    setActiveId(event.active.id as string);
  };

  // Handle drag over (for visual feedback and column changes)
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeColumn = findTaskColumn(activeId);
    // Check if over is a column or a task
    const isOverColumn = TASK_COLUMNS.some(col => col.id === overId);
    const overColumn = isOverColumn ? overId as TaskStatus : findTaskColumn(overId);

    if (!activeColumn || !overColumn || activeColumn === overColumn) return;

    // Move task to new column optimistically
    setLocalTasks((prev) => {
      const activeTask = prev.find((t) => t.id === activeId);
      if (!activeTask) return prev;

      return prev.map((t) =>
        t.id === activeId ? { ...t, status: overColumn } : t
      );
    });
  };

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    isDraggingRef.current = false;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTask = localTasks.find((t) => t.id === activeId);
    if (!activeTask) return;

    // Determine target column
    const isOverColumn = TASK_COLUMNS.some(col => col.id === overId);
    const targetColumn = isOverColumn ? overId as TaskStatus : findTaskColumn(overId);
    if (!targetColumn) return;

    // Calculate new position
    const columnTasks = getColumnTasks(targetColumn);
    const overIndex = columnTasks.findIndex((t) => t.id === overId);
    const newPosition = overIndex >= 0 ? overIndex : columnTasks.length;

    // Persist to server
    try {
      await onMoveTask(activeId, targetColumn, newPosition);
    } catch (err) {
      // Rollback on error - restore from props
      setLocalTasks(tasks);
    }
  };

  // Handle creating a new task
  const handleCreateTask = async (status: TaskStatus, title: string, description?: string) => {
    await onCreateTask(status, title, description);
  };

  // Get active task for drag overlay
  const activeTask = activeId ? localTasks.find((t) => t.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      {/* Board container with horizontal scroll */}
      <div 
        className="flex gap-4 h-full overflow-x-auto pb-4 px-2 snap-x snap-mandatory md:snap-none scroll-smooth"
        style={{ 
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'thin',
        }}
      >
        {TASK_COLUMNS.map((column) => {
          const columnTasks = getColumnTasks(column.id);
          return (
            <div 
              key={column.id} 
              className="snap-center md:snap-align-none flex-shrink-0"
            >
              <TaskColumn
                status={column.id}
                title={column.title}
                color={column.color}
                tasks={columnTasks}
                onAddTask={(title, desc) => handleCreateTask(column.id, title, desc)}
                onTaskClick={onTaskClick}
                onTaskEdit={onEditTask}
                onTaskDelete={onDeleteTask}
              />
            </div>
          );
        })}
      </div>

      {/* Drag overlay for smooth animation */}
      <DragOverlay>
        {activeTask ? (
          <TaskCard
            task={activeTask}
            isDragging
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export default TaskBoard;
