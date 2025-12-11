'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import {
  initializeSocket,
  getSocket,
  disconnectSocket,
  isSocketConnected,
  joinOrderRoom,
  leaveOrderRoom,
  sendTypingStart,
  sendTypingStop,
  sendCursorMove,
  updatePresence,
  sendFieldStart,
  sendFieldStop,
  type ServerToClientEvents,
  type PresenceData,
  type TypingData,
  type CursorData,
  type FieldEditData,
} from '@/lib/socket';
import { usePresenceStore } from '@/stores/presenceStore';
import { fetchPresence } from '@/lib/api';
import type { ParticipantName, Order, Subtask, Comment, Reactions } from '@/types';

export interface UseWebSocketOptions {
  userName: ParticipantName;
  onOrderCreated?: (order: Order) => void;
  onOrderUpdated?: (order: Order) => void;
  onOrderDeleted?: (orderId: string) => void;
  onSubtaskCreated?: (subtask: Subtask) => void;
  onSubtaskUpdated?: (subtask: Subtask) => void;
  onSubtaskMoved?: (subtask: Subtask) => void;
  onSubtaskDeleted?: (subtaskId: string) => void;
  onCommentCreated?: (comment: Comment) => void;
  onCommentUpdated?: (comment: Comment) => void;
  onCommentDeleted?: (commentId: string) => void;
  onReactionToggled?: (data: { commentId: string; reactions: Reactions }) => void;
  onTypingUpdate?: (data: TypingData) => void;
  onCursorUpdate?: (data: CursorData) => void;
  onFieldEditing?: (data: FieldEditData) => void;
  onFieldStopped?: (data: FieldEditData) => void;
}

export interface UseWebSocketReturn {
  isConnected: boolean;
  isReconnecting: boolean;
  joinOrder: (orderId: string) => void;
  leaveOrder: (orderId: string) => void;
  startTyping: (orderId: string) => void;
  stopTyping: (orderId: string) => void;
  moveCursor: (data: CursorData) => void;
  setCurrentOrder: (orderId: string | null) => void;
  startFieldEdit: (orderId: string, fieldName: string) => void;
  stopFieldEdit: (orderId: string, fieldName: string) => void;
}


export function useWebSocket(options: UseWebSocketOptions): UseWebSocketReturn {
  const { userName } = options;
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const currentOrderRef = useRef<string | null>(null);
  const setPresence = usePresenceStore((state) => state.setPresence);
  const setCurrentUser = usePresenceStore((state) => state.setCurrentUser);

  const initializePresence = usePresenceStore((state) => state.initializePresence);

  // Initialize socket connection
  useEffect(() => {
    const socket = initializeSocket({
      userName,
      onConnect: async () => {
        setIsConnected(true);
        setIsReconnecting(false);
        setCurrentUser(userName);
        setPresence(userName, { isOnline: true, lastActivity: new Date() });
        
        // Fetch initial presence data
        try {
          const presenceData = await fetchPresence();
          initializePresence(presenceData);
        } catch (error) {
          console.error('Failed to fetch initial presence:', error);
        }
        
        // Rejoin current order room if any
        if (currentOrderRef.current) {
          joinOrderRoom(currentOrderRef.current);
        }
      },
      onDisconnect: () => {
        setIsConnected(false);
        setPresence(userName, { isOnline: false });
      },
      onReconnect: () => {
        setIsReconnecting(false);
        setIsConnected(true);
        
        // Rejoin current order room after reconnect
        if (currentOrderRef.current) {
          joinOrderRoom(currentOrderRef.current);
        }
      },
      onError: () => {
        setIsReconnecting(true);
      },
    });

    // Set up event listeners
    socket.on('order:created', (order) => {
      options.onOrderCreated?.(order);
    });

    socket.on('order:updated', (order) => {
      options.onOrderUpdated?.(order);
    });

    socket.on('order:deleted', (orderId) => {
      options.onOrderDeleted?.(orderId);
    });

    socket.on('subtask:created', (subtask) => {
      options.onSubtaskCreated?.(subtask);
    });

    socket.on('subtask:updated', (subtask) => {
      options.onSubtaskUpdated?.(subtask);
    });

    socket.on('subtask:moved', (subtask) => {
      options.onSubtaskMoved?.(subtask);
    });

    socket.on('subtask:deleted', (subtaskId) => {
      options.onSubtaskDeleted?.(subtaskId);
    });

    socket.on('comment:created', (comment) => {
      options.onCommentCreated?.(comment);
    });

    socket.on('comment:updated', (comment) => {
      options.onCommentUpdated?.(comment);
    });

    socket.on('comment:deleted', (commentId) => {
      options.onCommentDeleted?.(commentId);
    });

    socket.on('reaction:toggled', (data) => {
      options.onReactionToggled?.(data);
    });

    socket.on('presence:updated', (presence: PresenceData) => {
      setPresence(presence.name, {
        isOnline: presence.isOnline,
        currentOrderId: presence.currentOrderId,
        lastActivity: new Date(presence.lastActivity),
      });
    });

    socket.on('typing:update', (data) => {
      options.onTypingUpdate?.(data);
    });

    socket.on('cursor:update', (data) => {
      options.onCursorUpdate?.(data);
    });

    socket.on('field:editing', (data) => {
      options.onFieldEditing?.(data);
    });

    socket.on('field:stopped', (data) => {
      options.onFieldStopped?.(data);
    });

    // Cleanup on unmount
    return () => {
      if (currentOrderRef.current) {
        leaveOrderRoom(currentOrderRef.current);
      }
      disconnectSocket();
    };
  }, [userName, setPresence, setCurrentUser]);

  // Join an order room
  const joinOrder = useCallback((orderId: string) => {
    if (currentOrderRef.current && currentOrderRef.current !== orderId) {
      leaveOrderRoom(currentOrderRef.current);
    }
    currentOrderRef.current = orderId;
    joinOrderRoom(orderId);
    updatePresence(orderId);
  }, []);

  // Leave an order room
  const leaveOrder = useCallback((orderId: string) => {
    if (currentOrderRef.current === orderId) {
      currentOrderRef.current = null;
    }
    leaveOrderRoom(orderId);
    updatePresence(null);
  }, []);

  // Start typing indicator
  const startTyping = useCallback((orderId: string) => {
    sendTypingStart(orderId);
  }, []);

  // Stop typing indicator
  const stopTyping = useCallback((orderId: string) => {
    sendTypingStop(orderId);
  }, []);

  // Move cursor (for collaborative editing)
  const moveCursor = useCallback((data: CursorData) => {
    sendCursorMove(data);
  }, []);

  // Set current order being viewed
  const setCurrentOrder = useCallback((orderId: string | null) => {
    if (currentOrderRef.current && currentOrderRef.current !== orderId) {
      leaveOrderRoom(currentOrderRef.current);
    }
    currentOrderRef.current = orderId;
    if (orderId) {
      joinOrderRoom(orderId);
    }
    updatePresence(orderId);
  }, []);

  // Start editing a field (conflict detection)
  const startFieldEdit = useCallback((orderId: string, fieldName: string) => {
    sendFieldStart(orderId, fieldName);
  }, []);

  // Stop editing a field (conflict detection)
  const stopFieldEdit = useCallback((orderId: string, fieldName: string) => {
    sendFieldStop(orderId, fieldName);
  }, []);

  return {
    isConnected,
    isReconnecting,
    joinOrder,
    leaveOrder,
    startTyping,
    stopTyping,
    moveCursor,
    setCurrentOrder,
    startFieldEdit,
    stopFieldEdit,
  };
}
