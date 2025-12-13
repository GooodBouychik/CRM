import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchStatistics } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Loader2, TrendingUp, ShoppingCart, CheckCircle, DollarSign, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const StatisticsPage = () => {
  const [period, setPeriod] = useState('month');

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['statistics', period],
    queryFn: () => fetchStatistics(period),
    staleTime: 60000,
  });

  const periods = [
    { id: 'week', label: 'Неделя' },
    { id: 'month', label: 'Месяц' },
    { id: 'quarter', label: 'Квартал' },
    { id: 'year', label: 'Год' },
  ];

  const statusColors: Record<string, string> = {
    new: '#3b82f6',
    in_progress: '#f59e0b',
    review: '#a855f7',
    completed: '#22c55e',
    rejected: '#ef4444',
  };

  const statusLabels: Record<string, string> = {
    new: 'Новые',
    in_progress: 'В работе',
    review: 'На проверке',
    completed: 'Завершённые',
    rejected: 'Отклонённые',
  };

  const priorityColors: Record<string, string> = {
    high: '#ef4444',
    medium: '#f59e0b',
    low: '#22c55e',
  };

  const priorityLabels: Record<string, string> = {
    high: 'Высокий',
    medium: 'Средний',
    low: 'Низкий',
  };

  // Prepare chart data
  const statusData = stats ? Object.entries(stats.ordersByStatus).map(([status, count]) => ({
    name: statusLabels[status] || status,
    value: count,
    color: statusColors[status] || '#6b7280',
  })) : [];

  const priorityData = stats ? Object.entries(stats.ordersByPriority).map(([priority, count]) => ({
    name: priorityLabels[priority] || priority,
    value: count,
    color: priorityColors[priority] || '#6b7280',
  })) : [];

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Главная / Статистика</p>
          <h1 className="text-2xl lg:text-3xl font-bold">Статистика</h1>
          <p className="text-muted-foreground text-sm mt-1">Аналитика и отчёты</p>
        </div>
        <div className="flex gap-1 bg-card rounded-lg p-1 border border-border">
          {periods.map(p => (
            <button key={p.id} onClick={() => setPeriod(p.id)}
              className={cn("px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                period === p.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      )}

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-center">
          <p className="text-destructive">Ошибка загрузки статистики</p>
        </div>
      )}

      {stats && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                <ShoppingCart className="w-4 h-4" /><span>Всего заказов</span>
              </div>
              <p className="text-2xl font-bold">{stats.totalOrders}</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                <CheckCircle className="w-4 h-4 text-success" /><span>Завершено</span>
              </div>
              <p className="text-2xl font-bold text-success">{stats.completedOrders}</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                <DollarSign className="w-4 h-4 text-warning" /><span>Общая выручка</span>
              </div>
              <p className="text-2xl font-bold text-warning">{stats.totalRevenue.toLocaleString()} ₽</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                <TrendingUp className="w-4 h-4 text-primary" /><span>Средний чек</span>
              </div>
              <p className="text-2xl font-bold text-primary">{Math.round(stats.averageOrderValue).toLocaleString()} ₽</p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <div className="bg-card rounded-xl border border-border p-4">
              <h3 className="font-semibold mb-4">Выручка по месяцам</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.revenueByMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="month" stroke="#888" fontSize={12} />
                    <YAxis stroke="#888" fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }}
                      formatter={(value: number) => [`${value.toLocaleString()} ₽`, 'Выручка']} />
                    <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Status Distribution */}
            <div className="bg-card rounded-xl border border-border p-4">
              <h3 className="font-semibold mb-4">Распределение по статусам</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {statusData.map(item => (
                  <div key={item.name} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }} />
                    <span className="text-muted-foreground">{item.name}: {item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Priority Distribution */}
            <div className="bg-card rounded-xl border border-border p-4">
              <h3 className="font-semibold mb-4">Распределение по приоритету</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={priorityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="name" stroke="#888" fontSize={12} />
                    <YAxis stroke="#888" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {priorityData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Team Workload */}
            <div className="bg-card rounded-xl border border-border p-4">
              <h3 className="font-semibold mb-4">Нагрузка команды</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.teamWorkload} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis type="number" stroke="#888" fontSize={12} />
                    <YAxis type="category" dataKey="name" stroke="#888" fontSize={12} width={60} />
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }} />
                    <Bar dataKey="active" fill="#f59e0b" name="Активные" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="completed" fill="#22c55e" name="Завершённые" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StatisticsPage;
