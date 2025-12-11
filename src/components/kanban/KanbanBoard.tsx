'use client';

import { useState, useEffect, useCallback } from 'react';
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
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { KanbanColumn } from './KanbanColumn';
import { SubtaskCard } from './SubtaskCard';
import { SubtaskPanel } from './SubtaskPanel';
import type { Subtask, SubtaskStatus } from '@/types';
import { fetchSubtasks, moveSubtask as moveSubtaskApi, createSubtask } from '@/lib/api';
import type { CreateSubtaskInput } from '@/lib/api';
import { useWebSocket } from '@/hooks/useWebSocket';

// Column configuration
export const COLUMNS: { id: SubtaskStatus; title: string }[] = [
  { id: 'planning', title: 'Планирование' },
  { id: 'development', title: 'Разработка' },
  { id: 'review', title: 'Проверка' },
  { id: 'completed', title: 'Завершено' },
  { id: 'archived', title: 'Архив' },
];

// Map column ID to status
export const columnToStatus: Record<string, SubtaskStatus> = {
  planning: 'planning',
  development: 'development',
  review: 'review',
  completed: 'completed',
  archived: 'archived',
};

interface KanbanBoardProps {
  orderId: string;
  onSubtaskClick?: (subtask: Subtask) => void;
  onError?: (message: string) => void;
  onSuccess?: (message: string) => void;
}

export function KanbanBoard({ orderId, onSubtaskClick, onError, onSuccess }: KanbanBoardProps) {
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedSubtask, setSelectedSubtask] = useState<Subtask | null>(null);

  // Handle real-time subtask events
  const handleSubtaskCreated = useCallback((subtask: Subtask) => {
    if (subtask.orderId === orderId) {
      setSubtasks((prev) => {
        // Avoid duplicates
        if (prev.some((s) => s.id === subtask.id)) return prev;
        return [...prev, subtask];
      });
    }
  }, [orderId]);

  const handleSubtaskUpdated = useCallback((subtask: Subtask) => {
    if (subtask.orderId === orderId) {
      setSubtasks((prev) =>
        prev.map((s) => (s.id === subtask.id ? subtask : s))
      );
      // Update selected subtask if it's the one being updated
      setSelectedSubtask((prev) =>
        prev?.id === subtask.id ? subtask : prev
      );
    }
  }, [orderId]);

  const handleSubtaskMoved = useCallback((subtask: Subtask) => {
    if (subtask.orderId === orderId) {
      setSubtasks((prev) =>
        prev.map((s) => (s.id === subtask.id ? subtask : s))
      );
    }
  }, [orderId]);

  const handleSubtaskDeleted = useCallback((subtaskId: string) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== subtaskId));
    setSelectedSubtask((prev) => (prev?.id === subtaskId ? null : prev));
  }, []);

  // WebSocket integration for real-time updates
  const { joinOrder, leaveOrder } = useWebSocket({
    userName: 'Никита', // TODO: Get from context/auth
    onSubtaskCreated: handleSubtaskCreated,
    onSubtaskUpdated: handleSubtaskUpdated,
    onSubtaskMoved: handleSubtaskMoved,
    onSubtaskDeleted: handleSubtaskDeleted,
  });

  // Join order room for real-time updates
  useEffect(() => {
    joinOrder(orderId);
    return () => {
      leaveOrder(orderId);
    };
  }, [orderId, joinOrder, leaveOrder]);

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

  // Load subtasks
  useEffect(() => {
    async function loadSubtasks() {
      try {
        setLoading(true);
        const data = await fetchSubtasks(orderId);
        setSubtasks(data);
      } catch (err) {
        onError?.(err instanceof Error ? err.message : 'Failed to load subtasks');
      } finally {
        setLoading(false);
      }
    }
    loadSubtasks();
  }, [orderId, onError]);

  // Get subtasks for a specific column, sorted by pinned first then position
  const getColumnSubtasks = useCallback((status: SubtaskStatus): Subtask[] => {
    return subtasks
      .filter((s) => s.status === status)
      .sort((a, b) => {
        // Pinned subtasks first
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        // Then by position
        return a.position - b.position;
      });
  }, [subtasks]);

  // Find which column a subtask is in
  const findColumn = (subtaskId: string): SubtaskStatus | null => {
    const subtask = subtasks.find((s) => s.id === subtaskId);
    return subtask?.status ?? null;
  };

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  // Handle drag over (for visual feedback)
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeColumn = findColumn(activeId);
    // Check if over is a column or a subtask
    const overColumn = columnToStatus[overId] ?? findColumn(overId);

    if (!activeColumn || !overColumn || activeColumn === overColumn) return;

    // Move subtask to new column optimistically
    setSubtasks((prev) => {
      const activeSubtask = prev.find((s) => s.id === activeId);
      if (!activeSubtask) return prev;

      return prev.map((s) =>
        s.id === activeId ? { ...s, status: overColumn } : s
      );
    });
  };

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeSubtask = subtasks.find((s) => s.id === activeId);
    if (!activeSubtask) return;

    // Determine target column
    const targetColumn = columnToStatus[overId] ?? findColumn(overId);
    if (!targetColumn) return;

    // Calculate new position
    const columnSubtasks = getColumnSubtasks(targetColumn);
    const overIndex = columnSubtasks.findIndex((s) => s.id === overId);
    const newPosition = overIndex >= 0 ? overIndex : columnSubtasks.length;

    // Optimistic update already done in handleDragOver
    // Now persist to server
    try {
      await moveSubtaskApi(activeId, {
        status: targetColumn,
        position: newPosition,
      });
      onSuccess?.('Подзадача перемещена');
    } catch (err) {
      // Rollback on error
      const data = await fetchSubtasks(orderId);
      setSubtasks(data);
      onError?.(err instanceof Error ? err.message : 'Failed to move subtask');
    }
  };

  // Handle creating a new subtask
  const handleCreateSubtask = async (status: SubtaskStatus, input: CreateSubtaskInput) => {
    try {
      const newSubtask = await createSubtask(orderId, { ...input, status });
      setSubtasks((prev) => [...prev, newSubtask]);
      onSuccess?.('Подзадача создана');
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Failed to create subtask');
    }
  };

  // Handle pinning/unpinning a subtask
  const handleTogglePin = async (subtaskId: string) => {
    const subtask = subtasks.find((s) => s.id === subtaskId);
    if (!subtask) return;

    // Optimistic update
    setSubtasks((prev) =>
      prev.map((s) =>
        s.id === subtaskId ? { ...s, isPinned: !s.isPinned } : s
      )
    );

    try {
      const { updateSubtask } = await import('@/lib/api');
      await updateSubtask(subtaskId, { isPinned: !subtask.isPinned });
      onSuccess?.(subtask.isPinned ? 'Открепено' : 'Закреплено');
    } catch (err) {
      // Rollback
      setSubtasks((prev) =>
        prev.map((s) =>
          s.id === subtaskId ? { ...s, isPinned: subtask.isPinned } : s
        )
      );
      onError?.(err instanceof Error ? err.message : 'Failed to toggle pin');
    }
  };

  // Handle subtask click to open panel
  const handleSubtaskClick = (subtask: Subtask) => {
    setSelectedSubtask(subtask);
    onSubtaskClick?.(subtask);
  };

  // Handle subtask update from panel
  const handleSubtaskUpdate = (updated: Subtask) => {
    setSubtasks((prev) =>
      prev.map((s) => (s.id === updated.id ? updated : s))
    );
    setSelectedSubtask(updated);
  };

  // Handle subtask delete from panel
  const handleSubtaskDelete = (subtaskId: string) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== subtaskId));
    setSelectedSubtask(null);
  };

  // Get active subtask for drag overlay
  const activeSubtask = activeId ? subtasks.find((s) => s.id === activeId) : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      {/* Mobile horizontal scroll container with snap points */}
      <div 
        className="flex gap-3 md:gap-4 h-full overflow-x-auto pb-4 px-2 md:px-0 snap-x snap-mandatory md:snap-none scroll-smooth touch-pan-x"
        style={{ 
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {COLUMNS.map((column) => {
          const columnSubtasks = getColumnSubtasks(column.id);
          return (
            <div 
              key={column.id} 
              className="snap-center md:snap-align-none flex-shrink-0 w-[85vw] md:w-auto"
            >
              <KanbanColumn
                id={column.id}
                title={column.title}
                subtasks={columnSubtasks}
                onSubtaskClick={handleSubtaskClick}
                onCreateSubtask={(input: CreateSubtaskInput) => handleCreateSubtask(column.id, input)}
                onTogglePin={handleTogglePin}
              />
            </div>
          );
        })}
      </div>

      {/* Drag overlay for smooth animation */}
      <DragOverlay>
        {activeSubtask ? (
          <SubtaskCard
            subtask={activeSubtask}
            isDragging
          />
        ) : null}
      </DragOverlay>

      {/* Subtask detail panel */}
      {selectedSubtask && (
        <SubtaskPanel
          subtask={selectedSubtask}
          isOpen={!!selectedSubtask}
          onClose={() => setSelectedSubtask(null)}
          onUpdate={handleSubtaskUpdate}
          onDelete={handleSubtaskDelete}
          onError={onError}
          onSuccess={onSuccess}
        />
      )}
    </DndContext>
  );
}
