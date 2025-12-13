import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { User, Task, Deadline, ParticipantName } from '@/types';
import { fetchOrders, fetchTasks, createTask, moveTask as apiMoveTask, deleteTask as apiDeleteTask } from '@/lib/api';
import { stats, deadlines, activities, initialTasks } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ShoppingCart, Flame, CheckCircle, Zap, Plus, Calendar, BarChart3, X, GripVertical, Clock, User as UserIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface DashboardProps { user: User; }

const StatCard = ({ icon: Icon, label, value, iconColor, onClick }: { icon: React.ElementType; label: string; value: number | string; iconColor: string; onClick?: () => void; }) => (
  <div className={cn("bg-card rounded-xl p-4 border border-border hover:border-primary/30 transition-all duration-200", onClick && "cursor-pointer hover:scale-[1.02]")} onClick={onClick}>
    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2"><Icon className={cn("w-4 h-4", iconColor)} /><span>{label}</span></div>
    <p className={cn("text-2xl font-bold", iconColor)}>{value}</p>
  </div>
);

const DeadlineCard = ({ deadline }: { deadline: Deadline }) => (
  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-card transition-colors group cursor-pointer">
    <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-muted text-center">
      <span className="text-lg font-bold leading-none">{deadline.date}</span>
      <span className="text-[10px] text-muted-foreground uppercase">{deadline.month}</span>
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-muted-foreground mb-0.5">{deadline.daysLeft} дн.</p>
      <p className="text-sm font-medium truncate">{deadline.title}</p>
    </div>
    {deadline.isUrgent && <div className="w-2 h-2 rounded-full bg-destructive flex-shrink-0 animate-pulse" />}
  </div>
);

const ActivityItem = ({ activity }: { activity: typeof activities[0] }) => {
  const icons: Record<string, React.ElementType> = { order_created: ShoppingCart, order_completed: CheckCircle, client_added: UserIcon, task_done: CheckCircle };
  const colors: Record<string, string> = { order_created: 'text-primary', order_completed: 'text-success', client_added: 'text-purple-400', task_done: 'text-cyan-400' };
  const Icon = icons[activity.type] || ShoppingCart;
  return (
    <div className="flex items-start gap-3 py-2">
      <div className={cn("w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0", colors[activity.type] || 'text-primary')}><Icon className="w-4 h-4" /></div>
      <div className="flex-1 min-w-0"><p className="text-sm font-medium">{activity.title}</p><p className="text-xs text-muted-foreground truncate">{activity.description}</p></div>
      <div className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{activity.time}</div>
    </div>
  );
};

interface TaskColumnProps { title: string; status: Task['status']; tasks: Task[]; color: string; onAddTask: (s: Task['status']) => void; onMoveTask: (id: string, s: Task['status']) => void; onDeleteTask: (id: string) => void; isLoading?: boolean; }

const TaskColumn = ({ title, status, tasks, color, onAddTask, onMoveTask, onDeleteTask, isLoading }: TaskColumnProps) => {
  const filteredTasks = tasks.filter(t => t.status === status);
  const [dragOver, setDragOver] = useState(false);
  const priorityColors = { high: 'border-l-destructive', medium: 'border-l-warning', low: 'border-l-success' };
  return (
    <div className={cn("bg-card rounded-xl border border-border p-4 min-h-[200px] transition-colors", dragOver && "border-primary bg-primary/5")}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); const taskId = e.dataTransfer.getData('taskId'); if (taskId) onMoveTask(taskId, status); }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2"><div className={cn("w-2 h-2 rounded-full", color)} /><span className="text-sm font-medium">{title}</span><span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{filteredTasks.length}</span></div>
        <button className="text-muted-foreground hover:text-foreground transition-colors" onClick={() => onAddTask(status)}><Plus className="w-4 h-4" /></button>
      </div>
      {isLoading ? <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
       : filteredTasks.length === 0 ? <div className="text-center py-8"><p className="text-muted-foreground text-sm mb-2">Нет задач</p><button className="text-primary text-sm hover:underline" onClick={() => onAddTask(status)}>+ Добавить</button></div>
       : <div className="space-y-2">{filteredTasks.map(task => (
          <div key={task.id} draggable onDragStart={(e) => e.dataTransfer.setData('taskId', task.id)} className={cn("bg-muted rounded-lg p-3 text-sm hover:bg-accent transition-colors cursor-grab active:cursor-grabbing border-l-2 group relative", priorityColors[task.priority || 'medium'])}>
            <div className="flex items-start gap-2"><GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" /><span className="flex-1">{task.title}</span><button className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive" onClick={() => onDeleteTask(task.id)}><X className="w-4 h-4" /></button></div>
          </div>
        ))}</div>}
    </div>
  );
};

export default function Dashboard({ user }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'tasks' | 'orders' | 'myTasks'>('tasks');
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [showAddTask, setShowAddTask] = useState<Task['status'] | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const { data: orders = [], isLoading: ordersLoading } = useQuery({ queryKey: ['orders'], queryFn: fetchOrders, staleTime: 30000 });
  const { data: apiTasks, isLoading: tasksLoading } = useQuery({ queryKey: ['tasks'], queryFn: () => fetchTasks(), staleTime: 30000 });

  useEffect(() => { if (apiTasks && apiTasks.length > 0) setTasks(apiTasks.map(t => ({ ...t, priority: 'medium' as const }))); }, [apiTasks]);

  const calculatedStats = { totalOrders: orders.length, urgent: orders.filter(o => o.priority === 'high' && o.status !== 'completed').length, completedToday: orders.filter(o => o.status === 'completed' && new Date(o.updatedAt).toDateString() === new Date().toDateString()).length, inProgress: orders.filter(o => o.status === 'in_progress').length, weeklyCompleted: stats.weeklyCompleted, weeklyCreated: stats.weeklyCreated, dailyAverage: stats.dailyAverage };

  const orderDeadlines: Deadline[] = orders.filter(o => o.dueDate && o.status !== 'completed' && o.status !== 'rejected').map(o => { const dueDate = new Date(o.dueDate!); const daysLeft = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)); return { id: o.id, date: dueDate.getDate().toString(), month: dueDate.toLocaleDateString('ru', { month: 'short' }).toUpperCase().replace('.', ''), daysLeft, title: o.title, isUrgent: daysLeft <= 7 || o.priority === 'high', orderId: o.id }; }).sort((a, b) => a.daysLeft - b.daysLeft).slice(0, 5);

  const displayDeadlines = orderDeadlines.length > 0 ? orderDeadlines : deadlines;
  const handleAddTask = (status: Task['status']) => { setShowAddTask(status); setNewTaskTitle(''); };

  const handleSaveTask = async () => { if (!newTaskTitle.trim() || !showAddTask) return; try { const newTask = await createTask({ title: newTaskTitle, status: showAddTask, createdBy: user.name as ParticipantName }); setTasks([...tasks, { ...newTask, priority: 'medium' }]); toast.success('Задача добавлена'); } catch { setTasks([...tasks, { id: Date.now().toString(), title: newTaskTitle, status: showAddTask, priority: 'medium' }]); toast.success('Задача добавлена (локально)'); } setShowAddTask(null); setNewTaskTitle(''); };

  const handleMoveTask = async (taskId: string, newStatus: Task['status']) => { const statusLabels = { todo: 'К выполнению', in_progress: 'В работе', done: 'Готово' }; setTasks(tasks.map(task => task.id === taskId ? { ...task, status: newStatus } : task)); try { await apiMoveTask(taskId, newStatus, 0); } catch { } toast.success('Задача перемещена в ' + statusLabels[newStatus]); };

  const handleDeleteTask = async (taskId: string) => { setTasks(tasks.filter(task => task.id !== taskId)); try { await apiDeleteTask(taskId); } catch { } toast.success('Задача удалена'); };

  const myTasks = tasks.filter(t => t.status !== 'done');
  const recentOrders = orders.slice(0, 5);

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
      {showAddTask && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in"><div className="bg-card border border-border rounded-xl p-6 w-full max-w-md mx-4 animate-scale-in"><h3 className="text-lg font-semibold mb-4">Новая задача</h3><input type="text" placeholder="Название задачи..." value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSaveTask()} autoFocus className="w-full h-12 px-4 bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" /><div className="flex gap-3 mt-4"><Button variant="outline" onClick={() => setShowAddTask(null)} className="flex-1">Отмена</Button><Button onClick={handleSaveTask} className="flex-1">Добавить</Button></div></div></div>)}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"><div><p className="text-sm text-muted-foreground mb-1">Главная / Дашборд</p><h1 className="text-2xl lg:text-3xl font-bold">Привет, {user.name}!</h1><p className="text-muted-foreground text-sm mt-1">Твой дашборд</p></div><div className="flex gap-1 sm:gap-2 bg-card rounded-lg p-1 border border-border self-start overflow-x-auto">{[{ id: 'tasks', label: 'Задачи' }, { id: 'orders', label: 'Заказы' }, { id: 'myTasks', label: 'Мои задачи' }].map(tab => (<button key={tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)} className={cn("px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap", activeTab === tab.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>{tab.label}</button>))}</div></div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4"><StatCard icon={ShoppingCart} label="Всего заказов" value={calculatedStats.totalOrders} iconColor="text-foreground" /><StatCard icon={Flame} label="Срочных" value={calculatedStats.urgent} iconColor="text-destructive" /><StatCard icon={CheckCircle} label="Завершено сегодня" value={calculatedStats.completedToday} iconColor="text-success" /><StatCard icon={Zap} label="В работе" value={calculatedStats.inProgress} iconColor="text-warning" /></div>

      {activeTab === 'tasks' && (<div className="grid lg:grid-cols-3 gap-6"><div className="lg:col-span-2 space-y-4"><div className="grid sm:grid-cols-3 gap-4"><TaskColumn title="К выполнению" status="todo" tasks={tasks} color="bg-blue-500" onAddTask={handleAddTask} onMoveTask={handleMoveTask} onDeleteTask={handleDeleteTask} isLoading={tasksLoading} /><TaskColumn title="В работе" status="in_progress" tasks={tasks} color="bg-cyan-500" onAddTask={handleAddTask} onMoveTask={handleMoveTask} onDeleteTask={handleDeleteTask} isLoading={tasksLoading} /><TaskColumn title="Готово" status="done" tasks={tasks} color="bg-green-500" onAddTask={handleAddTask} onMoveTask={handleMoveTask} onDeleteTask={handleDeleteTask} isLoading={tasksLoading} /></div></div><div className="space-y-6"><div className="bg-card rounded-xl border border-border p-4"><div className="flex items-center gap-2 mb-4"><Calendar className="w-5 h-5 text-primary" /><h3 className="font-semibold">Ближайшие дедлайны</h3></div><div className="space-y-1">{displayDeadlines.map(deadline => <DeadlineCard key={deadline.id} deadline={deadline} />)}</div></div><div className="bg-card rounded-xl border border-border p-4"><div className="flex items-center gap-2 mb-4"><BarChart3 className="w-5 h-5 text-primary" /><h3 className="font-semibold">Статистика за неделю</h3></div><div className="grid grid-cols-3 gap-4 text-center"><div><p className="text-2xl font-bold text-success">{calculatedStats.weeklyCompleted}</p><p className="text-xs text-muted-foreground">Завершено</p></div><div><p className="text-2xl font-bold text-primary">{calculatedStats.weeklyCreated}</p><p className="text-xs text-muted-foreground">Создано</p></div><div><p className="text-2xl font-bold text-cyan-400">{calculatedStats.dailyAverage}</p><p className="text-xs text-muted-foreground">В день</p></div></div><div className="mt-4 h-16 flex items-end gap-1">{[40, 65, 45, 80, 55, 70, 50].map((height, i) => (<div key={i} className="flex-1 bg-gradient-to-t from-success/50 to-success rounded-t transition-all hover:from-success/70 hover:to-success cursor-pointer" style={{ height: height + '%' }} />))}</div></div></div></div>)}

      {activeTab === 'orders' && (<div className="grid lg:grid-cols-3 gap-6"><div className="lg:col-span-2 space-y-4"><div className="bg-card rounded-xl border border-border overflow-hidden"><div className="p-4 border-b border-border"><h3 className="font-semibold">Последние заказы</h3></div>{ordersLoading ? <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div> : (<div className="divide-y divide-border">{recentOrders.map(order => (<div key={order.id} className="p-4 hover:bg-accent/50 transition-colors cursor-pointer"><div className="flex items-start justify-between"><div><div className="flex items-center gap-2"><span className="text-xs text-muted-foreground font-mono">{'#' + String(order.orderNumber).padStart(3, '0')}</span><span className={cn("w-2 h-2 rounded-full", order.priority === 'high' ? 'bg-destructive' : order.priority === 'medium' ? 'bg-warning' : 'bg-success')} /></div><h4 className="font-medium mt-1">{order.title}</h4><p className="text-sm text-muted-foreground">{order.clientName || 'Без клиента'}</p></div><div className="text-right"><p className="font-semibold">{(order.amount || 0).toLocaleString()} руб</p><p className="text-xs text-muted-foreground">{order.dueDate ? new Date(order.dueDate).toLocaleDateString('ru', { day: 'numeric', month: 'short' }) : '-'}</p></div></div></div>))}</div>)}</div></div><div className="space-y-6"><div className="bg-card rounded-xl border border-border p-4"><div className="flex items-center gap-2 mb-4"><Zap className="w-5 h-5 text-primary" /><h3 className="font-semibold">Активность</h3></div><div className="space-y-1 divide-y divide-border">{activities.slice(0, 5).map(activity => <ActivityItem key={activity.id} activity={activity} />)}</div></div></div></div>)}

      {activeTab === 'myTasks' && (<div className="grid lg:grid-cols-3 gap-6"><div className="lg:col-span-2 space-y-4"><div className="bg-card rounded-xl border border-border overflow-hidden"><div className="p-4 border-b border-border flex items-center justify-between"><h3 className="font-semibold">Мои задачи ({myTasks.length})</h3><Button size="sm" onClick={() => handleAddTask('todo')}><Plus className="w-4 h-4 mr-1" />Добавить</Button></div>{myTasks.length === 0 ? <div className="p-8 text-center"><p className="text-muted-foreground">У вас нет активных задач</p></div> : (<div className="divide-y divide-border">{myTasks.map(task => (<div key={task.id} className="p-4 hover:bg-accent/50 transition-colors flex items-center gap-4"><button className="w-5 h-5 rounded-full border-2 border-muted-foreground hover:border-success hover:bg-success/20 transition-colors flex-shrink-0" onClick={() => handleMoveTask(task.id, 'done')} /><div className="flex-1 min-w-0"><p className="font-medium truncate">{task.title}</p><p className="text-xs text-muted-foreground capitalize">{task.status === 'todo' ? 'К выполнению' : 'В работе'}</p></div><span className={cn("w-2 h-2 rounded-full flex-shrink-0", task.priority === 'high' ? 'bg-destructive' : task.priority === 'medium' ? 'bg-warning' : 'bg-success')} /><button className="text-muted-foreground hover:text-destructive transition-colors" onClick={() => handleDeleteTask(task.id)}><X className="w-4 h-4" /></button></div>))}</div>)}</div></div><div className="space-y-6"><div className="bg-card rounded-xl border border-border p-4"><div className="flex items-center gap-2 mb-4"><Calendar className="w-5 h-5 text-primary" /><h3 className="font-semibold">Ближайшие дедлайны</h3></div><div className="space-y-1">{displayDeadlines.map(deadline => <DeadlineCard key={deadline.id} deadline={deadline} />)}</div></div></div></div>)}
    </div>
  );
}
