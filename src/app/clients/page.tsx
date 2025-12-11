'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { AppLayout } from '@/components/layout';
import { ClientList } from '@/components/clients';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { fetchClients, type ClientSummary } from '@/lib/api';

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch clients on mount
  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async (search?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchClients(search);
      setClients(data);
    } catch (err) {
      setError('Не удалось загрузить список клиентов');
      console.error('Failed to fetch clients:', err);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadClients(searchQuery || undefined);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle search input
  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  return (
    <AppLayout
      title="Клиенты"
      subtitle="База клиентов и история работы"
    >
      <div className="p-6">
        {/* Search header */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
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
              placeholder="Поиск по имени клиента..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
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
              onClick={() => loadClients()}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              Попробовать снова
            </button>
          </div>
        ) : clients.length === 0 ? (
          searchQuery ? (
            <div className="text-center py-12 animate-fade-in">
              <span className="text-6xl mb-4 block">🔍</span>
              <h3 className="text-xl font-semibold text-gray-200 mb-2">Клиенты не найдены</h3>
              <p className="text-gray-500">Попробуйте изменить поисковый запрос</p>
            </div>
          ) : (
            <div className="text-center py-12 animate-fade-in">
              <span className="text-6xl mb-4 block">👥</span>
              <h3 className="text-xl font-semibold text-gray-200 mb-2">Нет клиентов</h3>
              <p className="text-gray-500">Клиенты появятся после создания заказов</p>
            </div>
          )
        ) : (
          <ClientList clients={clients} />
        )}

        {/* Stats footer */}
        {!loading && clients.length > 0 && (
          <div className="mt-8 pt-6 border-t border-surface-200 animate-fade-in">
            <div className="flex flex-wrap gap-6 text-sm text-gray-400">
              <span>
                Всего: <strong className="text-gray-100 tabular-nums">{clients.length}</strong> клиентов
              </span>
              {searchQuery && (
                <span>
                  Найдено: <strong className="text-accent-400 tabular-nums">{clients.length}</strong>
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
