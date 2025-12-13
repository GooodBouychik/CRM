import type { Order, Priority, Subtask, SubtaskStatus, ParticipantName, Comment, Reactions } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface CreateOrderInput {
  title: string;
  description?: string | null;
  clientName?: string | null;
  amount?: number | null;
  priority?: Priority;
  dueDate?: Date | null;
  tags?: string[];
  updatedBy: 'Никита' | 'Саня' | 'Ксюша';
}

export interface ApiError {
  error: string;
  message: string;
  fields?: Record<string, string>;
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const response = await fetch(`${API_BASE_URL}/api/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to create order');
  }

  const order = await response.json();
  return parseOrderDates(order);
}

function parseOrderDates(order: any): Order {
  return {
    ...order,
    dueDate: order.dueDate ? new Date(order.dueDate) : null,
    createdAt: new Date(order.createdAt),
    updatedAt: new Date(order.updatedAt),
  };
}

export async function fetchOrders(): Promise<Order[]> {
  const response = await fetch(`${API_BASE_URL}/api/orders`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch orders');
  }

  const orders = await response.json();
  return orders.map(parseOrderDates);
}

export async function getUniqueClients(): Promise<string[]> {
  const orders = await fetchOrders();
  const clients = orders
    .map(o => o.clientName)
    .filter((name): name is string => name !== null && name.trim() !== '');
  return Array.from(new Set(clients)).sort((a, b) => a.localeCompare(b, 'ru'));
}

export async function fetchOrder(id: string): Promise<Order> {
  const response = await fetch(`${API_BASE_URL}/api/orders/${id}`);
  
  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to fetch order');
  }

  const order = await response.json();
  return parseOrderDates(order);
}

export interface UpdateOrderInput {
  title?: string;
  description?: string | null;
  clientName?: string | null;
  amount?: number | null;
  priority?: Priority;
  status?: 'new' | 'in_progress' | 'review' | 'completed' | 'rejected';
  dueDate?: string | null;
  tags?: string[];
  assignedTo?: ('Никита' | 'Саня' | 'Ксюша')[];
  updatedBy: 'Никита' | 'Саня' | 'Ксюша';
}

export async function updateOrder(id: string, input: UpdateOrderInput): Promise<Order> {
  const response = await fetch(`${API_BASE_URL}/api/orders/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to update order');
  }

  const order = await response.json();
  return parseOrderDates(order);
}

// Attachment types and API
export interface Attachment {
  id: string;
  filename: string;
  fileSize: number;
  fileUrl: string;
  uploadedBy: 'Никита' | 'Саня' | 'Ксюша';
  uploadedAt: string;
}

export async function fetchAttachments(orderId: string): Promise<Attachment[]> {
  const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/attachments`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch attachments');
  }

  return response.json();
}

export async function uploadAttachment(
  orderId: string,
  file: File,
  uploadedBy: 'Никита' | 'Саня' | 'Ксюша'
): Promise<Attachment> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/attachments`, {
    method: 'POST',
    headers: {
      'X-Uploaded-By': uploadedBy,
    },
    body: formData,
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to upload attachment');
  }

  return response.json();
}

export async function deleteAttachment(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/attachments/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok && response.status !== 204) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to delete attachment');
  }
}

export function getAttachmentUrl(fileUrl: string): string {
  return `${API_BASE_URL}${fileUrl}`;
}

// Subtask types and API

export interface CreateSubtaskInput {
  title: string;
  description?: string | null;
  status?: SubtaskStatus;
  assignedTo?: ParticipantName | null;
  estimatedHours?: number | null;
  position?: number;
  isPinned?: boolean;
}

export interface UpdateSubtaskInput {
  title?: string;
  description?: string | null;
  status?: SubtaskStatus;
  assignedTo?: ParticipantName | null;
  estimatedHours?: number | null;
  position?: number;
  isPinned?: boolean;
}

export interface MoveSubtaskInput {
  status: SubtaskStatus;
  position?: number;
}

export async function fetchSubtasks(orderId: string): Promise<Subtask[]> {
  const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/subtasks`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch subtasks');
  }

  return response.json();
}

export async function createSubtask(orderId: string, input: CreateSubtaskInput): Promise<Subtask> {
  const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/subtasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to create subtask');
  }

  return response.json();
}

export async function updateSubtask(id: string, input: UpdateSubtaskInput): Promise<Subtask> {
  const response = await fetch(`${API_BASE_URL}/api/subtasks/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to update subtask');
  }

  return response.json();
}

export async function moveSubtask(id: string, input: MoveSubtaskInput): Promise<Subtask> {
  const response = await fetch(`${API_BASE_URL}/api/subtasks/${id}/move`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to move subtask');
  }

  return response.json();
}

export async function deleteSubtask(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/subtasks/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok && response.status !== 204) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to delete subtask');
  }
}


// Comment types and API

export interface CreateCommentInput {
  author: ParticipantName;
  content: string;
  isSystem?: boolean;
  parentId?: string | null;
}

export interface UpdateCommentInput {
  content: string;
}

export interface ToggleReactionInput {
  emoji: string;
  participant: ParticipantName;
}

export interface CommentFilterParams {
  limit?: number;
  offset?: number;
  parentId?: string | null;
  author?: ParticipantName;
  isSystem?: boolean;
}

export interface CommentsResponse {
  comments: Comment[];
  total: number;
  limit: number;
  offset: number;
}

export async function fetchComments(orderId: string, params: CommentFilterParams = {}): Promise<CommentsResponse> {
  const searchParams = new URLSearchParams();
  if (params.limit !== undefined) searchParams.set('limit', params.limit.toString());
  if (params.offset !== undefined) searchParams.set('offset', params.offset.toString());
  if (params.parentId !== undefined) searchParams.set('parentId', params.parentId ?? '');
  if (params.author) searchParams.set('author', params.author);
  if (params.isSystem !== undefined) searchParams.set('isSystem', params.isSystem.toString());

  const url = `${API_BASE_URL}/api/orders/${orderId}/comments?${searchParams.toString()}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error('Failed to fetch comments');
  }

  return response.json();
}

export async function createComment(orderId: string, input: CreateCommentInput): Promise<Comment> {
  const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to create comment');
  }

  return response.json();
}

export async function updateComment(commentId: string, input: UpdateCommentInput): Promise<Comment> {
  const response = await fetch(`${API_BASE_URL}/api/comments/${commentId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to update comment');
  }

  return response.json();
}

export async function deleteComment(commentId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/comments/${commentId}`, {
    method: 'DELETE',
  });

  if (!response.ok && response.status !== 204) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to delete comment');
  }
}

export async function toggleReaction(commentId: string, input: ToggleReactionInput): Promise<Comment> {
  const response = await fetch(`${API_BASE_URL}/api/comments/${commentId}/reactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to toggle reaction');
  }

  return response.json();
}


// Presence types and API
export interface PresenceData {
  name: ParticipantName;
  isOnline: boolean;
  currentOrderId: string | null;
  lastActivity: Date;
}

export async function fetchPresence(): Promise<PresenceData[]> {
  const response = await fetch(`${API_BASE_URL}/api/presence`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch presence');
  }

  return response.json();
}

export async function fetchOrderViewers(orderId: string): Promise<ParticipantName[]> {
  const response = await fetch(`${API_BASE_URL}/api/presence/order/${orderId}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch order viewers');
  }

  return response.json();
}


// User types and API
export interface UserPreferences {
  notifications: {
    newOrder: boolean;
    comments: boolean;
    statusChanges: boolean;
    mentions: boolean;
    deadlineReminders: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  dailyDigest: {
    enabled: boolean;
    time: string;
  };
}

export interface User {
  id: string;
  name: ParticipantName;
  avatarColor: string;
  telegramId: number | null;
  telegramUsername: string | null;
  email: string | null;
  preferences: UserPreferences;
  lastSeen: Date;
}

export async function fetchUsers(): Promise<User[]> {
  const response = await fetch(`${API_BASE_URL}/api/users`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }

  return response.json();
}

export async function fetchUser(name: ParticipantName): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/api/users/${encodeURIComponent(name)}`);
  
  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to fetch user');
  }

  return response.json();
}

export async function fetchUserPreferences(name: ParticipantName): Promise<UserPreferences> {
  const response = await fetch(`${API_BASE_URL}/api/users/${encodeURIComponent(name)}/preferences`);
  
  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to fetch user preferences');
  }

  return response.json();
}

export interface UpdatePreferencesInput {
  notifications?: Partial<UserPreferences['notifications']>;
  quietHours?: Partial<UserPreferences['quietHours']>;
  dailyDigest?: Partial<UserPreferences['dailyDigest']>;
}

export async function updateUserPreferences(
  name: ParticipantName,
  preferences: UpdatePreferencesInput
): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/api/users/${encodeURIComponent(name)}/preferences`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(preferences),
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to update user preferences');
  }

  return response.json();
}


// Order History types and API (Requirements 10.2, 10.3)
export interface OrderHistoryEntry {
  id: string;
  orderId: string;
  changedBy: ParticipantName;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  changedAt: string;
}

export async function fetchOrderHistory(orderId: string): Promise<OrderHistoryEntry[]> {
  const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/history`);
  
  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to fetch order history');
  }

  return response.json();
}


// Dashboard Task types and API
import type { DashboardTask, TaskStatus } from '@/types';

export interface CreateDashboardTaskInput {
  title: string;
  description?: string | null;
  status?: TaskStatus;
  assignedTo?: ParticipantName | null;
  dueDate?: Date | null;
  orderId?: string | null;
  createdBy: ParticipantName;
}

export interface UpdateDashboardTaskInput {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  assignedTo?: ParticipantName | null;
  dueDate?: Date | null;
  orderId?: string | null;
}

export interface MoveDashboardTaskInput {
  status: TaskStatus;
  position: number;
}

export async function fetchDashboardTasks(filter?: { status?: TaskStatus; assignedTo?: ParticipantName }): Promise<DashboardTask[]> {
  const params = new URLSearchParams();
  if (filter?.status) params.set('status', filter.status);
  if (filter?.assignedTo) params.set('assignedTo', filter.assignedTo);
  
  const url = `${API_BASE_URL}/api/tasks${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error('Failed to fetch tasks');
  }

  return response.json();
}

export async function createDashboardTask(input: CreateDashboardTaskInput): Promise<DashboardTask> {
  const response = await fetch(`${API_BASE_URL}/api/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to create task');
  }

  return response.json();
}

export async function updateDashboardTask(id: string, input: UpdateDashboardTaskInput): Promise<DashboardTask> {
  const response = await fetch(`${API_BASE_URL}/api/tasks/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to update task');
  }

  return response.json();
}

export async function moveDashboardTask(id: string, input: MoveDashboardTaskInput): Promise<DashboardTask> {
  const response = await fetch(`${API_BASE_URL}/api/tasks/${id}/move`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to move task');
  }

  return response.json();
}

export async function deleteDashboardTask(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/tasks/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok && response.status !== 204) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to delete task');
  }
}


// Archive types and API
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

export interface ArchiveDetailResponse {
  order: ArchivedOrder;
  comments: Comment[];
  history: OrderHistoryEntry[];
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

  if (!response.ok) {
    throw new Error('Failed to fetch archived orders');
  }

  return response.json();
}

export async function fetchArchivedOrderDetail(id: string): Promise<ArchiveDetailResponse> {
  const response = await fetch(`${API_BASE_URL}/api/orders/archive/${id}`);

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to fetch archived order details');
  }

  return response.json();
}


// Service Account types and API
import type { ServiceAccount, AccountCategory } from '@/types';

export interface CreateServiceAccountInput {
  serviceName: string;
  serviceUrl?: string | null;
  username: string;
  password: string;
  notes?: string | null;
  categoryId?: string | null;
  createdBy: ParticipantName;
}

export interface UpdateServiceAccountInput {
  serviceName?: string;
  serviceUrl?: string | null;
  username?: string;
  password?: string;
  notes?: string | null;
  categoryId?: string | null;
}

export interface CreateAccountCategoryInput {
  name: string;
  icon?: string;
  color?: string;
}

export interface AccountSearchParams {
  search?: string;
  categoryId?: string;
}

export async function fetchAccounts(params: AccountSearchParams = {}): Promise<ServiceAccount[]> {
  const searchParams = new URLSearchParams();
  if (params.search) searchParams.set('search', params.search);
  if (params.categoryId) searchParams.set('categoryId', params.categoryId);

  const url = `${API_BASE_URL}/api/accounts${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Failed to fetch accounts');
  }

  return response.json();
}

export async function fetchAccountById(id: string): Promise<ServiceAccount> {
  const response = await fetch(`${API_BASE_URL}/api/accounts/${id}`);

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to fetch account');
  }

  return response.json();
}

export async function createAccount(input: CreateServiceAccountInput): Promise<ServiceAccount> {
  const response = await fetch(`${API_BASE_URL}/api/accounts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to create account');
  }

  return response.json();
}

export async function updateAccount(id: string, input: UpdateServiceAccountInput): Promise<ServiceAccount> {
  const response = await fetch(`${API_BASE_URL}/api/accounts/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to update account');
  }

  return response.json();
}

export async function deleteAccount(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/accounts/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok && response.status !== 204) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to delete account');
  }
}

export async function fetchAccountCategories(): Promise<AccountCategory[]> {
  const response = await fetch(`${API_BASE_URL}/api/accounts/categories`);

  if (!response.ok) {
    throw new Error('Failed to fetch account categories');
  }

  return response.json();
}

export async function createAccountCategory(input: CreateAccountCategoryInput): Promise<AccountCategory> {
  const response = await fetch(`${API_BASE_URL}/api/accounts/categories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to create category');
  }

  return response.json();
}


// Activity Feed types and API
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
  
  if (!response.ok) {
    throw new Error('Failed to fetch activity');
  }

  return response.json();
}


// Client types and API
// Requirements: 1.1, 1.2, 1.3, 2.1, 2.3, 3.1, 3.2, 3.3, 3.4

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
  assignedTo: ParticipantName[];
}

export interface ClientNote {
  id: string;
  clientName: string;
  content: string;
  author: ParticipantName;
  createdAt: string;
  updatedAt: string | null;
}

export async function fetchClients(search?: string): Promise<ClientSummary[]> {
  const params = new URLSearchParams();
  if (search) params.set('search', search);

  const url = `${API_BASE_URL}/api/clients${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Failed to fetch clients');
  }

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

export async function fetchClientNotes(clientName: string): Promise<ClientNote[]> {
  const response = await fetch(`${API_BASE_URL}/api/clients/${encodeURIComponent(clientName)}/notes`);

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to fetch client notes');
  }

  return response.json();
}

export interface CreateClientNoteInput {
  content: string;
  author: ParticipantName;
}

export async function createClientNote(clientName: string, input: CreateClientNoteInput): Promise<ClientNote> {
  const response = await fetch(`${API_BASE_URL}/api/clients/${encodeURIComponent(clientName)}/notes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to create note');
  }

  return response.json();
}

export async function updateClientNote(noteId: string, content: string): Promise<ClientNote> {
  const response = await fetch(`${API_BASE_URL}/api/client-notes/${noteId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to update note');
  }

  return response.json();
}

export async function deleteClientNote(noteId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/client-notes/${noteId}`, {
    method: 'DELETE',
  });

  if (!response.ok && response.status !== 204) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to delete note');
  }
}


// Order Journey types and API
// Requirements: 4.1, 4.2, 4.3, 4.4, 4.5

export interface OrderJourneyStep {
  status: 'new' | 'in_progress' | 'review' | 'completed' | 'rejected';
  changedBy: ParticipantName;
  changedAt: string;
  isCurrent: boolean;
}

export interface OrderJourney {
  orderId: string;
  steps: OrderJourneyStep[];
  createdAt: string;
  completedAt: string | null;
}

export async function fetchOrderJourney(orderId: string): Promise<OrderJourney | null> {
  const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/journey`);

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to fetch order journey');
  }

  return response.json();
}


// History types and API
// Requirements: 5.1, 5.2, 5.3, 5.4, 5.5

export interface HistoryFilters {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: 'new' | 'in_progress' | 'review' | 'completed' | 'rejected';
  clientName?: string;
}

export interface HistoryOrder extends Order {
  journey?: OrderJourneyStep[];
}

export async function fetchOrdersForHistory(filters: HistoryFilters = {}): Promise<HistoryOrder[]> {
  // Fetch all orders first
  const orders = await fetchOrders();
  
  // Apply client-side filtering
  let filteredOrders = [...orders];
  
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filteredOrders = filteredOrders.filter(order => 
      order.title.toLowerCase().includes(searchLower) ||
      order.clientName?.toLowerCase().includes(searchLower) ||
      String(order.orderNumber).includes(searchLower)
    );
  }
  
  if (filters.dateFrom) {
    const fromDate = new Date(filters.dateFrom);
    filteredOrders = filteredOrders.filter(order => 
      new Date(order.createdAt) >= fromDate
    );
  }
  
  if (filters.dateTo) {
    const toDate = new Date(filters.dateTo);
    toDate.setHours(23, 59, 59, 999);
    filteredOrders = filteredOrders.filter(order => 
      new Date(order.createdAt) <= toDate
    );
  }
  
  if (filters.status) {
    filteredOrders = filteredOrders.filter(order => order.status === filters.status);
  }
  
  if (filters.clientName) {
    filteredOrders = filteredOrders.filter(order => 
      order.clientName?.toLowerCase() === filters.clientName?.toLowerCase()
    );
  }
  
  // Sort by createdAt descending
  filteredOrders.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  
  return filteredOrders;
}


// Statistics types and API
// Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7

export interface MonthlyRevenue {
  month: string; // "2024-01"
  totalAmount: number;
  orderCount: number;
}

export interface TeamMemberWorkload {
  participant: ParticipantName;
  activeOrders: number;
  ordersByStatus: {
    new: number;
    in_progress: number;
    review: number;
    completed: number;
    rejected: number;
  };
  totalEstimatedHours: number;
}

export interface StatusDistribution {
  new: number;
  in_progress: number;
  review: number;
  completed: number;
  rejected: number;
}

export interface StatisticsOverview {
  statusDistribution: StatusDistribution;
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  rejectedOrders: number;
}

export async function fetchRevenueByMonth(from?: string, to?: string): Promise<MonthlyRevenue[]> {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);

  const url = `${API_BASE_URL}/api/statistics/revenue${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await fetch(url);

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to fetch revenue data');
  }

  return response.json();
}

export async function fetchTeamWorkload(): Promise<TeamMemberWorkload[]> {
  const response = await fetch(`${API_BASE_URL}/api/statistics/workload`);

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to fetch team workload');
  }

  return response.json();
}

export async function fetchStatisticsOverview(): Promise<StatisticsOverview> {
  const response = await fetch(`${API_BASE_URL}/api/statistics/overview`);

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to fetch statistics overview');
  }

  return response.json();
}


// Custom Fields types and API
// Requirements: 9.1, 9.2, 9.3, 9.4, 9.6

export type CustomFieldType = 'text' | 'select' | 'date' | 'number';

export interface CustomFieldDefinition {
  id: string;
  name: string;
  type: CustomFieldType;
  options: string[] | null;
  isRequired: boolean;
  position: number;
  createdAt: string;
}

export interface CustomFieldValue {
  id: string;
  orderId: string;
  fieldId: string;
  value: string;
  updatedAt: string;
}

export interface CustomFieldWithValue {
  field: CustomFieldDefinition;
  value: CustomFieldValue | null;
}

export interface CreateCustomFieldInput {
  name: string;
  type: CustomFieldType;
  options?: string[];
  isRequired?: boolean;
}

export interface UpdateCustomFieldInput {
  name?: string;
  type?: CustomFieldType;
  options?: string[] | null;
  isRequired?: boolean;
  position?: number;
}

export async function fetchCustomFields(): Promise<CustomFieldDefinition[]> {
  const response = await fetch(`${API_BASE_URL}/api/custom-fields`);

  if (!response.ok) {
    throw new Error('Failed to fetch custom fields');
  }

  return response.json();
}

export async function createCustomField(input: CreateCustomFieldInput): Promise<CustomFieldDefinition> {
  const response = await fetch(`${API_BASE_URL}/api/custom-fields`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to create custom field');
  }

  return response.json();
}

export async function updateCustomField(id: string, input: UpdateCustomFieldInput): Promise<CustomFieldDefinition> {
  const response = await fetch(`${API_BASE_URL}/api/custom-fields/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to update custom field');
  }

  return response.json();
}

export async function deleteCustomField(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/custom-fields/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok && response.status !== 204) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to delete custom field');
  }
}

export async function fetchOrderCustomFields(orderId: string): Promise<CustomFieldWithValue[]> {
  const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/custom-fields`);

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to fetch order custom fields');
  }

  return response.json();
}

export async function setOrderCustomFieldValue(
  orderId: string,
  fieldId: string,
  value: string
): Promise<CustomFieldValue> {
  const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/custom-fields/${fieldId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ value }),
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to set custom field value');
  }

  return response.json();
}


// Calendar types and API
// Requirements: 10.1, 10.2, 10.3, 10.4, 10.5

export interface CalendarSubtask {
  id: string;
  title: string;
  dueDate: string;
  assignedTo: ParticipantName | null;
  orderId: string;
  orderTitle: string;
  orderNumber: number;
  status: SubtaskStatus;
  estimatedHours: number | null;
}

export interface DayWorkload {
  date: string;
  subtaskCount: number;
  totalEstimatedHours: number;
  isOverloaded: boolean;
}

export async function fetchCalendarSubtasks(from: string, to: string): Promise<CalendarSubtask[]> {
  const params = new URLSearchParams();
  params.set('from', from);
  params.set('to', to);

  const url = `${API_BASE_URL}/api/calendar/subtasks?${params.toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to fetch calendar subtasks');
  }

  return response.json();
}

export async function fetchCalendarWorkload(from: string, to: string): Promise<DayWorkload[]> {
  const params = new URLSearchParams();
  params.set('from', from);
  params.set('to', to);

  const url = `${API_BASE_URL}/api/calendar/workload?${params.toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to fetch calendar workload');
  }

  return response.json();
}

export async function moveCalendarSubtask(subtaskId: string, newDate: string): Promise<CalendarSubtask> {
  const response = await fetch(`${API_BASE_URL}/api/calendar/subtasks/${subtaskId}/move`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ date: newDate }),
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to move subtask');
  }

  return response.json();
}


// Generic API helper for settings and other endpoints
export const api = {
  async get<T = unknown>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}/api${endpoint}`);
    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.message || 'Request failed');
    }
    return response.json();
  },

  async post<T = unknown>(endpoint: string, data?: unknown): Promise<T> {
    const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.message || 'Request failed');
    }
    return response.json();
  },

  async put<T = unknown>(endpoint: string, data?: unknown): Promise<T> {
    const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.message || 'Request failed');
    }
    return response.json();
  },

  async delete<T = unknown>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
      method: 'DELETE',
    });
    if (!response.ok && response.status !== 204) {
      const error: ApiError = await response.json();
      throw new Error(error.message || 'Request failed');
    }
    return response.json();
  },
};
