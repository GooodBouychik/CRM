'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { AppLayout } from '@/components/layout';
import { AccountCard, AccountForm, CategoryGroup, type AccountFormData } from '@/components/accounts';
import { EmptyAccountsState, EmptySearchState } from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { useAccountStore, selectAccountsByCategory } from '@/stores/accountStore';
import type { ServiceAccount, AccountCategory, ParticipantName } from '@/types';

// Current user - in a real app this would come from auth context
const CURRENT_USER: ParticipantName = 'Никита';

export default function AccountsPage() {
  const {
    accounts,
    categories,
    loading,
    error,
    searchQuery,
    fetchAccounts,
    fetchCategories,
    createAccount,
    updateAccount,
    deleteAccount,
    createCategory,
    setSearchQuery,
  } = useAccountStore();

  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<ServiceAccount | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<ServiceAccount | null>(null);

  // Fetch data on mount
  useEffect(() => {
    fetchAccounts();
    fetchCategories();
  }, [fetchAccounts, fetchCategories]);

  // Group accounts by category
  const accountsByCategory = useMemo(() => {
    return selectAccountsByCategory({ accounts, categories, loading, error, searchQuery, fetchAccounts, fetchCategories, createAccount, updateAccount, deleteAccount, createCategory, setSearchQuery });
  }, [accounts, searchQuery]);

  // Get category by ID
  const getCategoryById = useCallback(
    (categoryId: string | null): AccountCategory | null => {
      if (!categoryId) return null;
      return categories.find((c) => c.id === categoryId) || null;
    },
    [categories]
  );

  // Handle form submit
  const handleFormSubmit = useCallback(
    async (data: AccountFormData) => {
      setFormLoading(true);
      try {
        if (editingAccount) {
          await updateAccount(editingAccount.id, {
            serviceName: data.serviceName,
            serviceUrl: data.serviceUrl || null,
            username: data.username,
            password: data.password,
            notes: data.notes || null,
            categoryId: data.categoryId || null,
          });
        } else {
          await createAccount({
            serviceName: data.serviceName,
            serviceUrl: data.serviceUrl || null,
            username: data.username,
            password: data.password,
            notes: data.notes || null,
            categoryId: data.categoryId || null,
            createdBy: CURRENT_USER,
          });
        }
        setShowForm(false);
        setEditingAccount(null);
      } catch (err) {
        console.error('Failed to save account:', err);
      } finally {
        setFormLoading(false);
      }
    },
    [editingAccount, createAccount, updateAccount]
  );

  // Handle edit
  const handleEdit = useCallback((account: ServiceAccount) => {
    setEditingAccount(account);
    setShowForm(true);
  }, []);

  // Handle delete
  const handleDelete = useCallback((account: ServiceAccount) => {
    setDeleteConfirm(account);
  }, []);

  // Confirm delete
  const confirmDelete = useCallback(async () => {
    if (deleteConfirm) {
      try {
        await deleteAccount(deleteConfirm.id);
      } catch (err) {
        console.error('Failed to delete account:', err);
      }
      setDeleteConfirm(null);
    }
  }, [deleteConfirm, deleteAccount]);

  // Handle create category
  const handleCreateCategory = useCallback(
    async (name: string) => {
      try {
        await createCategory({ name });
      } catch (err) {
        console.error('Failed to create category:', err);
      }
    },
    [createCategory]
  );

  // Handle search
  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    [setSearchQuery]
  );

  // Cancel form
  const handleCancelForm = useCallback(() => {
    setShowForm(false);
    setEditingAccount(null);
  }, []);

  // Open add form
  const handleAddAccount = useCallback(() => {
    setEditingAccount(null);
    setShowForm(true);
  }, []);

  // Build category groups for rendering
  const categoryGroups = useMemo(() => {
    const groups: { category: AccountCategory | null; accounts: ServiceAccount[] }[] = [];
    
    // First add categories that have accounts
    for (const category of categories) {
      const categoryAccounts = accountsByCategory.get(category.id) || [];
      if (categoryAccounts.length > 0) {
        groups.push({ category, accounts: categoryAccounts });
      }
    }
    
    // Add uncategorized accounts
    const uncategorized = accountsByCategory.get(null) || [];
    if (uncategorized.length > 0) {
      groups.push({ category: null, accounts: uncategorized });
    }
    
    // Add empty categories at the end
    for (const category of categories) {
      const categoryAccounts = accountsByCategory.get(category.id) || [];
      if (categoryAccounts.length === 0) {
        groups.push({ category, accounts: [] });
      }
    }
    
    return groups;
  }, [categories, accountsByCategory]);

  const hasSearchResults = searchQuery && accounts.length > 0;
  const filteredCount = Array.from(accountsByCategory.values()).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <AppLayout
      title="Аккаунты"
      subtitle="Учётные данные сервисов"
    >
      <div className="p-6">
        {/* Header with search and add button */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Поиск по названию или заметкам..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Add button */}
          <button
            onClick={handleAddAccount}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Добавить аккаунт
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>
            <button
              onClick={() => fetchAccounts()}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              Попробовать снова
            </button>
          </div>
        ) : accounts.length === 0 ? (
          <EmptyAccountsState onAction={handleAddAccount} />
        ) : searchQuery && filteredCount === 0 ? (
          <EmptySearchState />
        ) : (
          <div className="space-y-2">
            {categoryGroups
              .filter((g) => g.accounts.length > 0)
              .map((group) => (
                <CategoryGroup
                  key={group.category?.id || 'uncategorized'}
                  category={group.category}
                  accounts={group.accounts}
                  onEditAccount={handleEdit}
                  onDeleteAccount={handleDelete}
                />
              ))}
          </div>
        )}

        {/* Stats footer */}
        {!loading && accounts.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap gap-6 text-sm text-gray-500 dark:text-gray-400">
              <span>
                Всего: <strong className="text-gray-900 dark:text-gray-100">{accounts.length}</strong> аккаунтов
              </span>
              <span>
                Категорий: <strong className="text-gray-900 dark:text-gray-100">{categories.length}</strong>
              </span>
              {searchQuery && (
                <span>
                  Найдено: <strong className="text-primary-600 dark:text-primary-400">{filteredCount}</strong>
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {editingAccount ? 'Редактировать аккаунт' : 'Новый аккаунт'}
                </h2>
                <button
                  onClick={handleCancelForm}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <AccountForm
                account={editingAccount || undefined}
                categories={categories}
                onSubmit={handleFormSubmit}
                onCancel={handleCancelForm}
                onCreateCategory={handleCreateCategory}
                isLoading={formLoading}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Удалить аккаунт?
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {deleteConfirm.serviceName}
                </p>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Это действие нельзя отменить. Учётные данные будут удалены безвозвратно.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
