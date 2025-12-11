// Shared types for the server

export type ParticipantName = 'Никита' | 'Саня' | 'Ксюша';

export type OrderStatus = 'new' | 'in_progress' | 'review' | 'completed' | 'rejected';

export type Priority = 'high' | 'medium' | 'low';

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

export interface TelegramNotification {
  id: string;
  userId: string;
  notificationType: string;
  payload: Record<string, unknown>;
  sentAt: Date | null;
  status: 'pending' | 'sent' | 'failed';
  createdAt: Date;
}
