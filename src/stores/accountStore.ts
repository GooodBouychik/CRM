import { create } from 'zustand';
import type { ServiceAccount, AccountCategory, ParticipantName } from '@/types';
import {
  fetchAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
  fetchAccountCategories,
  createAccountCategory,
  type CreateServiceAccountInput,
  type UpdateServiceAccountInput,
  type CreateAccountCategoryInput,
} from '@/lib/api';

interface AccountState {
  accounts: ServiceAccount[];
  categories: AccountCategory[];
  loading: boolean;
  error: string | null;
  searchQuery: string;

  // Actions
  fetchAccounts: (search?: string) => Promise<void>;
  fetchCategories: () => Promise<void>;
  createAccount: (input: CreateServiceAccountInput) => Promise<ServiceAccount>;
  updateAccount: (id: string, input: UpdateServiceAccountInput) => Promise<ServiceAccount>;
  deleteAccount: (id: string) => Promise<void>;
  createCategory: (input: CreateAccountCategoryInput) => Promise<AccountCategory>;
  setSearchQuery: (query: string) => void;
}

export const useAccountStore = create<AccountState>((set, get) => ({
  accounts: [],
  categories: [],
  loading: false,
  error: null,
  searchQuery: '',

  fetchAccounts: async (search?: string) => {
    set({ loading: true, error: null });
    try {
      const accounts = await fetchAccounts({ search });
      set({ accounts, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to fetch accounts',
        loading: false,
      });
    }
  },

  fetchCategories: async () => {
    try {
      const categories = await fetchAccountCategories();
      set({ categories });
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  },

  createAccount: async (input) => {
    const newAccount = await createAccount(input);
    set((state) => ({
      accounts: [...state.accounts, newAccount],
    }));
    return newAccount;
  },

  updateAccount: async (id, input) => {
    const updatedAccount = await updateAccount(id, input);
    set((state) => ({
      accounts: state.accounts.map((a) =>
        a.id === id ? updatedAccount : a
      ),
    }));
    return updatedAccount;
  },

  deleteAccount: async (id) => {
    await deleteAccount(id);
    set((state) => ({
      accounts: state.accounts.filter((a) => a.id !== id),
    }));
  },

  createCategory: async (input) => {
    const newCategory = await createAccountCategory(input);
    set((state) => ({
      categories: [...state.categories, newCategory],
    }));
    return newCategory;
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },
}));

// Selectors
export const selectAccountsByCategory = (state: AccountState) => {
  const { accounts, searchQuery } = state;
  
  // Filter by search query
  const filteredAccounts = searchQuery
    ? accounts.filter(
        (a) =>
          a.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (a.notes && a.notes.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : accounts;

  // Group by category
  const grouped = new Map<string | null, ServiceAccount[]>();
  
  for (const account of filteredAccounts) {
    const categoryId = account.categoryId;
    if (!grouped.has(categoryId)) {
      grouped.set(categoryId, []);
    }
    grouped.get(categoryId)!.push(account);
  }

  return grouped;
};

export const selectAccountsCount = (state: AccountState) => state.accounts.length;

export const selectFilteredAccountsCount = (state: AccountState) => {
  const { accounts, searchQuery } = state;
  if (!searchQuery) return accounts.length;
  
  return accounts.filter(
    (a) =>
      a.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.notes && a.notes.toLowerCase().includes(searchQuery.toLowerCase()))
  ).length;
};

export default useAccountStore;
