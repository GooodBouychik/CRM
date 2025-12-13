import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchOrders, createOrder, updateOrder, deleteOrder as apiDeleteOrder } from '@/lib/api';
import type { Order, ParticipantName, OrderStatus, Priority } from '@/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Search, Plus, Trash2, Loader2, X, Eye } from 'lucide-react';
import { toast } from 'sonner';

const statusColors: Record<OrderStatus, string> = {
  new: 'text-foreground',
  in_progress: 'text-warning',
  review: 'text-purple-400',
  completed: 'text-muted-foreground',
  rejected: 'text-destructive',
};

const statusLabels: Record<OrderStatus, string> = {
  new: 'Новый',
  in_progress: 'В работе',
  review: 'На проверке',
  completed: 'Завершён',
  rejected: 'Отклонён',
};

const priorityColors: Record<Priority, string> = {
  high: 'text-destructive',
  medium: 'text-warning',
  low: 'text-success',
};

const priorityLabels: Record<Priority, string> = {
  high: 'Высокий',
  medium: 'Средний',
  low: 'Низкий',
};

interface OrdersPageProps {
  currentUser?: ParticipantName;
}

const OrdersPage = ({ currentUser = 'Никита' }: OrdersPageProps) => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Fetch orders
  const { data: orders = [], isLoading, error } = useQuery({
    queryKey: ['orders'],
    queryFn: fetchOrders,
    staleTime: 30000,
  });

  // Create order mutation
  const createMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Заказ создан');
      setShowCreateModal(false);
    },
    onError: () => toast.error('Ошибка при создании заказа'),
  });

  // Delete order mutation
  const deleteMutation = useMutation({
    mutationFn: apiDeleteOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Заказ удалён');
    },
    onError: () => toast.error('Ошибка при удалении заказа'),
  });

  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || order.priority === priorityFilter;
    const matchesSearch = order.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (order.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    return matchesStatus && matchesPriority && matchesSearch;
  });

  const formatDate = (date: Date | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('ru', { day: 'numeric', month: 'short' });
  };

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleDateString('ru', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Заказы</h1>
          <p className="text-muted-foreground text-sm mt-1">{orders.length} заказов</p>
        </div>
        <Button className="self-start sm:self-auto" onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />Новый заказ
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input type="text" placeholder="Поиск..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-12 pl-12 pr-4 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Статус:</span>
          <div className="flex gap-1 flex-wrap">
            {['all', 'new', 'in_progress', 'review', 'completed', 'rejected'].map(status => (
              <button key={status} onClick={() => setStatusFilter(status)}
                className={cn("px-3 py-1.5 rounded-lg text-sm transition-all",
                  statusFilter === status ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground")}>
                {status === 'all' ? 'Все' : statusLabels[status as OrderStatus]}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Приоритет:</span>
          <div className="flex gap-1">
            {['all', 'high', 'medium', 'low'].map(priority => (
              <button key={priority} onClick={() => setPriorityFilter(priority)}
                className={cn("px-3 py-1.5 rounded-lg text-sm transition-all",
                  priorityFilter === priority ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground")}>
                {priority === 'all' ? 'Все' : priorityLabels[priority as Priority]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-center">
          <p className="text-destructive">Ошибка загрузки заказов</p>
        </div>
      )}

      {/* Table - Desktop */}
      {!isLoading && !error && (
        <div className="hidden lg:block bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left text-sm text-muted-foreground">
                  <th className="p-4 font-medium">ID</th>
                  <th className="p-4 font-medium">Клиент</th>
                  <th className="p-4 font-medium">Название</th>
                  <th className="p-4 font-medium">Сумма</th>
                  <th className="p-4 font-medium">Статус</th>
                  <th className="p-4 font-medium">Приоритет</th>
                  <th className="p-4 font-medium">Дедлайн</th>
                  <th className="p-4 font-medium">Обновлено</th>
                  <th className="p-4 font-medium">Теги</th>
                  <th className="p-4 font-medium w-20"></th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order, index) => (
                  <tr key={order.id} className="border-b border-border hover:bg-accent/50 transition-colors animate-slide-up" style={{ animationDelay: `${index * 30}ms` }}>
                    <td className="p-4 text-sm font-mono">#{String(order.orderNumber).padStart(3, '0')}</td>
                    <td className="p-4 text-sm">{order.clientName || '—'}</td>
                    <td className="p-4 text-sm font-medium">{order.title}</td>
                    <td className="p-4 text-sm">{order.amount?.toLocaleString() || 0} ₽</td>
                    <td className={cn("p-4 text-sm", statusColors[order.status])}>{statusLabels[order.status]}</td>
                    <td className="p-4">
                      <span className={cn("flex items-center gap-1.5 text-sm", priorityColors[order.priority])}>
                        <span className="w-2 h-2 rounded-full bg-current" />{priorityLabels[order.priority]}
                      </span>
                    </td>
                    <td className={cn("p-4 text-sm", order.priority === 'high' ? "text-destructive" : "text-foreground")}>{formatDate(order.dueDate)}</td>
                    <td className="p-4 text-sm text-muted-foreground">{formatDateTime(order.updatedAt)}</td>
                    <td className="p-4">
                      {order.tags?.map(tag => (
                        <span key={tag} className="inline-block px-2 py-1 text-xs bg-cyan-500/20 text-cyan-400 rounded-full mr-1">{tag}</span>
                      ))}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button className="text-muted-foreground hover:text-primary transition-colors" onClick={() => setSelectedOrder(order)}><Eye className="w-4 h-4" /></button>
                        <button className="text-muted-foreground hover:text-destructive transition-colors" onClick={() => deleteMutation.mutate(order.id)}><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cards - Mobile */}
      {!isLoading && !error && (
        <div className="lg:hidden space-y-3">
          {filteredOrders.map((order, index) => (
            <div key={order.id} className="bg-card rounded-xl border border-border p-4 animate-slide-up" style={{ animationDelay: `${index * 50}ms` }} onClick={() => setSelectedOrder(order)}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="text-xs text-muted-foreground font-mono">#{String(order.orderNumber).padStart(3, '0')}</span>
                  <h3 className="font-medium mt-1">{order.title}</h3>
                  <p className="text-sm text-muted-foreground">{order.clientName || '—'}</p>
                </div>
                <span className={cn("flex items-center gap-1.5 text-xs px-2 py-1 rounded-full", priorityColors[order.priority], "bg-current/10")}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />{priorityLabels[order.priority]}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold">{order.amount?.toLocaleString() || 0} ₽</span>
                <span className={cn(statusColors[order.status])}>{statusLabels[order.status]}</span>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
                <span>Дедлайн: <span className={order.priority === 'high' ? 'text-destructive' : ''}>{formatDate(order.dueDate)}</span></span>
                <span>{formatDateTime(order.updatedAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Order Modal */}
      {showCreateModal && <CreateOrderModal onClose={() => setShowCreateModal(false)} onSubmit={(data) => createMutation.mutate({ ...data, updatedBy: currentUser })} isLoading={createMutation.isPending} />}

      {/* Order Detail Modal */}
      {selectedOrder && <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
    </div>
  );
};


// Create Order Modal
interface CreateOrderModalProps {
  onClose: () => void;
  onSubmit: (data: { title: string; clientName?: string; amount?: number; priority?: Priority; dueDate?: Date }) => void;
  isLoading: boolean;
}

const CreateOrderModal = ({ onClose, onSubmit, isLoading }: CreateOrderModalProps) => {
  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [amount, setAmount] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      clientName: clientName.trim() || undefined,
      amount: amount ? parseInt(amount) : undefined,
      priority,
      dueDate: dueDate ? new Date(dueDate) : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-card border border-border rounded-xl p-6 w-full max-w-lg mx-4 animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Новый заказ</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Название *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Название заказа"
              className="w-full h-10 px-3 bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Клиент</label>
            <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Имя клиента"
              className="w-full h-10 px-3 bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Сумма</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0"
                className="w-full h-10 px-3 bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Приоритет</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full h-10 px-3 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                <option value="low">Низкий</option>
                <option value="medium">Средний</option>
                <option value="high">Высокий</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Дедлайн</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
              className="w-full h-10 px-3 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Отмена</Button>
            <Button type="submit" className="flex-1" disabled={isLoading || !title.trim()}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}Создать
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Order Detail Modal
interface OrderDetailModalProps {
  order: Order;
  onClose: () => void;
}

const OrderDetailModal = ({ order, onClose }: OrderDetailModalProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl p-6 w-full max-w-2xl mx-4 animate-scale-in max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="text-sm text-muted-foreground font-mono">#{String(order.orderNumber).padStart(3, '0')}</span>
            <h3 className="text-xl font-semibold mt-1">{order.title}</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-muted rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Клиент</p>
            <p className="font-medium">{order.clientName || '—'}</p>
          </div>
          <div className="bg-muted rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Сумма</p>
            <p className="font-medium">{order.amount?.toLocaleString() || 0} ₽</p>
          </div>
          <div className="bg-muted rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Статус</p>
            <p className={cn("font-medium", statusColors[order.status])}>{statusLabels[order.status]}</p>
          </div>
          <div className="bg-muted rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Приоритет</p>
            <p className={cn("font-medium", priorityColors[order.priority])}>{priorityLabels[order.priority]}</p>
          </div>
          <div className="bg-muted rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Дедлайн</p>
            <p className="font-medium">{order.dueDate ? new Date(order.dueDate).toLocaleDateString('ru') : '—'}</p>
          </div>
          <div className="bg-muted rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Обновлено</p>
            <p className="font-medium">{new Date(order.updatedAt).toLocaleDateString('ru', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>

        {order.description && (
          <div className="mb-6">
            <p className="text-sm text-muted-foreground mb-2">Описание</p>
            <p className="text-sm">{order.description}</p>
          </div>
        )}

        {order.tags && order.tags.length > 0 && (
          <div className="mb-6">
            <p className="text-sm text-muted-foreground mb-2">Теги</p>
            <div className="flex flex-wrap gap-2">
              {order.tags.map(tag => (
                <span key={tag} className="px-2 py-1 text-xs bg-cyan-500/20 text-cyan-400 rounded-full">{tag}</span>
              ))}
            </div>
          </div>
        )}

        {order.assignedTo && order.assignedTo.length > 0 && (
          <div>
            <p className="text-sm text-muted-foreground mb-2">Исполнители</p>
            <div className="flex flex-wrap gap-2">
              {order.assignedTo.map(name => (
                <span key={name} className="px-3 py-1 text-sm bg-primary/20 text-primary rounded-full">{name}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
