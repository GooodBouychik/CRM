import { useQuery } from '@tanstack/react-query';
import { fetchActivity, type ActivityEntry } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Loader2, ShoppingCart, CheckCircle, MessageSquare, ListTodo, Clock, User } from 'lucide-react';

const ActivityPage = () => {
  const { data: activities = [], isLoading, error } = useQuery({
    queryKey: ['activity'],
    queryFn: () => fetchActivity(100),
    staleTime: 30000,
  });

  const getIcon = (type: ActivityEntry['type']) => {
    switch (type) {
      case 'order_created': return ShoppingCart;
      case 'order_updated': return ShoppingCart;
      case 'status_changed': return ShoppingCart;
      case 'comment_added': return MessageSquare;
      case 'task_created': return ListTodo;
      case 'task_completed': return CheckCircle;
      default: return ShoppingCart;
    }
  };

  const getColor = (type: ActivityEntry['type']) => {
    switch (type) {
      case 'order_created': return 'text-primary bg-primary/10';
      case 'order_updated': return 'text-warning bg-warning/10';
      case 'status_changed': return 'text-purple-400 bg-purple-400/10';
      case 'comment_added': return 'text-cyan-400 bg-cyan-400/10';
      case 'task_created': return 'text-blue-400 bg-blue-400/10';
      case 'task_completed': return 'text-success bg-success/10';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const getTitle = (activity: ActivityEntry) => {
    switch (activity.type) {
      case 'order_created': return 'Создан заказ';
      case 'order_updated': return 'Обновлён заказ';
      case 'status_changed': return 'Изменён статус';
      case 'comment_added': return 'Добавлен комментарий';
      case 'task_created': return 'Создана задача';
      case 'task_completed': return 'Завершена задача';
      default: return 'Действие';
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'только что';
    if (minutes < 60) return `${minutes} мин. назад`;
    if (hours < 24) return `${hours} ч. назад`;
    if (days < 7) return `${days} дн. назад`;
    return date.toLocaleDateString('ru', { day: 'numeric', month: 'short' });
  };

  const groupByDate = (activities: ActivityEntry[]) => {
    const groups: Record<string, ActivityEntry[]> = {};
    activities.forEach(activity => {
      const date = new Date(activity.createdAt).toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' });
      if (!groups[date]) groups[date] = [];
      groups[date].push(activity);
    });
    return groups;
  };

  const groupedActivities = groupByDate(activities);

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <p className="text-sm text-muted-foreground mb-1">Главная / Активность</p>
        <h1 className="text-2xl lg:text-3xl font-bold">Активность</h1>
        <p className="text-muted-foreground text-sm mt-1">Лента последних действий</p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      )}

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-center">
          <p className="text-destructive">Ошибка загрузки активности</p>
        </div>
      )}

      {!isLoading && !error && activities.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Нет активности</p>
        </div>
      )}

      {!isLoading && !error && Object.entries(groupedActivities).map(([date, items]) => (
        <div key={date}>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">{date}</h3>
          <div className="bg-card rounded-xl border border-border divide-y divide-border">
            {items.map((activity, index) => {
              const Icon = getIcon(activity.type);
              const colorClass = getColor(activity.type);
              return (
                <div key={activity.id} className="p-4 flex items-start gap-4 animate-slide-up" style={{ animationDelay: `${index * 30}ms` }}>
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0", colorClass)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{getTitle(activity)}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <User className="w-3 h-3" />{activity.actor}
                      </span>
                    </div>
                    {activity.orderTitle && (
                      <p className="text-sm text-muted-foreground truncate">{activity.orderTitle}</p>
                    )}
                    {activity.taskTitle && (
                      <p className="text-sm text-muted-foreground truncate">{activity.taskTitle}</p>
                    )}
                    {activity.details && (
                      <p className="text-sm text-muted-foreground truncate">{activity.details}</p>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 flex-shrink-0">
                    <Clock className="w-3 h-3" />{formatTime(activity.createdAt)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ActivityPage;
