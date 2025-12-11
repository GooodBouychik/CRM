import { create } from 'zustand';
import type { ParticipantName } from '@/types';

export interface FieldEditState {
  orderId: string;
  fieldName: string;
  editingBy: ParticipantName;
  startedAt: Date;
}

export interface ConflictWarning {
  orderId: string;
  fieldName: string;
  otherUser: ParticipantName;
  timestamp: Date;
}

interface ConflictState {
  // Track who is editing which field
  fieldEdits: Record<string, FieldEditState>; // key: `${orderId}:${fieldName}`
  // Active conflict warnings
  conflicts: ConflictWarning[];
  // Current user's active edits
  myEdits: Set<string>; // key: `${orderId}:${fieldName}`
  
  // Actions
  setFieldEditing: (orderId: string, fieldName: string, editingBy: ParticipantName) => void;
  clearFieldEditing: (orderId: string, fieldName: string, editingBy: ParticipantName) => void;
  startMyEdit: (orderId: string, fieldName: string) => ConflictWarning | null;
  stopMyEdit: (orderId: string, fieldName: string) => void;
  addConflict: (conflict: ConflictWarning) => void;
  dismissConflict: (orderId: string, fieldName: string) => void;
  clearOrderEdits: (orderId: string) => void;
  getFieldEditor: (orderId: string, fieldName: string) => ParticipantName | null;
  isFieldBeingEdited: (orderId: string, fieldName: string, excludeUser?: ParticipantName) => boolean;
}

export const useConflictStore = create<ConflictState>((set, get) => ({
  fieldEdits: {},
  conflicts: [],
  myEdits: new Set(),

  setFieldEditing: (orderId, fieldName, editingBy) => {
    const key = `${orderId}:${fieldName}`;
    set((state) => ({
      fieldEdits: {
        ...state.fieldEdits,
        [key]: {
          orderId,
          fieldName,
          editingBy,
          startedAt: new Date(),
        },
      },
    }));
  },

  clearFieldEditing: (orderId, fieldName, editingBy) => {
    const key = `${orderId}:${fieldName}`;
    set((state) => {
      // Only clear if the same user is clearing
      if (state.fieldEdits[key]?.editingBy !== editingBy) {
        return state;
      }
      const newFieldEdits = { ...state.fieldEdits };
      delete newFieldEdits[key];
      return { fieldEdits: newFieldEdits };
    });
  },

  startMyEdit: (orderId, fieldName) => {
    const key = `${orderId}:${fieldName}`;
    const state = get();
    const existingEdit = state.fieldEdits[key];
    
    // Check if someone else is editing this field
    if (existingEdit && !state.myEdits.has(key)) {
      const conflict: ConflictWarning = {
        orderId,
        fieldName,
        otherUser: existingEdit.editingBy,
        timestamp: new Date(),
      };
      set((s) => {
        const newMyEdits = new Set(Array.from(s.myEdits));
        newMyEdits.add(key);
        return {
          myEdits: newMyEdits,
          conflicts: [...s.conflicts, conflict],
        };
      });
      return conflict;
    }
    
    set((s) => {
      const newMyEdits = new Set(Array.from(s.myEdits));
      newMyEdits.add(key);
      return { myEdits: newMyEdits };
    });
    return null;
  },

  stopMyEdit: (orderId, fieldName) => {
    const key = `${orderId}:${fieldName}`;
    set((state) => {
      const newMyEdits = new Set(state.myEdits);
      newMyEdits.delete(key);
      return { myEdits: newMyEdits };
    });
  },

  addConflict: (conflict) => {
    set((state) => ({
      conflicts: [...state.conflicts, conflict],
    }));
  },

  dismissConflict: (orderId, fieldName) => {
    set((state) => ({
      conflicts: state.conflicts.filter(
        (c) => !(c.orderId === orderId && c.fieldName === fieldName)
      ),
    }));
  },

  clearOrderEdits: (orderId) => {
    set((state) => {
      const newFieldEdits = { ...state.fieldEdits };
      const newMyEdits = new Set(state.myEdits);
      
      Object.keys(newFieldEdits).forEach((key) => {
        if (key.startsWith(`${orderId}:`)) {
          delete newFieldEdits[key];
        }
      });
      
      state.myEdits.forEach((key) => {
        if (key.startsWith(`${orderId}:`)) {
          newMyEdits.delete(key);
        }
      });
      
      return {
        fieldEdits: newFieldEdits,
        myEdits: newMyEdits,
        conflicts: state.conflicts.filter((c) => c.orderId !== orderId),
      };
    });
  },

  getFieldEditor: (orderId, fieldName) => {
    const key = `${orderId}:${fieldName}`;
    return get().fieldEdits[key]?.editingBy ?? null;
  },

  isFieldBeingEdited: (orderId, fieldName, excludeUser) => {
    const key = `${orderId}:${fieldName}`;
    const edit = get().fieldEdits[key];
    if (!edit) return false;
    if (excludeUser && edit.editingBy === excludeUser) return false;
    return true;
  },
}));
