import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

// Participant names type (matching frontend)
export type ParticipantName = 'Никита' | 'Саня' | 'Ксюша';

// WebSocket event types
export interface ServerToClientEvents {
  // Order events
  'order:created': (order: unknown) => void;
  'order:updated': (order: unknown) => void;
  'order:deleted': (orderId: string) => void;
  
  // Subtask events
  'subtask:created': (subtask: unknown) => void;
  'subtask:updated': (subtask: unknown) => void;
  'subtask:moved': (subtask: unknown) => void;
  'subtask:deleted': (subtaskId: string) => void;
  
  // Comment events
  'comment:created': (comment: unknown) => void;
  'comment:updated': (comment: unknown) => void;
  'comment:deleted': (commentId: string) => void;
  'reaction:toggled': (data: { commentId: string; reactions: unknown }) => void;
  
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

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId: string;
  userName: ParticipantName;
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


// Track connected users and their presence
const connectedUsers = new Map<string, { socketId: string; userName: ParticipantName; currentOrderId: string | null }>();

// Socket.io server instance
let io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData> | null = null;

export function initializeSocketServer(httpServer: HttpServer): Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData> {
  io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>) => {
    console.log(`Client connected: ${socket.id}`);

    // Handle user identification (sent on connection)
    const userName = socket.handshake.auth.userName as ParticipantName;
    if (userName) {
      socket.data.userName = userName;
      connectedUsers.set(socket.id, { socketId: socket.id, userName, currentOrderId: null });
      
      // Broadcast presence update
      broadcastPresence(userName, true, null);
    }

    // Join order room for real-time updates
    socket.on('join:order', (orderId: string) => {
      socket.join(`order:${orderId}`);
      console.log(`Socket ${socket.id} joined order:${orderId}`);
      
      // Update user's current order
      const user = connectedUsers.get(socket.id);
      if (user) {
        user.currentOrderId = orderId;
        broadcastPresence(user.userName, true, orderId);
      }
    });

    // Leave order room
    socket.on('leave:order', (orderId: string) => {
      socket.leave(`order:${orderId}`);
      console.log(`Socket ${socket.id} left order:${orderId}`);
      
      // Update user's current order
      const user = connectedUsers.get(socket.id);
      if (user) {
        user.currentOrderId = null;
        broadcastPresence(user.userName, true, null);
      }
    });

    // Handle typing indicators
    socket.on('typing:start', ({ orderId }) => {
      const user = connectedUsers.get(socket.id);
      if (user) {
        socket.to(`order:${orderId}`).emit('typing:update', {
          orderId,
          userName: user.userName,
          isTyping: true,
        });
      }
    });

    socket.on('typing:stop', ({ orderId }) => {
      const user = connectedUsers.get(socket.id);
      if (user) {
        socket.to(`order:${orderId}`).emit('typing:update', {
          orderId,
          userName: user.userName,
          isTyping: false,
        });
      }
    });

    // Handle cursor position updates (for collaborative editing)
    socket.on('cursor:move', (data: CursorData) => {
      socket.to(`order:${data.orderId}`).emit('cursor:update', data);
    });

    // Handle field editing start (conflict detection)
    socket.on('field:start', ({ orderId, fieldName }) => {
      const user = connectedUsers.get(socket.id);
      if (user) {
        socket.to(`order:${orderId}`).emit('field:editing', {
          orderId,
          fieldName,
          userName: user.userName,
        });
      }
    });

    // Handle field editing stop (conflict detection)
    socket.on('field:stop', ({ orderId, fieldName }) => {
      const user = connectedUsers.get(socket.id);
      if (user) {
        socket.to(`order:${orderId}`).emit('field:stopped', {
          orderId,
          fieldName,
          userName: user.userName,
        });
      }
    });

    // Handle presence updates
    socket.on('presence:update', ({ currentOrderId }) => {
      const user = connectedUsers.get(socket.id);
      if (user) {
        user.currentOrderId = currentOrderId;
        broadcastPresence(user.userName, true, currentOrderId);
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
      const user = connectedUsers.get(socket.id);
      if (user) {
        connectedUsers.delete(socket.id);
        broadcastPresence(user.userName, false, null);
      }
    });
  });

  return io;
}

// Broadcast presence update to all connected clients
function broadcastPresence(userName: ParticipantName, isOnline: boolean, currentOrderId: string | null) {
  if (io) {
    io.emit('presence:updated', {
      name: userName,
      isOnline,
      currentOrderId,
      lastActivity: new Date(),
    });
  }
}

// Get the Socket.io server instance
export function getIO(): Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData> | null {
  return io;
}

// Emit order events
export function emitOrderCreated(order: unknown) {
  io?.emit('order:created', order);
}

export function emitOrderUpdated(order: unknown) {
  io?.emit('order:updated', order);
}

export function emitOrderDeleted(orderId: string) {
  io?.emit('order:deleted', orderId);
}

// Emit subtask events (to specific order room)
export function emitSubtaskCreated(orderId: string, subtask: unknown) {
  io?.to(`order:${orderId}`).emit('subtask:created', subtask);
}

export function emitSubtaskUpdated(orderId: string, subtask: unknown) {
  io?.to(`order:${orderId}`).emit('subtask:updated', subtask);
}

export function emitSubtaskMoved(orderId: string, subtask: unknown) {
  io?.to(`order:${orderId}`).emit('subtask:moved', subtask);
}

export function emitSubtaskDeleted(orderId: string, subtaskId: string) {
  io?.to(`order:${orderId}`).emit('subtask:deleted', subtaskId);
}

// Emit comment events (to specific order room)
export function emitCommentCreated(orderId: string, comment: unknown) {
  io?.to(`order:${orderId}`).emit('comment:created', comment);
}

export function emitCommentUpdated(orderId: string, comment: unknown) {
  io?.to(`order:${orderId}`).emit('comment:updated', comment);
}

export function emitCommentDeleted(orderId: string, commentId: string) {
  io?.to(`order:${orderId}`).emit('comment:deleted', commentId);
}

export function emitReactionToggled(orderId: string, commentId: string, reactions: unknown) {
  io?.to(`order:${orderId}`).emit('reaction:toggled', { commentId, reactions });
}

// Get all online users
export function getOnlineUsers(): PresenceData[] {
  const users: PresenceData[] = [];
  connectedUsers.forEach((user) => {
    users.push({
      name: user.userName,
      isOnline: true,
      currentOrderId: user.currentOrderId,
      lastActivity: new Date(),
    });
  });
  return users;
}

// Get users viewing a specific order
export function getOrderViewers(orderId: string): ParticipantName[] {
  const viewers: ParticipantName[] = [];
  connectedUsers.forEach((user) => {
    if (user.currentOrderId === orderId) {
      viewers.push(user.userName);
    }
  });
  return viewers;
}
