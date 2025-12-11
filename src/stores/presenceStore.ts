import { create } from 'zustand';
import type { ParticipantName } from '@/types';

export interface Presence {
  name: ParticipantName;
  isOnline: boolean;
  currentOrderId: string | null;
  lastActivity: Date;
}

// Avatar colors for each participant
export const PARTICIPANT_COLORS: Record<ParticipantName, string> = {
  'Никита': '#3B82F6', // blue
  'Саня': '#10B981',   // green
  'Ксюша': '#F59E0B',  // amber
};

interface PresenceState {
  presence: Record<ParticipantName, Presence>;
  currentUser: ParticipantName | null;
  setPresence: (name: ParticipantName, data: Partial<Presence>) => void;
  setCurrentUser: (name: ParticipantName) => void;
  getOnlineUsers: () => Presence[];
  getViewersForOrder: (orderId: string) => Presence[];
  initializePresence: (presenceList: Presence[]) => void;
}

export const usePresenceStore = create<PresenceState>((set, get) => ({
  presence: {
    'Никита': { name: 'Никита', isOnline: false, currentOrderId: null, lastActivity: new Date() },
    'Саня': { name: 'Саня', isOnline: false, currentOrderId: null, lastActivity: new Date() },
    'Ксюша': { name: 'Ксюша', isOnline: false, currentOrderId: null, lastActivity: new Date() },
  },
  currentUser: null,
  setPresence: (name, data) =>
    set((state) => ({
      presence: {
        ...state.presence,
        [name]: { ...state.presence[name], ...data },
      },
    })),
  setCurrentUser: (name) => set({ currentUser: name }),
  getOnlineUsers: () => Object.values(get().presence).filter((p) => p.isOnline),
  getViewersForOrder: (orderId) =>
    Object.values(get().presence).filter((p) => p.isOnline && p.currentOrderId === orderId),
  initializePresence: (presenceList) =>
    set((state) => {
      const newPresence = { ...state.presence };
      // Reset all to offline first
      Object.keys(newPresence).forEach((name) => {
        newPresence[name as ParticipantName].isOnline = false;
        newPresence[name as ParticipantName].currentOrderId = null;
      });
      // Update with actual presence data
      presenceList.forEach((p) => {
        if (newPresence[p.name]) {
          newPresence[p.name] = {
            ...newPresence[p.name],
            isOnline: p.isOnline,
            currentOrderId: p.currentOrderId,
            lastActivity: new Date(p.lastActivity),
          };
        }
      });
      return { presence: newPresence };
    }),
}));
