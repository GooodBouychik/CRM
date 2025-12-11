import { create } from 'zustand';
import type { ParticipantName, SubtaskStatus } from '@/types';
import {
  fetchCalendarSubtasks,
  fetchCalendarWorkload,
  moveCalendarSubtask,
  type CalendarSubtask,
  type DayWorkload,
} from '@/lib/api';

interface CalendarState {
  // Data
  subtasks: CalendarSubtask[];
  workload: DayWorkload[];
  
  // UI State
  loading: boolean;
  error: string | null;
  selectedDate: string | null; // ISO date string YYYY-MM-DD
  currentMonth: Date;
  filterAssignee: ParticipantName | null;
  
  // Actions
  fetchSubtasks: (from: string, to: string) => Promise<void>;
  fetchWorkload: (from: string, to: string) => Promise<void>;
  fetchCalendarData: (from: string, to: string) => Promise<void>;
  moveSubtask: (subtaskId: string, newDate: string) => Promise<CalendarSubtask>;
  
  // UI Actions
  setSelectedDate: (date: string | null) => void;
  setCurrentMonth: (date: Date) => void;
  setFilterAssignee: (assignee: ParticipantName | null) => void;
  
  // Optimistic updates
  optimisticMoveSubtask: (subtaskId: string, newDate: string) => void;
  rollbackSubtasks: (subtasks: CalendarSubtask[]) => void;
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  // Initial state
  subtasks: [],
  workload: [],
  loading: false,
  error: null,
  selectedDate: null,
  currentMonth: new Date(),
  filterAssignee: null,

  fetchSubtasks: async (from: string, to: string) => {
    set({ loading: true, error: null });
    try {
      const subtasks = await fetchCalendarSubtasks(from, to);
      set({ subtasks, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Не удалось загрузить подзадачи',
        loading: false,
      });
    }
  },


  fetchWorkload: async (from: string, to: string) => {
    try {
      const workload = await fetchCalendarWorkload(from, to);
      set({ workload });
    } catch (err) {
      console.error('Failed to fetch workload:', err);
    }
  },

  fetchCalendarData: async (from: string, to: string) => {
    set({ loading: true, error: null });
    try {
      const [subtasks, workload] = await Promise.all([
        fetchCalendarSubtasks(from, to),
        fetchCalendarWorkload(from, to),
      ]);
      set({ subtasks, workload, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Не удалось загрузить данные календаря',
        loading: false,
      });
    }
  },

  moveSubtask: async (subtaskId: string, newDate: string) => {
    // Store current state for rollback
    const previousSubtasks = get().subtasks;
    
    // Optimistic update
    get().optimisticMoveSubtask(subtaskId, newDate);
    
    try {
      const movedSubtask = await moveCalendarSubtask(subtaskId, newDate);
      
      // Update with server response
      set((state) => ({
        subtasks: state.subtasks.map((s) =>
          s.id === subtaskId ? movedSubtask : s
        ),
      }));
      
      return movedSubtask;
    } catch (err) {
      // Rollback on error
      get().rollbackSubtasks(previousSubtasks);
      throw err;
    }
  },

  setSelectedDate: (date: string | null) => {
    set({ selectedDate: date });
  },

  setCurrentMonth: (date: Date) => {
    set({ currentMonth: date });
  },

  setFilterAssignee: (assignee: ParticipantName | null) => {
    set({ filterAssignee: assignee });
  },

  optimisticMoveSubtask: (subtaskId: string, newDate: string) => {
    set((state) => ({
      subtasks: state.subtasks.map((s) =>
        s.id === subtaskId ? { ...s, dueDate: newDate } : s
      ),
    }));
  },

  rollbackSubtasks: (subtasks: CalendarSubtask[]) => {
    set({ subtasks });
  },
}));

// Selectors
export const selectSubtasksByDate = (date: string) => (state: CalendarState) => {
  const { subtasks, filterAssignee } = state;
  let filtered = subtasks.filter((s) => s.dueDate.startsWith(date));
  
  if (filterAssignee) {
    filtered = filtered.filter((s) => s.assignedTo === filterAssignee);
  }
  
  return filtered;
};

export const selectWorkloadByDate = (date: string) => (state: CalendarState) =>
  state.workload.find((w) => w.date.startsWith(date)) || null;

export const selectOverloadedDays = (state: CalendarState) =>
  state.workload.filter((w) => w.isOverloaded).map((w) => w.date);

export const selectTotalSubtasksCount = (state: CalendarState) => state.subtasks.length;

export const selectSubtasksByStatus = (status: SubtaskStatus) => (state: CalendarState) =>
  state.subtasks.filter((s) => s.status === status);

export const selectSubtasksByAssignee = (assignee: ParticipantName) => (state: CalendarState) =>
  state.subtasks.filter((s) => s.assignedTo === assignee);

export const selectSelectedDateSubtasks = (state: CalendarState) => {
  if (!state.selectedDate) return [];
  return selectSubtasksByDate(state.selectedDate)(state);
};

export default useCalendarStore;
