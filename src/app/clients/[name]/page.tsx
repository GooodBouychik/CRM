'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { AppLayout } from '@/components/layout';
import { ClientStats, ClientNotes, ClientOrders } from '@/components/clients';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { 
  fetchClientStats, 
  fetchClientOrders, 
  fetchClientNotes,
  type ClientStats as ClientStatsType,
  type ClientOrder,
  type ClientNote 
} from '@/lib/api';

export default function ClientCardPage() {
  const params = useParams();
  const clientName = decodeURIComponent(params.name as string);

  const [stats, setStats] = useState<ClientStatsType | null>(null);
  const [orders, setOrders] = useState<ClientOrder[]>([]);
  const [notes, setNotes] = useState<ClientNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
            <ClientOrders orders={orders} />
          </div>
        )}
      </div>
    </AppLayout>
  );
}
