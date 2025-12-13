import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchClients, fetchClientStats, fetchClientOrders, type ClientSummary, type ClientStats, type ClientOrder } from '@/lib/api';
import { Search, ShoppingCart, Calendar, Loader2, X, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const ClientsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<string | null>(null);

  // Fetch clients
  const { data: clients = [], isLoading, error } = useQuery({
    queryKey: ['clients', searchQuery],
    queryFn: () => fetchClients(searchQuery || undefined),
    staleTime: 30000,
  });

  // Generate color based on client name
  const getClientColor = (name: string) => {
    const colors = ['bg-orange-500', 'bg-green-500', 'bg-pink-500', 'bg-purple-500', 'bg-blue-500', 'bg-cyan-500', 'bg-yellow-500', 'bg-red-500'];
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('ru', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <p className="text-sm text-muted-foreground mb-1">Главная / Клиенты</p>
        <h1 className="text-2xl lg:text-3xl font-bold">Клиенты</h1>
        <p className="text-muted-foreground text-sm mt-1">База клиентов и история работы</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input type="text" placeholder="Поиск клиента..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-12 pl-12 pr-4 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" />
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-center">
          <p className="text-destructive">Ошибка загрузки клиентов</p>
        </div>
      )}

      {/* Clients Grid */}
      {!isLoading && !error && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client, index) => (
            <div key={client.clientName} onClick={() => setSelectedClient(client.clientName)}
              className="bg-card rounded-xl border border-border p-4 hover:border-primary/30 transition-all duration-200 cursor-pointer group animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}>
              <div className="flex items-center gap-3 mb-4">
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-primary-foreground font-semibold", getClientColor(client.clientName))}>
                  {client.clientName.charAt(0)}
                </div>
                <h3 className="font-semibold group-hover:text-primary transition-colors truncate">{client.clientName}</h3>
              </div>
              <div className="flex items-center gap-6 text-sm mb-3">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Заказов</span>
                  <span className="font-medium">{client.totalOrders}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-warning">₽</span>
                  <span className="text-muted-foreground">Сумма</span>
                  <span className="font-medium text-warning">{client.totalAmount.toLocaleString()} ₽</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-3 border-t border-border">
                <Calendar className="w-3.5 h-3.5" />
                <span>Последний заказ: {formatDate(client.lastOrderDate)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && clients.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Клиенты не найдены</p>
        </div>
      )}

      {/* Total */}
      {!isLoading && !error && clients.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Всего: <span className="text-foreground font-medium">{clients.length} клиентов</span>
        </p>
      )}

      {/* Client Detail Modal */}
      {selectedClient && <ClientDetailModal clientName={selectedClient} onClose={() => setSelectedClient(null)} />}
    </div>
  );
};

// Client Detail Modal
interface ClientDetailModalProps {
  clientName: string;
  onClose: () => void;
}

const ClientDetailModal = ({ clientName, onClose }: ClientDetailModalProps) => {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['clientStats', clientName],
    queryFn: () => fetchClientStats(clientName),
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['clientOrders', clientName],
    queryFn: () => fetchClientOrders(clientName),
  });

  const statusLabels: Record<string, string> = {
    new: 'Новый', in_progress: 'В работе', review: 'На проверке', completed: 'Завершён', rejected: 'Отклонён'
  };

  const statusColors: Record<string, string> = {
    new: 'text-foreground', in_progress: 'text-warning', review: 'text-purple-400', completed: 'text-success', rejected: 'text-destructive'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl p-6 w-full max-w-3xl mx-4 animate-scale-in max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">{clientName}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>

        {/* Stats */}
        {statsLoading ? (
          <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-muted rounded-lg p-3 text-center">
              <ShoppingCart className="w-5 h-5 mx-auto mb-1 text-primary" />
              <p className="text-2xl font-bold">{stats.totalOrders}</p>
              <p className="text-xs text-muted-foreground">Всего заказов</p>
            </div>
            <div className="bg-muted rounded-lg p-3 text-center">
              <TrendingUp className="w-5 h-5 mx-auto mb-1 text-warning" />
              <p className="text-2xl font-bold">{stats.totalAmount.toLocaleString()} ₽</p>
              <p className="text-xs text-muted-foreground">Общая сумма</p>
            </div>
            <div className="bg-muted rounded-lg p-3 text-center">
              <CheckCircle className="w-5 h-5 mx-auto mb-1 text-success" />
              <p className="text-2xl font-bold">{stats.completedOrders}</p>
              <p className="text-xs text-muted-foreground">Завершено</p>
            </div>
            <div className="bg-muted rounded-lg p-3 text-center">
              <Clock className="w-5 h-5 mx-auto mb-1 text-cyan-400" />
              <p className="text-2xl font-bold">{stats.activeOrders}</p>
              <p className="text-xs text-muted-foreground">Активных</p>
            </div>
          </div>
        )}

        {/* Orders */}
        <div>
          <h4 className="font-semibold mb-3">История заказов</h4>
          {ordersLoading ? (
            <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : orders.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Нет заказов</p>
          ) : (
            <div className="space-y-2">
              {orders.map(order => (
                <div key={order.id} className="bg-muted rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-mono">#{String(order.orderNumber).padStart(3, '0')}</span>
                      <span className={cn("text-sm", statusColors[order.status])}>{statusLabels[order.status]}</span>
                    </div>
                    <p className="font-medium">{order.title}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{order.amount?.toLocaleString() || 0} ₽</p>
                    <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString('ru')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientsPage;
