export type ParticipantName = 'Никита' | 'Саня' | 'Ксюша';
export type OrderStatus = 'new' | 'in_progress' | 'review' | 'completed' | 'rejected';
export type Priority = 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type SubtaskStatus = 'planning' | 'development' | 'review' | 'completed' | 'archived';

export interface User {
  id: string;
  name: ParticipantName;
  avatar: string;
  color: string;
  avatarColor?: string;
  telegramId?: number | null;
  telegramUsername?: string | null;
  email?: string | null;
}

export interface Order {
  id: string;
  orderNumber: number;
  title: string;
  description: string | null;
  clientName: string | null;
  amount: number | null;
  status: OrderStatus;
  priority: Priority;
  dueDate: Date | null;
  tags: string[];
  assignedTo: ParticipantName[];
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
  updatedBy: ParticipantName;
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  assignedTo?: ParticipantName | null;
  dueDate?: Date | null;
  priority?: Priority;
  position?: number;
  orderId?: string | null;
  createdBy?: ParticipantName;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Subtask {
  id: string;
  orderId: string;
  subtaskNumber: number;
  title: string;
  description: string | null;
  status: SubtaskStatus;
  assignedTo: ParticipantName | null;
  estimatedHours: number | null;
  position: number;
  isPinned: boolean;
  dueDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Client {
  id?: string;
  name: string;
  clientName?: string;
  ordersCount?: number;
  totalOrders?: number;
  totalAmount: number;
  lastOrderDate?: string | null;
  color?: string;
  averageOrderValue?: number;
  completedOrders?: number;
  activeOrders?: number;
}

export interface Deadline {
  id: string;
  date: string;
  month: string;
  daysLeft: number;
  title: string;
  isUrgent: boolean;
  orderId?: string;
}

export interface Stats {
  totalOrders: number;
  urgent: number;
  completedToday: number;
  inProgress: number;
  weeklyCompleted: number;
  weeklyCreated: number;
  dailyAverage: number;
  totalRevenue?: number;
  averageOrderValue?: number;
}

export interface Activity {
  id: string;
  type: 'order_created' | 'order_completed' | 'order_updated' | 'status_changed' | 'comment_added' | 'task_created' | 'task_completed' | 'client_added' | 'task_done';
  title: string;
  description: string;
  time: string;
  user: string;
  actor?: ParticipantName;
  orderId?: string | null;
  orderTitle?: string | null;
  taskId?: string | null;
  taskTitle?: string | null;
  details?: string | null;
  createdAt?: string;
}

export interface Comment {
  id: string;
  orderId: string;
  subtaskId: string | null;
  author: ParticipantName;
  content: string;
  isSystem: boolean;
  parentId: string | null;
  reactions: Record<string, ParticipantName[]>;
  attachments: Attachment[];
  createdAt: Date;
  updatedAt: Date | null;
  editedAt: Date | null;
}

export interface Attachment {
  id: string;
  filename: string;
  fileSize: number;
  fileUrl: string;
  uploadedBy: ParticipantName;
  uploadedAt: Date;
}

export interface ServiceAccount {
  id: string;
  serviceName: string;
  serviceUrl: string | null;
  username: string;
  password: string;
  notes: string | null;
  categoryId: string | null;
  category: AccountCategory | null;
  createdBy: ParticipantName;
  createdAt: Date;
  updatedAt: Date;
}

export interface AccountCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  createdAt: Date;
}
