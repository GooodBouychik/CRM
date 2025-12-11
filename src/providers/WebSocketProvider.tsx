'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useWebSocket, type UseWebSocketReturn } from '@/hooks/useWebSocket';
import { useOrderStore } from '@/stores/orderStore';
import { useCommentStore } from '@/stores/commentStore';
import type { ParticipantName, Order, Subtask, Comment, Reactions } from '@/types';
import type { TypingData, CursorData } from '@/lib/socket';

interface WebSocketContextValue extends UseWebSocketReturn {
  currentUser: ParticipantName;
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

interface WebSocketProviderProps {
  children: ReactNode;
  userName?: ParticipantName;
}

export function WebSocketProvider({ children, userName = 'Никита' }: WebSocketProviderProps) {
  const [subtaskCallbacks, setSubtaskCallbacks] = useState<{
    onCreated?: (subtask: Subtask) => void;
    onUpdated?: (subtask: Subtask) => void;
    onMoved?: (subtask: Subtask) => void;
    onDeleted?: (subtaskId: string) => void;
  }>({});

  // Order store actions
  const addOrder = useOrderStore((state) => state.addOrder);
  const updateOrder = useOrderStore((state) => state.updateOrder);
  const deleteOrder = useOrderStore((state) => state.deleteOrder);

  // Comment store actions
  const addComment = useCommentStore((state) => state.addComment);
  const updateComment = useCommentStore((state) => state.updateComment);
  const deleteComment = useCommentStore((state) => state.deleteComment);

  // Handle order events
  const handleOrderCreated = useCallback((order: Order) => {
    addOrder(order);
  }, [addOrder]);

  const handleOrderUpdated = useCallback((order: Order) => {
    updateOrder(order.id, order);
  }, [updateOrder]);

  const handleOrderDeleted = useCallback((orderId: string) => {
    deleteOrder(orderId);
  }, [deleteOrder]);

  // Handle comment events
  const handleCommentCreated = useCallback((comment: Comment) => {
    addComment(comment);
  }, [addComment]);

  const handleCommentUpdated = useCallback((comment: Comment) => {
    updateComment(comment.id, comment);
  }, [updateComment]);

  const handleCommentDeleted = useCallback((commentId: string) => {
    deleteComment(commentId);
  }, [deleteComment]);

  const handleReactionToggled = useCallback((data: { commentId: string; reactions: Reactions }) => {
    updateComment(data.commentId, { reactions: data.reactions });
  }, [updateComment]);

  // Handle subtask events - these will be set by components that need them
  const handleSubtaskCreated = useCallback((subtask: Subtask) => {
    subtaskCallbacks.onCreated?.(subtask);
  }, [subtaskCallbacks]);

  const handleSubtaskUpdated = useCallback((subtask: Subtask) => {
    subtaskCallbacks.onUpdated?.(subtask);
  }, [subtaskCallbacks]);

  const handleSubtaskMoved = useCallback((subtask: Subtask) => {
    subtaskCallbacks.onMoved?.(subtask);
  }, [subtaskCallbacks]);

  const handleSubtaskDeleted = useCallback((subtaskId: string) => {
    subtaskCallbacks.onDeleted?.(subtaskId);
  }, [subtaskCallbacks]);

  const webSocket = useWebSocket({
    userName,
    onOrderCreated: handleOrderCreated,
    onOrderUpdated: handleOrderUpdated,
    onOrderDeleted: handleOrderDeleted,
    onCommentCreated: handleCommentCreated,
    onCommentUpdated: handleCommentUpdated,
    onCommentDeleted: handleCommentDeleted,
    onReactionToggled: handleReactionToggled,
    onSubtaskCreated: handleSubtaskCreated,
    onSubtaskUpdated: handleSubtaskUpdated,
    onSubtaskMoved: handleSubtaskMoved,
    onSubtaskDeleted: handleSubtaskDeleted,
  });

  const contextValue: WebSocketContextValue = {
    ...webSocket,
    currentUser: userName,
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocketContext() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
}

// Hook for components to register subtask callbacks
export function useSubtaskRealtime(callbacks: {
  onCreated?: (subtask: Subtask) => void;
  onUpdated?: (subtask: Subtask) => void;
  onMoved?: (subtask: Subtask) => void;
  onDeleted?: (subtaskId: string) => void;
}) {
  // This is a simplified approach - in production you might want a more robust event system
  const context = useContext(WebSocketContext);
  
  useEffect(() => {
    // Components can use the useWebSocket hook directly for subtask events
    // This hook is provided for convenience
  }, [callbacks]);
}
