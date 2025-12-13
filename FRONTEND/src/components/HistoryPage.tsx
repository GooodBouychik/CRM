import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchOrders } from '@/lib/api';
import type { Order, OrderStatus } from '@/types';
import { cn } from '@/lib/utils';
import { Search, Loader2, Calendar, Filter, X, List, Grid } from 'lucide-react';
import { Button } from '@/components/ui/button';

const HistoryPage = () => {
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');

  const { data: orders = [], isLoading, error } = useQuery({
    queryKey: ['orders'],
    queryFn: fetchOrders,
    staleTime: 30000,
  });

  // Filter orders
  const filteredOrders = orders.filter(order => {
    if (search) {
      const searchLower = search.toLowerCase();
      if (!order.title.toLowerCase().includes(searchLower) &&
          !order.clientName?.toLowerCase().includes(searchLower) &&
          !String(order.orderNumber).includes(searchLower)) {
        return false;
      }
    }
    if (dateFrom && new Date(order.createdAt) < new Date(dateFrom)) return false;
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      if (new Date(order.createdAt) > toDate) return false;
    }
    if (status && order.status !== status) return false;
    return true;
  });

  const clearFilters = () => {
    setSearch('');
    setDateFrom('');
    setDateTo('');
    setStatus('');
  };

  const hasFilters = search || dateFrom || dateTo || status;

  const statusLabels: Record<OrderStatus, string> = {
    new: 'Новый',
    in_progress: 'В работе',
    review: 'На проверке',
    completed: 'Завершён',
    rejected: 'Отклонён',
  };

  const statusColors: Record<OrderStatus, string> = {
    new: 'bg-blue-500',
    in_progress: 'bg-warning',
    review: 'bg-purple-500',
    completed: 'bg-success',
    rejected: 'bg-destructive',
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ru', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Group by date for timeline view
  const groupByDate = (orders: Order[]) => {
    const groups: Record<string, Order[]> = {};
    orders.forEach(order => {
      const date = new Date(order.createdAt).toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' });
      if (!groups[date]) groups[date] = [];
      groups[date].push(order);
    });
    return Object.entries(groups).sort((a, b) => new Date(b[1][0].createdAt).getTime() - new Date(a[1][0].createdAt).getTime());
  };

  const groupedOrders = groupByDate(filteredOrders);

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Главная / История</p>
          <h1 className="text-2xl lg:text-3xl font-bold">История заказов</h1>
          <p className="text-muted-foreground text-sm mt-1">Хронология всех заказов</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-card rounded-lg p-1 border border-border">
            <button onClick={() => setViewMode('list')}
              className={cn("p-2 rounded-md transition-all", viewMode === 'list' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
              <List className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('timeline')}
              className={cn("p-2 rounded-md transition-all", viewMode === 'timeline' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
              <Grid className="w-4 h-4" />
            </button>
          </div>
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="w-4 h-4 mr-2" />Фильтры
            {hasFilters && <span className="ml-2 w-2 h-2 rounded-full bg-primary" />}
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input type="text" placeholder="Поиск по названию, клиенту или номеру..." value={search} onChange={(e) => setSearch(e.target.value)}
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
              <select value={status} onChange={(e) => setStatus(e.target.value as OrderStatus | '')}
                className="w-full h-10 px-3 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                <option value="">Все</option>
                {Object.entries(statusLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
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
          <p className="text-destructive">Ошибка загрузки истории</p>
        </div>
      )}

      {!isLoading && !error && filteredOrders.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Заказы не найдены</p>
        </div>
      )}

      {/* Timeline View */}
      {!isLoading && !error && viewMode === 'timeline' && groupedOrders.map(([date, dateOrders]) => (
        <div key={date}>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" />{date}
          </h3>
          <div className="relative pl-6 border-l-2 border-border space-y-4">
            {dateOrders.map((order, index) => (
              <div key={order.id} className="relative animate-slide-up" style={{ animationDelay: `${index * 30}ms` }}>
                <div className={cn("absolute -left-[25px] w-4 h-4 rounded-full border-2 border-background", statusColors[order.status])} />
                <div className="bg-card rounded-xl border border-border p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-mono">#{String(order.orderNumber).padStart(3, '0')}</span>
                        <span className={cn("text-xs px-2 py-0.5 rounded-full text-white", statusColors[order.status])}>
                          {statusLabels[order.status]}
                        </span>
                      </div>
                      <h4 className="font-medium mt-1">{order.title}</h4>
                      <p className="text-sm text-muted-foreground">{order.clientName || '—'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{order.amount?.toLocaleString() || 0} ₽</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* List View */}
      {!isLoading && !error && viewMode === 'list' && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-sm text-muted-foreground">
                <th className="p-4 font-medium">ID</th>
                <th className="p-4 font-medium">Название</th>
                <th className="p-4 font-medium">Клиент</th>
                <th className="p-4 font-medium">Статус</th>
                <th className="p-4 font-medium">Сумма</th>
                <th className="p-4 font-medium">Дата создания</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order, index) => (
                <tr key={order.id} className="border-b border-border hover:bg-accent/50 transition-colors animate-slide-up" style={{ animationDelay: `${index * 20}ms` }}>
                  <td className="p-4 text-sm font-mono">#{String(order.orderNumber).padStart(3, '0')}</td>
                  <td className="p-4 text-sm font-medium">{order.title}</td>
                  <td className="p-4 text-sm text-muted-foreground">{order.clientName || '—'}</td>
                  <td className="p-4">
                    <span className={cn("text-xs px-2 py-1 rounded-full text-white", statusColors[order.status])}>
                      {statusLabels[order.status]}
                    </span>
                  </td>
                  <td className="p-4 text-sm">{order.amount?.toLocaleString() || 0} ₽</td>
                  <td className="p-4 text-sm text-muted-foreground">{formatDate(order.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!isLoading && !error && filteredOrders.length > 0 && (
        <p className="text-sm text-muted-foreground">Всего: <span className="text-foreground font-medium">{filteredOrders.length} заказов</span></p>
      )}
    </div>
  );
};

export default HistoryPage;
