import { create } from 'zustand';
import type { Task, TaskStatus, ParticipantName } from '@/types';

interface TaskState {
  tasks: Record<string, Task>;
  isLoading: boolean;
  error: string | null;
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, data: Partial<Task>) => void;
  moveTask: (id: string, status: TaskStatus, position?: number) => void;
  deleteTask: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useTaskStore = create<TaskState>((set) => ({
  tasks: {},
  isLoading: false,
  error: null,
  setTasks: (tasks) =>
    set({
      tasks: tasks.reduce((acc, task) => ({ ...acc, [task.id]: task }), {}),
      isLoading: false,
    }),
  addTask: (task) =>
    set((state) => ({
      tasks: { ...state.tasks, [task.id]: task },
    })),
  updateTask: (id, data) =>
    set((state) => ({
      tasks: {
        ...state.tasks,
        [id]: { ...state.tasks[id], ...data },
      },
    })),
  moveTask: (id, status, position) =>
    set((state) => ({
      tasks: {
        ...state.tasks,
        [id]: { ...state.tasks[id], status, position: position ?? state.tasks[id].position },
      },
    })),
  deleteTask: (id) =>
    set((state) => {
      const { [id]: _, ...rest } = state.tasks;
      return { tasks: rest };
    }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
