'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout';
import { ClientStats, ClientNotes, ClientOrders } from '@/components/clients';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { 
  fetchClientStats, 
  fetchClientOrders, 
  fetchClientNotes,
  deleteOrder,
  type ClientStats as ClientStatsType,
  type ClientOrder,
  type ClientNote 
} from '@/lib/api';

export default function ClientCardPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const clientName = decodeURIComponent(params.name as string);

  const [stats, setStats] = useState<ClientStatsType | null>(null);
  const [orders, setOrders] = useState<ClientOrder[]>([]);
  const [notes, setNotes] = useState<ClientNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadClientData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, ordersData, notesData] = await Promise.all([
        fetchClientStats(clientName),
        fetchClientOrders(clientName),
        fetchClientNotes(clientName),
      ]);
      setStats(statsData);
      setOrders(ordersData);
      setNotes(notesData);
    } catch (err) {
      setError('Не удалось загрузить данные клиента');
      console.error('Failed to fetch client data:', err);
    } finally {
      setLoading(false);
    }
  }, [clientName]);

  useEffect(() => {
    loadClientData();
  }, [loadClientData]);

  const handleNotesUpdate = useCallback((updatedNotes: ClientNote[]) => {
    setNotes(updatedNotes);
  }, []);

  const handleOrderDeleted = useCallback((orderId: string) => {
    setOrders(prev => prev.filter(o => o.id !== orderId));
    if (stats) {
      setStats(prev => prev ? { ...prev, totalOrders: prev.totalOrders - 1 } : null);
    }
  }, [stats]);

  const handleDeleteClient = async () => {
    const confirmed = window.confirm(`Удалить клиента "${clientName}" и все его заказы (${orders.length})?`);
    if (!confirmed) return;

    setDeleting(true);
    try {
      // Delete all orders for this client
      for (const order of orders) {
        await deleteOrder(order.id);
      }
      showToast(`Клиент "${clientName}" удалён`, { type: 'success' });
      router.push('/clients');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Ошибка удаления', { type: 'error' });
      setDeleting(false);
    }
  };

  const breadcrumbs = [
    { label: 'Клиенты', path: '/clients' },
    { label: clientName, path: `/clients/${encodeURIComponent(clientName)}` },
  ];

  return (
    <AppLayout
      title={clientName}
      subtitle="Карточка клиента"
      breadcrumbs={breadcrumbs}
    >
      <div className="p-6">
        {loading ? (
          <div className="space-y-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>
            <button
              onClick={loadClientData}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              Попробовать снова
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Client Statistics */}
            {stats && <ClientStats stats={stats} />}

            {/* Client Notes */}
            <ClientNotes 
              clientName={clientName} 
              notes={notes} 
              onNotesUpdate={handleNotesUpdate}
            />

            {/* Client Orders with Journey */}
            <ClientOrders orders={orders} onOrderDeleted={handleOrderDeleted} />

            {/* Delete Client Button */}
            <div className="pt-4 border-t border-surface-200">
              <button
                onClick={handleDeleteClient}
                disabled={deleting}
                className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {deleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                    Удаление...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Удалить клиента
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
