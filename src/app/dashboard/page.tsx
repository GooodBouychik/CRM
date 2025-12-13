'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useOrderStore } from '@/stores/orderStore';
import { useTaskStore, selectInProgressCount } from '@/stores/taskStore';
import { useUser } from '@/providers/UserProvider';
import { useNotificationBadge } from '@/hooks';
import { AppLayout } from '@/components/layout';
import { TaskBoard } from '@/components/tasks';
import { SkeletonKanbanColumn } from '@/components/ui/Skeleton';
import { DeadlinesWidget } from '@/components/dashboard/DeadlinesWidget';
import { StatsWidget } from '@/components/dashboard/StatsWidget';
import { categorizeOrders, type UnreadInfo } from '@/lib/dashboardUtils';
import { fetchOrders } from '@/lib/api';
import type { Order, DashboardTask, TaskStatus } from '@/types';

// Dashboard section component for orders
function DashboardSection({
  title,
  orders,
  colorClass,
  bgClass,
  onOrderClick,
}: {
  title: string;
  orders: Order[];
  colorClass: string;
  bgClass: string;
  onOrderClick: (order: Order) => void;
}) {
  if (orders.length === 0) {
    return (
      <div className={`rounded-2xl p-5 ${bgClass}`}>
        <h2 className={`text-lg font-semibold mb-3 ${colorClass}`}>{title}</h2>
        <div className="text-center py-6 animate-fade-in">
          <span className="text-3xl mb-2 block opacity-50">📋</span>
          <p className="text-gray-500 text-sm">Нет заказов</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl p-5 ${bgClass}`}>
      <h2 className={`text-lg font-semibold mb-4 ${colorClass}`}>
        {title} ({orders.length})
      </h2>
      <div className="space-y-2">
        {orders.map((order, index) => (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <DashboardOrderCard
              order={order}
              onClick={() => onOrderClick(order)}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}


// Order card for dashboard
function DashboardOrderCard({
  order,
  onClick,
}: {
  order: Order;
  onClick: () => void;
}) {
  const formatDate = (date: Date | null) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
    });
  };

  const priorityColors = {
    high: 'bg-red-500/20 text-red-400 border-red-500/30',
    medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    low: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };

  const statusLabels: Record<string, string> = {
    new: 'Новый',
    in_progress: 'В работе',
    review: 'На проверке',
    completed: 'Завершён',
    rejected: 'Отклонён',
  };

  return (
    <div
      onClick={onClick}
      className="bg-surface-100/50 backdrop-blur-sm rounded-xl p-4 border border-surface-200 cursor-pointer hover:border-surface-300 hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs text-gray-500 font-mono">
              #{String(order.orderNumber).padStart(3, '0')}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${priorityColors[order.priority]}`}>
              {order.priority === 'high' ? 'Высокий' : order.priority === 'medium' ? 'Средний' : 'Низкий'}
            </span>
          </div>
          <h3 className="font-medium text-gray-100 truncate">
            {order.title}
          </h3>
          {order.clientName && (
            <p className="text-sm text-gray-500 truncate mt-0.5">
              {order.clientName}
            </p>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <span className="text-xs text-gray-500">
            {statusLabels[order.status]}
          </span>
          {order.dueDate && (
            <p className="text-xs text-gray-500 mt-1">
              {formatDate(order.dueDate)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}


// Stats bar component
function QuickStats({ 
  totalOrders, 
  urgentCount, 
  completedToday, 
  inProgressCount 
}: { 
  totalOrders: number; 
  urgentCount: number; 
  completedToday: number; 
  inProgressCount: number;
}) {
  const stats = [
    { label: 'Всего', fullLabel: 'Всего заказов', value: totalOrders, icon: '📋', color: 'text-blue-400' },
    { label: 'Срочных', fullLabel: 'Срочных', value: urgentCount, icon: '🔥', color: 'text-red-400' },
    { label: 'Сегодня', fullLabel: 'Завершено сегодня', value: completedToday, icon: '✅', color: 'text-emerald-400' },
    { label: 'В работе', fullLabel: 'В работе', value: inProgressCount, icon: '⚡', color: 'text-amber-400' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="bg-surface-50 border border-surface-200 rounded-xl md:rounded-2xl p-3 md:p-4"
        >
          <div className="flex items-center gap-1.5 md:gap-2 mb-1">
            <span className="text-sm md:text-base">{stat.icon}</span>
            <span className="text-[10px] md:text-xs text-gray-500 truncate">
              <span className="hidden sm:inline">{stat.fullLabel}</span>
              <span className="sm:hidden">{stat.label}</span>
            </span>
          </div>
          <p className={`text-xl md:text-2xl font-bold ${stat.color}`}>{stat.value}</p>
        </motion.div>
      ))}
    </div>
  );
}


// Main Dashboard component
export default function Dashboard() {
  const router = useRouter();
  const { currentUser } = useUser();
  const { orders: ordersMap, selectOrder, setOrders } = useOrderStore();
  const orders = useMemo(() => Object.values(ordersMap), [ordersMap]);
  
  // Task store
  const { 
    tasks, 
    loading: tasksLoading, 
    fetchTasks, 
    createTask, 
    moveTask, 
    deleteTask 
  } = useTaskStore();
  const inProgressCount = useTaskStore(selectInProgressCount);

  // View mode
  const [viewMode, setViewMode] = useState<'tasks' | 'orders'>('tasks');
  const [showAllTasks, setShowAllTasks] = useState(false);

  // Unread info state
  const [unreadInfo] = useState<UnreadInfo>({
    mentions: [],
    replies: [],
  });

  // Fetch orders on mount to ensure stats are loaded immediately
  useEffect(() => {
    const loadOrders = async () => {
      try {
        const ordersData = await fetchOrders();
        setOrders(ordersData);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
      }
    };
    
    // Only fetch if orders are empty
    if (Object.keys(ordersMap).length === 0) {
      loadOrders();
    }
  }, [ordersMap, setOrders]);

  // Fetch tasks when user changes or showAllTasks changes
  useEffect(() => {
    if (currentUser) {
      if (showAllTasks) {
        fetchTasks();
      } else {
        fetchTasks({ assignedTo: currentUser });
      }
    }
  }, [currentUser, showAllTasks, fetchTasks]);

  // Categorize orders
  const categorizedOrders = useMemo(() => {
    if (!currentUser) return { urgent: [], inProgress: [], waiting: [] };
    return categorizeOrders(orders, currentUser, unreadInfo);
  }, [orders, currentUser, unreadInfo]);

  // Calculate stats
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const completedToday = orders.filter(o => {
      if (o.status !== 'completed') return false;
      const updated = new Date(o.updatedAt);
      updated.setHours(0, 0, 0, 0);
      return updated.getTime() === today.getTime();
    }).length;

    return {
      totalOrders: orders.length,
      urgentCount: categorizedOrders.urgent.length,
      completedToday,
      inProgressCount,
    };
  }, [orders, categorizedOrders, inProgressCount]);

  // Use notification badge hook
  useNotificationBadge({
    count: categorizedOrders.urgent.length,
    title: 'Dashboard - Team CRM',
    enableDesktopNotifications: true,
  });

  // Handle order click
  const handleOrderClick = useCallback((order: Order) => {
    selectOrder(order.id);
    router.push(`/orders/${order.id}`);
  }, [selectOrder, router]);

  // Task handlers
  const handleCreateTask = useCallback(async (status: TaskStatus, title: string, description?: string) => {
    if (currentUser) {
      await createTask(status, title, description, currentUser);
    }
  }, [createTask, currentUser]);

  const handleMoveTask = useCallback(async (taskId: string, newStatus: TaskStatus, newPosition: number) => {
    await moveTask(taskId, newStatus, newPosition);
  }, [moveTask]);

  const handleEditTask = useCallback((task: DashboardTask) => {
    console.log('Edit task:', task);
  }, []);

  const handleDeleteTask = useCallback(async (taskId: string) => {
    if (confirm('Удалить задачу?')) {
      await deleteTask(taskId);
    }
  }, [deleteTask]);

  const handleTaskClick = useCallback((task: DashboardTask) => {
    console.log('Task clicked:', task);
  }, []);

  if (!currentUser) return null;

  return (
    <AppLayout
      title={`Привет, ${currentUser}!`}
      subtitle="Твой дашборд"
      actions={
        <div className="flex items-center gap-2 md:gap-3 flex-wrap">
          {/* View mode toggle */}
          <div className="flex bg-surface-100 rounded-xl p-1">
            <button
              onClick={() => setViewMode('tasks')}
              className={`px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm rounded-lg transition-all duration-200 touch-manipulation ${
                viewMode === 'tasks'
                  ? 'bg-accent-500 text-white shadow-lg shadow-accent-500/25'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Задачи
            </button>
            <button
              onClick={() => setViewMode('orders')}
              className={`px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm rounded-lg transition-all duration-200 touch-manipulation ${
                viewMode === 'orders'
                  ? 'bg-accent-500 text-white shadow-lg shadow-accent-500/25'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Заказы
            </button>
          </div>
          
          {/* Show all tasks toggle */}
          {viewMode === 'tasks' && (
            <button
              onClick={() => setShowAllTasks(!showAllTasks)}
              className={`px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm rounded-xl border transition-all duration-200 touch-manipulation ${
                showAllTasks
                  ? 'bg-violet-500/20 border-violet-500/50 text-violet-400'
                  : 'bg-surface-100 border-surface-200 text-gray-400 hover:text-gray-200'
              }`}
            >
              <span className="hidden sm:inline">{showAllTasks ? '👥 Все задачи' : '👤 Мои задачи'}</span>
              <span className="sm:hidden">{showAllTasks ? '👥' : '👤'}</span>
            </button>
          )}
        </div>
      }
    >
      <div className="p-3 md:p-6 overflow-auto h-full">
        {/* Quick stats */}
        <QuickStats
          totalOrders={stats.totalOrders}
          urgentCount={stats.urgentCount}
          completedToday={stats.completedToday}
          inProgressCount={stats.inProgressCount}
        />

        <div className="mt-4 md:mt-6 grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Main content area */}
          <div className="lg:col-span-3">
            {viewMode === 'tasks' ? (
              <div className="h-[400px] md:h-[600px]">
                {tasksLoading ? (
                  <div className="flex gap-4 h-full">
                    <SkeletonKanbanColumn cards={3} />
                    <SkeletonKanbanColumn cards={2} />
                    <SkeletonKanbanColumn cards={1} />
                  </div>
                ) : (
                  <TaskBoard
                    tasks={tasks}
                    currentUser={currentUser}
                    onCreateTask={handleCreateTask}
                    onMoveTask={handleMoveTask}
                    onEditTask={handleEditTask}
                    onDeleteTask={handleDeleteTask}
                    onTaskClick={handleTaskClick}
                  />
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <DashboardSection
                  title="🔴 Срочные"
                  orders={categorizedOrders.urgent}
                  colorClass="text-red-400"
                  bgClass="bg-red-500/5 border border-red-500/20"
                  onOrderClick={handleOrderClick}
                />
                <DashboardSection
                  title="🔵 В работе"
                  orders={categorizedOrders.inProgress}
                  colorClass="text-blue-400"
                  bgClass="bg-blue-500/5 border border-blue-500/20"
                  onOrderClick={handleOrderClick}
                />
                <DashboardSection
                  title="🟡 Ожидание"
                  orders={categorizedOrders.waiting}
                  colorClass="text-amber-400"
                  bgClass="bg-amber-500/5 border border-amber-500/20"
                  onOrderClick={handleOrderClick}
                />
              </div>
            )}
          </div>

          {/* Sidebar widgets */}
          <div className="space-y-6">
            <DeadlinesWidget
              orders={orders}
              tasks={tasks}
              onOrderClick={handleOrderClick}
              onTaskClick={handleTaskClick}
            />
            <StatsWidget orders={orders} period="week" />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
