import { create } from 'zustand';
import type { ParticipantName } from '@/types';
import {
  fetchClients,
  fetchClientStats,
  fetchClientOrders,
  fetchClientNotes,
  createClientNote,
  updateClientNote,
  deleteClientNote,
  type ClientSummary,
  type ClientStats,
  type ClientOrder,
  type ClientNote,
  type CreateClientNoteInput,
} from '@/lib/api';

interface ClientState {
  // Data
  clients: ClientSummary[];
  selectedClient: string | null;
  clientStats: ClientStats | null;
  clientOrders: ClientOrder[];
  clientNotes: ClientNote[];
  
  // UI State
  loading: boolean;
  error: string | null;
  searchQuery: string;
  notesLoading: boolean;
  
  // Actions - Clients List
  fetchClients: (search?: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  selectClient: (clientName: string | null) => void;
  
  // Actions - Client Details
  fetchClientDetails: (clientName: string) => Promise<void>;
  
  // Actions - Notes CRUD
  fetchNotes: (clientName: string) => Promise<void>;
  createNote: (clientName: string, input: CreateClientNoteInput) => Promise<ClientNote>;
  updateNote: (noteId: string, content: string) => Promise<ClientNote>;
  deleteNote: (noteId: string) => Promise<void>;
  
  // Reset
  clearSelectedClient: () => void;
}

export const useClientStore = create<ClientState>((set, get) => ({
  // Initial state
  clients: [],
  selectedClient: null,
  clientStats: null,
  clientOrders: [],
  clientNotes: [],
  loading: false,
  error: null,
  searchQuery: '',
  notesLoading: false,


  // Fetch clients list
  fetchClients: async (search?: string) => {
    set({ loading: true, error: null });
    try {
      const clients = await fetchClients(search);
      set({ clients, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Не удалось загрузить список клиентов',
        loading: false,
      });
    }
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  selectClient: (clientName: string | null) => {
    set({ selectedClient: clientName });
    if (clientName) {
      get().fetchClientDetails(clientName);
    }
  },

  // Fetch all client details (stats, orders, notes)
  fetchClientDetails: async (clientName: string) => {
    set({ loading: true, error: null });
    try {
      const [stats, orders, notes] = await Promise.all([
        fetchClientStats(clientName),
        fetchClientOrders(clientName),
        fetchClientNotes(clientName),
      ]);
      set({
        clientStats: stats,
        clientOrders: orders,
        clientNotes: notes,
        loading: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Не удалось загрузить данные клиента',
        loading: false,
      });
    }
  },

  // Notes operations
  fetchNotes: async (clientName: string) => {
    set({ notesLoading: true });
    try {
      const notes = await fetchClientNotes(clientName);
      set({ clientNotes: notes, notesLoading: false });
    } catch (err) {
      console.error('Failed to fetch notes:', err);
      set({ notesLoading: false });
    }
  },

  createNote: async (clientName: string, input: CreateClientNoteInput) => {
    const newNote = await createClientNote(clientName, input);
    set((state) => ({
      clientNotes: [newNote, ...state.clientNotes],
    }));
    return newNote;
  },

  updateNote: async (noteId: string, content: string) => {
    const updatedNote = await updateClientNote(noteId, content);
    set((state) => ({
      clientNotes: state.clientNotes.map((note) =>
        note.id === noteId ? updatedNote : note
      ),
    }));
    return updatedNote;
  },

  deleteNote: async (noteId: string) => {
    await deleteClientNote(noteId);
    set((state) => ({
      clientNotes: state.clientNotes.filter((note) => note.id !== noteId),
    }));
  },

  clearSelectedClient: () => {
    set({
      selectedClient: null,
      clientStats: null,
      clientOrders: [],
      clientNotes: [],
    });
  },
}));

// Selectors
export const selectFilteredClients = (state: ClientState) => {
  const { clients, searchQuery } = state;
  if (!searchQuery) return clients;
  
  const query = searchQuery.toLowerCase();
  return clients.filter((client) =>
    client.clientName.toLowerCase().includes(query)
  );
};

export const selectClientsCount = (state: ClientState) => state.clients.length;

export const selectTotalRevenue = (state: ClientState) =>
  state.clients.reduce((sum, client) => sum + client.totalAmount, 0);

export const selectActiveClientsCount = (state: ClientState) =>
  state.clients.filter((client) => client.totalOrders > 0).length;

export default useClientStore;
