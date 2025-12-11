export type OrderStatus = 'new' | 'in_progress' | 'review' | 'completed' | 'rejected';
export type Priority = 'high' | 'medium' | 'low';
export type ParticipantName = 'Никита' | 'Саня' | 'Ксюша';
export type SubtaskStatus = 'planning' | 'development' | 'review' | 'completed' | 'archived';

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
  createdAt: Date;
  updatedAt: Date;
}

export interface Reactions {
  [emoji: string]: ParticipantName[];
}

export interface Attachment {
  id: string;
  filename: string;
  fileSize: number;
  fileUrl: string;
  uploadedBy: ParticipantName;
  uploadedAt: Date;
}

export interface Comment {
  id: string;
  orderId: string;
  subtaskId: string | null;
  author: ParticipantName;
  content: string;
  isSystem: boolean;
  parentId: string | null;
  reactions: Reactions;
  attachments: Attachment[];
  createdAt: Date;
  updatedAt: Date | null;
  editedAt: Date | null;
}


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

// Dashboard Task types for Trello-style board
export type TaskStatus = 'todo' | 'in_progress' | 'done';

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

// Account Vault types
export interface AccountCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  createdAt: Date;
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
