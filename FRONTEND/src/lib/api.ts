import type { 
  Order, 
  Client, 
  Stats, 
  Task, 
  Activity,
  User,
  Subtask,
  Comment,
  ServiceAccount,
  AccountCategory
} from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface ApiError {
  error: string;
  message: string;
  fields?: Record<string, string>;
}

// Helper to parse dates
function parseOrderDates(order: any): Order {
  return {
    ...order,
    dueDate: order.dueDate ? new Date(order.dueDate) : null,
    createdAt: new Date(order.createdAt),
    updatedAt: new Date(order.updatedAt),
  };
}

// ============ ORDERS API ============

export interface CreateOrderInput {
  title: string;
  description?: string | null;
  clientName?: string | null;
  amount?: number | null;
  priority?: 'high' | 'medium' | 'low';
  dueDate?: Date | null;
  tags?: string[];
  updatedBy: 'Никита' | 'Саня' | 'Ксюша';
}

export interface UpdateOrderInput {
  title?: string;
  description?: string | null;
  clientName?: string | null;
  amount?: number | null;
  priority?: 'high' | 'medium' | 'low';
  status?: 'new' | 'in_progress' | 'review' | 'completed' | 'rejected';
  dueDate?: string | null;
  tags?: string[];
  assignedTo?: ('Никита' | 'Саня' | 'Ксюша')[];
  updatedBy: 'Никита' | 'Саня' | 'Ксюша';
}

export async function fetchOrders(): Promise<Order[]> {
  const response = await fetch(`${API_BASE_URL}/api/orders`);
  if (!response.ok) throw new Error('Failed to fetch orders');
  const orders = await response.json();
  return orders.map(parseOrderDates);
}

export async function fetchOrder(id: string): Promise<Order> {
  const response = await fetch(`${API_BASE_URL}/api/orders/${id}`);
  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to fetch order');
  }
  return parseOrderDates(await response.json());
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const response = await fetch(`${API_BASE_URL}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to create order');
  }
  return parseOrderDates(await response.json());
}

export async function updateOrder(id: string, input: UpdateOrderInput): Promise<Order> {
  const response = await fetch(`${API_BASE_URL}/api/orders/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to update order');
  }
  return parseOrderDates(await response.json());
}

export async function deleteOrder(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/orders/${id}`, { method: 'DELETE' });
  if (!response.ok && response.status !== 204) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to delete order');
  }
}


// ============ CLIENTS API ============

export interface ClientSummary {
  clientName: string;
  totalOrders: number;
  totalAmount: number;
  lastOrderDate: string | null;
}

export interface ClientStats {
  clientName: string;
  totalOrders: number;
  totalAmount: number;
  averageOrderValue: number;
  orderFrequencyDays: number | null;
  completedOrders: number;
  activeOrders: number;
}

export interface ClientOrder {
  id: string;
  orderNumber: number;
  title: string;
  description: string | null;
  status: 'new' | 'in_progress' | 'review' | 'completed' | 'rejected';
  amount: number | null;
  createdAt: string;
  dueDate: string | null;
  assignedTo: ('Никита' | 'Саня' | 'Ксюша')[];
}

export async function fetchClients(search?: string): Promise<ClientSummary[]> {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  const url = `${API_BASE_URL}/api/clients${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch clients');
  return response.json();
}

export async function fetchClientStats(clientName: string): Promise<ClientStats> {
  const response = await fetch(`${API_BASE_URL}/api/clients/${encodeURIComponent(clientName)}`);
  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to fetch client stats');
  }
  return response.json();
}

export async function fetchClientOrders(clientName: string): Promise<ClientOrder[]> {
  const response = await fetch(`${API_BASE_URL}/api/clients/${encodeURIComponent(clientName)}/orders`);
  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to fetch client orders');
  }
  return response.json();
}

// ============ TASKS API ============

export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type ParticipantName = 'Никита' | 'Саня' | 'Ксюша';

export interface DashboardTask {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  position: number;
  assignedTo: ParticipantName | null;
  dueDate: Date | null;
  orderId: string | null;
  createdBy: ParticipantName;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTaskInput {
  title: string;
  description?: string | null;
  status?: TaskStatus;
  assignedTo?: ParticipantName | null;
  dueDate?: Date | null;
  orderId?: string | null;
  createdBy: ParticipantName;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  assignedTo?: ParticipantName | null;
  dueDate?: Date | null;
  orderId?: string | null;
}

export async function fetchTasks(filter?: { status?: TaskStatus; assignedTo?: ParticipantName }): Promise<DashboardTask[]> {
  const params = new URLSearchParams();
  if (filter?.status) params.set('status', filter.status);
  if (filter?.assignedTo) params.set('assignedTo', filter.assignedTo);
  const url = `${API_BASE_URL}/api/tasks${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch tasks');
  return response.json();
}

export async function createTask(input: CreateTaskInput): Promise<DashboardTask> {
  const response = await fetch(`${API_BASE_URL}/api/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to create task');
  }
  return response.json();
}

export async function updateTask(id: string, input: UpdateTaskInput): Promise<DashboardTask> {
  const response = await fetch(`${API_BASE_URL}/api/tasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to update task');
  }
  return response.json();
}

export async function moveTask(id: string, status: TaskStatus, position: number): Promise<DashboardTask> {
  const response = await fetch(`${API_BASE_URL}/api/tasks/${id}/move`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, position }),
  });
  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to move task');
  }
  return response.json();
}

export async function deleteTask(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/tasks/${id}`, { method: 'DELETE' });
  if (!response.ok && response.status !== 204) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to delete task');
  }
}

// ============ STATISTICS API ============

export interface StatisticsData {
  totalOrders: number;
  completedOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  ordersByStatus: Record<string, number>;
  ordersByPriority: Record<string, number>;
  revenueByMonth: { month: string; revenue: number }[];
  teamWorkload: { name: string; active: number; completed: number }[];
}

export async function fetchStatistics(period?: string): Promise<StatisticsData> {
  const params = period ? `?period=${period}` : '';
  const response = await fetch(`${API_BASE_URL}/api/statistics${params}`);
  if (!response.ok) throw new Error('Failed to fetch statistics');
  return response.json();
}

// ============ ACTIVITY API ============

export interface ActivityEntry {
  id: string;
  type: 'order_created' | 'order_updated' | 'status_changed' | 'comment_added' | 'task_created' | 'task_completed';
  actor: ParticipantName;
  orderId: string | null;
  orderTitle: string | null;
  taskId: string | null;
  taskTitle: string | null;
  details: string | null;
  createdAt: string;
}

export async function fetchActivity(limit: number = 50): Promise<ActivityEntry[]> {
  const response = await fetch(`${API_BASE_URL}/api/activity?limit=${limit}`);
  if (!response.ok) throw new Error('Failed to fetch activity');
  return response.json();
}

// ============ ARCHIVE API ============

export interface ArchivedOrder extends Order {
  completedAt: Date;
  totalComments: number;
  participants: ParticipantName[];
}

export interface ArchiveFilters {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  participant?: ParticipantName;
  status?: 'completed' | 'rejected';
  limit?: number;
  offset?: number;
}

export async function fetchArchivedOrders(filters: ArchiveFilters = {}): Promise<ArchivedOrder[]> {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
  if (filters.dateTo) params.set('dateTo', filters.dateTo);
  if (filters.participant) params.set('participant', filters.participant);
  if (filters.status) params.set('status', filters.status);
  if (filters.limit) params.set('limit', filters.limit.toString());
  if (filters.offset) params.set('offset', filters.offset.toString());
  const url = `${API_BASE_URL}/api/orders/archive${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch archived orders');
  return response.json();
}

// ============ ACCOUNTS API ============

export interface ServiceAccountData {
  id: string;
  serviceName: string;
  serviceUrl: string | null;
  username: string;
  password: string;
  notes: string | null;
  categoryId: string | null;
  category: AccountCategoryData | null;
  createdBy: ParticipantName;
  createdAt: Date;
  updatedAt: Date;
}

export interface AccountCategoryData {
  id: string;
  name: string;
  icon: string;
  color: string;
  createdAt: Date;
}

export async function fetchAccounts(params: { search?: string; categoryId?: string } = {}): Promise<ServiceAccountData[]> {
  const searchParams = new URLSearchParams();
  if (params.search) searchParams.set('search', params.search);
  if (params.categoryId) searchParams.set('categoryId', params.categoryId);
  const url = `${API_BASE_URL}/api/accounts${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch accounts');
  return response.json();
}

export async function fetchAccountCategories(): Promise<AccountCategoryData[]> {
  const response = await fetch(`${API_BASE_URL}/api/accounts/categories`);
  if (!response.ok) throw new Error('Failed to fetch account categories');
  return response.json();
}

// ============ USERS API ============

export async function fetchUsers(): Promise<User[]> {
  const response = await fetch(`${API_BASE_URL}/api/users`);
  if (!response.ok) throw new Error('Failed to fetch users');
  return response.json();
}

// ============ CALENDAR API ============

export interface CalendarSubtask {
  id: string;
  orderId: string;
  orderNumber: number;
  orderTitle: string;
  subtaskNumber: number;
  title: string;
  status: string;
  assignedTo: ParticipantName | null;
  dueDate: string;
}

export async function fetchCalendarSubtasks(month: number, year: number): Promise<CalendarSubtask[]> {
  const response = await fetch(`${API_BASE_URL}/api/calendar?month=${month}&year=${year}`);
  if (!response.ok) throw new Error('Failed to fetch calendar subtasks');
  return response.json();
}
