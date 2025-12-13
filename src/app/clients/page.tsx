'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { AppLayout } from '@/components/layout';
import { ClientList } from '@/components/clients';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { fetchClients, type ClientSummary } from '@/lib/api';

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const isFirstLoad = useRef(true);

  // Debounced search - handles both initial load and search
  useEffect(() => {
    const isInitial = isFirstLoad.current;
    const delay = isInitial ? 0 : 300;
    isFirstLoad.current = false;
    
    const timer = setTimeout(async () => {
      if (!isInitial) setSearching(true);
      setError(null);
      try {
        const data = await fetchClients(searchQuery || undefined);
        setClients(data);
      } catch (err) {
        setError('Не удалось загрузить список клиентов');
        console.error('Failed to fetch clients:', err);
      } finally {
        setInitialLoading(false);
        setSearching(false);
      }
    }, delay);
    
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
      <div className="p-3 md:p-6">
        {/* Search header */}
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mb-4 md:mb-6">
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 md:w-5 h-4 md:h-5 text-gray-400"
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
              placeholder="Поиск клиента..."
              className="w-full pl-9 md:pl-10 pr-4 py-2 text-sm md:text-base rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors touch-manipulation"
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
        {initialLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>
            <button
              onClick={() => setSearchQuery('')}
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
          <div className={searching ? 'opacity-50 transition-opacity' : ''}>
            <ClientList clients={clients} />
          </div>
        )}

        {/* Stats footer */}
        {!initialLoading && clients.length > 0 && (
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
