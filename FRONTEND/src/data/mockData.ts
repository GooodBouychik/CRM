import type { User, Order, Client, Deadline, Stats, Task, Activity, ParticipantName } from '@/types';

export const users: User[] = [
  { id: '1', name: 'Никита', avatar: '🦊', color: 'from-orange-400 to-orange-600' },
  { id: '2', name: 'Ксюша', avatar: '🦋', color: 'from-purple-400 to-pink-500' },
  { id: '3', name: 'Саня', avatar: '🐺', color: 'from-cyan-400 to-blue-500' },
];

export const userStyles: Record<ParticipantName, { gradient: string; emoji: string }> = {
  'Никита': { gradient: 'from-orange-500 to-amber-500', emoji: '🦊' },
  'Ксюша': { gradient: 'from-violet-500 to-purple-500', emoji: '🦋' },
  'Саня': { gradient: 'from-cyan-500 to-blue-500', emoji: '🐺' },
};

// Mock orders for fallback when API is unavailable
export const mockOrders: Order[] = [
  { 
    id: '1', 
    orderNumber: 11, 
    title: 'Медитатион', 
    description: null,
    clientName: 'Закир', 
    amount: 25000, 
    status: 'completed', 
    priority: 'medium', 
    dueDate: new Date('2025-01-01'),
    tags: [],
    assignedTo: ['Саня'],
    isFavorite: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    updatedBy: 'Саня'
  },
  { 
    id: '2', 
    orderNumber: 12, 
    title: 'Быстрой', 
    description: null,
    clientName: 'Станислав Анатольевич', 
    amount: 40000, 
    status: 'completed', 
    priority: 'medium', 
    dueDate: new Date('2024-12-20'),
    tags: ['+дальнейшее продвижение'],
    assignedTo: ['Саня'],
    isFavorite: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    updatedBy: 'Саня'
  },
  { 
    id: '3', 
    orderNumber: 10, 
    title: 'Верстка для фотобудки', 
    description: null,
    clientName: 'Павел', 
    amount: 20000, 
    status: 'new', 
    priority: 'high', 
    dueDate: new Date('2024-12-23'),
    tags: [],
    assignedTo: [],
    isFavorite: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    updatedBy: 'Никита'
  },
];

export const clients: Client[] = [
  { id: '1', name: 'Станислав Анатольевич', ordersCount: 1, totalAmount: 40000, lastOrderDate: '13 дек. 2025 г.', color: 'bg-orange-500' },
  { id: '2', name: 'Закир', ordersCount: 1, totalAmount: 25000, lastOrderDate: '13 дек. 2025 г.', color: 'bg-green-500' },
  { id: '3', name: 'Павел', ordersCount: 1, totalAmount: 20000, lastOrderDate: '13 дек. 2025 г.', color: 'bg-pink-500' },
  { id: '4', name: 'Алексей', ordersCount: 1, totalAmount: 50000, lastOrderDate: '13 дек. 2025 г.', color: 'bg-purple-500' },
  { id: '5', name: 'Марат', ordersCount: 1, totalAmount: 90000, lastOrderDate: '13 дек. 2025 г.', color: 'bg-blue-500' },
  { id: '6', name: 'Дмитрий', ordersCount: 1, totalAmount: 45000, lastOrderDate: '13 дек. 2025 г.', color: 'bg-cyan-500' },
  { id: '7', name: 'Эльмар', ordersCount: 1, totalAmount: 150000, lastOrderDate: '13 дек. 2025 г.', color: 'bg-yellow-500' },
];

export const deadlines: Deadline[] = [
  { id: '1', date: '23', month: 'ДЕК', daysLeft: 10, title: 'Верстка для фотобудки', isUrgent: true },
  { id: '2', date: '30', month: 'ДЕК', daysLeft: 17, title: 'Виза центр', isUrgent: true },
  { id: '3', date: '1', month: 'ЯНВ', daysLeft: 19, title: '16kzn', isUrgent: true },
  { id: '4', date: '1', month: 'ЯНВ', daysLeft: 19, title: 'Autu-match', isUrgent: true },
];

export const stats: Stats = {
  totalOrders: 7,
  urgent: 0,
  completedToday: 3,
  inProgress: 0,
  weeklyCompleted: 3,
  weeklyCreated: 7,
  dailyAverage: 0.4,
};

export const initialTasks: Task[] = [
  { id: '1', title: 'Проверить макет сайта', status: 'todo', priority: 'high' },
  { id: '2', title: 'Созвон с Закиром', status: 'todo', priority: 'medium' },
  { id: '3', title: 'Написать ТЗ', status: 'in_progress', priority: 'high' },
  { id: '4', title: 'Правки по дизайну', status: 'in_progress', priority: 'low' },
  { id: '5', title: 'Отправить счет', status: 'done', priority: 'medium' },
];

export const activities: Activity[] = [
  { id: '1', type: 'order_completed', title: 'Заказ завершён', description: 'Медитатион #011', time: '16:01', user: 'Саня' },
  { id: '2', type: 'order_completed', title: 'Заказ завершён', description: 'Быстрой #012', time: '16:01', user: 'Саня' },
  { id: '3', type: 'order_created', title: 'Новый заказ', description: 'Autu-match #006', time: '15:55', user: 'Никита' },
  { id: '4', type: 'client_added', title: 'Новый клиент', description: 'Эльмар добавлен', time: '15:50', user: 'Никита' },
  { id: '5', type: 'task_done', title: 'Задача выполнена', description: 'Отправить счет', time: '14:30', user: 'Ксюша' },
];
