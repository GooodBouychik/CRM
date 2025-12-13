import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, ParticipantName } from '@/types';

interface UserState {
  currentUser: ParticipantName | null;
  users: User[];
  setCurrentUser: (user: ParticipantName | null) => void;
  setUsers: (users: User[]) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      currentUser: null,
      users: [],
      setCurrentUser: (currentUser) => set({ currentUser }),
      setUsers: (users) => set({ users }),
      logout: () => set({ currentUser: null }),
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({ currentUser: state.currentUser }),
    }
  )
);
