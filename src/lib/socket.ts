import { io, Socket } from 'socket.io-client';
import type { ParticipantName, Order, Subtask, Comment, Reactions } from '@/types';

// WebSocket event types (matching server)
export interface ServerToClientEvents {
  // Order events
  'order:created': (order: Order) => void;
  'order:updated': (order: Order) => void;
  'order:deleted': (orderId: string) => void;
  
  // Subtask events
  'subtask:created': (subtask: Subtask) => void;
  'subtask:updated': (subtask: Subtask) => void;
  'subtask:moved': (subtask: Subtask) => void;
  'subtask:deleted': (subtaskId: string) => void;
  
  // Comment events
  'comment:created': (comment: Comment) => void;
  'comment:updated': (comment: Comment) => void;
  'comment:deleted': (commentId: string) => void;
  'reaction:toggled': (data: { commentId: string; reactions: Reactions }) => void;
  
  // Presence events
  'presence:updated': (presence: PresenceData) => void;
  'typing:update': (data: TypingData) => void;
  'cursor:update': (data: CursorData) => void;
  
  // Conflict detection events
  'field:editing': (data: FieldEditData) => void;
  'field:stopped': (data: FieldEditData) => void;
}

export interface ClientToServerEvents {
  // Room management
  'join:order': (orderId: string) => void;
  'leave:order': (orderId: string) => void;
  
  // Typing indicators
  'typing:start': (data: { orderId: string }) => void;
  'typing:stop': (data: { orderId: string }) => void;
  
  // Cursor position (for collaborative editing)
  'cursor:move': (data: CursorData) => void;
  
  // Presence
  'presence:update': (data: { currentOrderId: string | null }) => void;
  
  // Field editing (conflict detection)
  'field:start': (data: { orderId: string; fieldName: string }) => void;
  'field:stop': (data: { orderId: string; fieldName: string }) => void;
}

export interface PresenceData {
  name: ParticipantName;
  isOnline: boolean;
  currentOrderId: string | null;
  lastActivity: Date;
}

export interface TypingData {
  orderId: string;
  userName: ParticipantName;
  isTyping: boolean;
}


export interface CursorData {
  orderId: string;
  userName: ParticipantName;
  position: { line: number; column: number } | null;
}

export interface FieldEditData {
  orderId: string;
  fieldName: string;
  userName: ParticipantName;
}

// Socket instance (singleton)
let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface SocketOptions {
  userName: ParticipantName;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onReconnect?: () => void;
  onError?: (error: Error) => void;
}

// Initialize socket connection
export function initializeSocket(options: SocketOptions): Socket<ServerToClientEvents, ClientToServerEvents> {
  if (socket?.connected) {
    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: {
      userName: options.userName,
    },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    transports: ['websocket', 'polling'],
  });

  // Connection events
  socket.on('connect', () => {
    console.log('Socket connected:', socket?.id);
    options.onConnect?.();
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
    options.onDisconnect?.();
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
    options.onError?.(error);
  });

  socket.io.on('reconnect', (attempt) => {
    console.log('Socket reconnected after', attempt, 'attempts');
    options.onReconnect?.();
  });

  socket.io.on('reconnect_attempt', (attempt) => {
    console.log('Socket reconnection attempt:', attempt);
  });

  socket.io.on('reconnect_error', (error) => {
    console.error('Socket reconnection error:', error);
  });

  return socket;
}

// Get the current socket instance
export function getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> | null {
  return socket;
}

// Disconnect socket
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

// Check if socket is connected
export function isSocketConnected(): boolean {
  return socket?.connected ?? false;
}

// Join an order room for real-time updates
export function joinOrderRoom(orderId: string): void {
  socket?.emit('join:order', orderId);
}

// Leave an order room
export function leaveOrderRoom(orderId: string): void {
  socket?.emit('leave:order', orderId);
}

// Send typing start event
export function sendTypingStart(orderId: string): void {
  socket?.emit('typing:start', { orderId });
}

// Send typing stop event
export function sendTypingStop(orderId: string): void {
  socket?.emit('typing:stop', { orderId });
}

// Send cursor position update
export function sendCursorMove(data: CursorData): void {
  socket?.emit('cursor:move', data);
}

// Update presence (current order being viewed)
export function updatePresence(currentOrderId: string | null): void {
  socket?.emit('presence:update', { currentOrderId });
}

// Send field editing start event (conflict detection)
export function sendFieldStart(orderId: string, fieldName: string): void {
  socket?.emit('field:start', { orderId, fieldName });
}

// Send field editing stop event (conflict detection)
export function sendFieldStop(orderId: string, fieldName: string): void {
  socket?.emit('field:stop', { orderId, fieldName });
}
