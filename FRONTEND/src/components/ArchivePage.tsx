import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchArchivedOrders, type ArchiveFilters } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Search, Loader2, Calendar, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ArchivePage = () => {
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [status, setStatus] = useState<'completed' | 'rejected' | ''>('');
  const [showFilters, setShowFilters] = useState(false);

  const filters: ArchiveFilters = {
    search: search || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    status: status || undefined,
  };

  const { data: orders = [], isLoading, error } = useQuery({
    queryKey: ['archive', filters],
    queryFn: () => fetchArchivedOrders(filters),
    staleTime: 60000,
  });

  const clearFilters = () => {
    setSearch('');
    setDateFrom('');
    setDateTo('');
    setStatus('');
  };

  const hasFilters = search || dateFrom || dateTo || status;

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('ru', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Group orders by month
  const groupByMonth = (ordersList: typeof orders) => {
    const groups: Record<string, typeof orders> = {};
    ordersList.forEach(order => {
      const date = new Date(order.completedAt || order.updatedAt);
      const key = date.toLocaleDateString('ru', { month: 'long', year: 'numeric' });
      if (!groups[key]) groups[key] = [];
      groups[key].push(order);
    });
    return groups;
  };

  const groupedOrders = groupByMonth(orders);

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Главная / Архив</p>
          <h1 className="text-2xl lg:text-3xl font-bold">Архив</h1>
          <p className="text-muted-foreground text-sm mt-1">Завершённые и отклонённые заказы</p>
        </div>
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
          <Filter className="w-4 h-4 mr-2" />Фильтры
          {hasFilters && <span className="ml-2 w-2 h-2 rounded-full bg-primary" />}
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input type="text" placeholder="Поиск в архиве..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full h-12 pl-12 pr-4 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" />
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-card rounded-xl border border-border p-4 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Фильтры</h3>
            {hasFilters && (
              <button onClick={clearFilters} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                <X className="w-4 h-4" />Сбросить
              </button>
            )}
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Дата от</label>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                className="w-full h-10 px-3 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Дата до</label>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                className="w-full h-10 px-3 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Статус</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)}
                className="w-full h-10 px-3 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                <option value="">Все</option>
                <option value="completed">Завершённые</option>
                <option value="rejected">Отклонённые</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      )}

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-center">
          <p className="text-destructive">Ошибка загрузки архива</p>
        </div>
      )}

      {!isLoading && !error && orders.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Архив пуст</p>
        </div>
      )}

      {!isLoading && !error && Object.entries(groupedOrders).map(([month, monthOrders]) => (
        <div key={month}>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 capitalize">{month}</h3>
          <div className="space-y-3">
            {monthOrders.map((order, index) => (
              <div key={order.id} className="bg-card rounded-xl border border-border p-4 animate-slide-up" style={{ animationDelay: `${index * 30}ms` }}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-mono">#{String(order.orderNumber).padStart(3, '0')}</span>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full",
                        order.status === 'completed' ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive')}>
                        {order.status === 'completed' ? 'Завершён' : 'Отклонён'}
                      </span>
                    </div>
                    <h4 className="font-medium mt-1">{order.title}</h4>
                    <p className="text-sm text-muted-foreground">{order.clientName || '—'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{order.amount?.toLocaleString() || 0} ₽</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(order.completedAt || order.updatedAt)}</span>
                    {order.totalComments > 0 && <span>{order.totalComments} комментариев</span>}
                  </div>
                  {order.participants && order.participants.length > 0 && (
                    <div className="flex items-center gap-1">
                      {order.participants.map(p => (
                        <span key={p} className="px-2 py-0.5 bg-muted rounded text-xs">{p}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {!isLoading && !error && orders.length > 0 && (
        <p className="text-sm text-muted-foreground">Всего: <span className="text-foreground font-medium">{orders.length} заказов</span></p>
      )}
    </div>
  );
};

export default ArchivePage;
