import { create } from 'zustand';
import type { DashboardTask, TaskStatus, ParticipantName } from '@/types';
import {
  fetchDashboardTasks,
  createDashboardTask,
  updateDashboardTask,
  moveDashboardTask,
  deleteDashboardTask,
} from '@/lib/api';

interface TaskFilter {
  status?: TaskStatus;
  assignedTo?: ParticipantName;
}

interface TaskState {
  tasks: DashboardTask[];
  loading: boolean;
  error: string | null;
  currentFilter: TaskFilter | null;
  
  // Actions
  fetchTasks: (filter?: TaskFilter) => Promise<void>;
  createTask: (status: TaskStatus, title: string, description: string | undefined, createdBy: ParticipantName) => Promise<DashboardTask>;
  updateTask: (id: string, updates: Partial<DashboardTask>) => Promise<DashboardTask>;
  moveTask: (id: string, status: TaskStatus, position: number) => Promise<DashboardTask>;
  deleteTask: (id: string) => Promise<void>;
  
  // Optimistic updates
  optimisticMoveTask: (id: string, newStatus: TaskStatus) => void;
  rollbackTasks: (tasks: DashboardTask[]) => void;
}

export const useTaskStore = create<TaskState>((set) => ({
  tasks: [],
  loading: false,
  error: null,
  currentFilter: null,

  fetchTasks: async (filter?: TaskFilter) => {
    set({ loading: true, error: null, currentFilter: filter ?? null });
    try {
      const tasks = await fetchDashboardTasks(filter);
      set({ tasks, loading: false });
    } catch (err) {
      set({ 
        error: err instanceof Error ? err.message : 'Failed to fetch tasks',
        loading: false 
      });
    }
  },

  createTask: async (status, title, description, createdBy) => {
    const newTask = await createDashboardTask({
      title,
      description: description ?? null,
      status,
      createdBy,
      assignedTo: createdBy, // Автоматически назначаем на создателя
    });
    
    set((state) => ({
      tasks: [...state.tasks, newTask],
    }));
    
    return newTask;
  },

  updateTask: async (id, updates) => {
    const updatedTask = await updateDashboardTask(id, updates);
    
    set((state) => ({
      tasks: state.tasks.map((t) => 
        t.id === id ? updatedTask : t
      ),
    }));
    
    return updatedTask;
  },

  moveTask: async (id, status, position) => {
    const movedTask = await moveDashboardTask(id, { status, position });
    
    set((state) => ({
      tasks: state.tasks.map((t) => 
        t.id === id ? movedTask : t
      ),
    }));
    
    return movedTask;
  },

  deleteTask: async (id) => {
    await deleteDashboardTask(id);
    
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    }));
  },

  // Optimistic update for drag-and-drop
  optimisticMoveTask: (id, newStatus) => {
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, status: newStatus } : t
      ),
    }));
  },

  // Rollback to previous state on error
  rollbackTasks: (tasks) => {
    set({ tasks });
  },
}));

// Selectors - use primitive values to avoid infinite loops
export const selectTasksByStatus = (status: TaskStatus) => (state: TaskState) =>
  state.tasks
    .filter((t) => t.status === status)
    .sort((a, b) => a.position - b.position);

export const selectTodoCount = (state: TaskState) => 
  state.tasks.filter((t) => t.status === 'todo').length;

export const selectInProgressCount = (state: TaskState) => 
  state.tasks.filter((t) => t.status === 'in_progress').length;

export const selectDoneCount = (state: TaskState) => 
  state.tasks.filter((t) => t.status === 'done').length;

export const selectTotalCount = (state: TaskState) => state.tasks.length;

// Legacy selector - avoid using with useTaskStore directly
export const selectTaskCounts = (state: TaskState) => ({
  todo: state.tasks.filter((t) => t.status === 'todo').length,
  inProgress: state.tasks.filter((t) => t.status === 'in_progress').length,
  done: state.tasks.filter((t) => t.status === 'done').length,
  total: state.tasks.length,
});

export default useTaskStore;
