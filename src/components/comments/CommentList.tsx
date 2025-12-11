'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchComments, createComment, type CommentsResponse, type CommentFilterParams } from '@/lib/api';
import type { Comment, ParticipantName, Reactions } from '@/types';
import { CommentThread } from './CommentThread';
import { CommentInput } from './CommentInput';
import { useWebSocket } from '@/hooks/useWebSocket';

interface CommentListProps {
  orderId: string;
  currentUser: ParticipantName;
  onError?: (message: string) => void;
  onSuccess?: (message: string) => void;
}

const PAGE_SIZE = 50;

export function CommentList({ 
  orderId, 
  currentUser, 
  onError, 
  onSuccess 
}: CommentListProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Handle real-time comment events
  const handleCommentCreatedRealtime = useCallback((comment: Comment) => {
    if (comment.orderId === orderId) {
      setComments((prev) => {
        // Avoid duplicates
        if (prev.some((c) => c.id === comment.id)) return prev;
        return [...prev, comment];
      });
      setTotal((prev) => prev + 1);
    }
  }, [orderId]);

  const handleCommentUpdatedRealtime = useCallback((comment: Comment) => {
    if (comment.orderId === orderId) {
      setComments((prev) =>
        prev.map((c) => (c.id === comment.id ? comment : c))
      );
    }
  }, [orderId]);

  const handleCommentDeletedRealtime = useCallback((commentId: string) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId && c.parentId !== commentId));
    setTotal((prev) => Math.max(0, prev - 1));
  }, []);

  const handleReactionToggledRealtime = useCallback((data: { commentId: string; reactions: Reactions }) => {
    setComments((prev) =>
      prev.map((c) => (c.id === data.commentId ? { ...c, reactions: data.reactions } : c))
    );
  }, []);

  // WebSocket integration for real-time updates
  const { joinOrder, leaveOrder } = useWebSocket({
    userName: currentUser,
    onCommentCreated: handleCommentCreatedRealtime,
    onCommentUpdated: handleCommentUpdatedRealtime,
    onCommentDeleted: handleCommentDeletedRealtime,
    onReactionToggled: handleReactionToggledRealtime,
  });

  // Join order room for real-time updates
  useEffect(() => {
    joinOrder(orderId);
    return () => {
      leaveOrder(orderId);
    };
  }, [orderId, joinOrder, leaveOrder]);

  // Group comments by parent for threading
  const rootComments = comments.filter(c => c.parentId === null);
  const repliesByParent = comments.reduce((acc, comment) => {
    if (comment.parentId) {
      if (!acc[comment.parentId]) {
        acc[comment.parentId] = [];
      }
      acc[comment.parentId].push(comment);
    }
    return acc;
  }, {} as Record<string, Comment[]>);

  const loadComments = useCallback(async (offset = 0, append = false) => {
    try {
      if (offset === 0) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const params: CommentFilterParams = {
        limit: PAGE_SIZE,
        offset,
      };

      const response: CommentsResponse = await fetchComments(orderId, params);
      
      if (append) {
        setComments(prev => [...prev, ...response.comments]);
      } else {
        setComments(response.comments);
      }
      setTotal(response.total);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Failed to load comments');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [orderId, onError]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);


  // Intersection Observer for infinite scroll / virtual scrolling
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && comments.length < total) {
          loadComments(comments.length, true);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [comments.length, total, loadingMore, loadComments]);

  const handleCommentUpdate = (updatedComment: Comment) => {
    setComments(prev => 
      prev.map(c => c.id === updatedComment.id ? updatedComment : c)
    );
  };

  const handleCommentDelete = (commentId: string) => {
    setComments(prev => prev.filter(c => c.id !== commentId && c.parentId !== commentId));
    setTotal(prev => prev - 1);
    onSuccess?.('Комментарий удалён');
  };

  const handleNewComment = (comment: Comment) => {
    setComments(prev => [...prev, comment]);
    setTotal(prev => prev + 1);
  };

  const handleSubmitComment = async (content: string, parentId?: string | null, _attachmentIds?: string[]) => {
    try {
      const newComment = await createComment(orderId, {
        author: currentUser,
        content,
        parentId: parentId || null,
        // Note: attachmentIds would be handled by the backend to associate with the comment
      });
      handleNewComment(newComment);
      setReplyingTo(null);
      onSuccess?.('Комментарий добавлен');
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Ошибка добавления комментария');
      throw err;
    }
  };

  const handleReplyClick = (commentId: string) => {
    setReplyingTo(commentId);
  };

  const sortedRootComments = [...rootComments].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with sort toggle */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {total} {total === 1 ? 'комментарий' : total < 5 ? 'комментария' : 'комментариев'}
        </span>
        <button
          onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
          className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {sortOrder === 'asc' ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
            )}
          </svg>
          {sortOrder === 'asc' ? 'Сначала старые' : 'Сначала новые'}
        </button>
      </div>

      {/* Comments list with virtual scrolling */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto px-4 py-2 space-y-4"
      >
        {sortedRootComments.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8 animate-fade-in">
            <span className="text-4xl mb-3 block">💬</span>
            <p className="text-gray-400 mb-1">Нет комментариев</p>
            <p className="text-sm text-gray-500">Будьте первым, кто оставит комментарий</p>
          </div>
        ) : (
          sortedRootComments.map(comment => (
            <div key={comment.id}>
              <CommentThread
                comment={comment}
                replies={repliesByParent[comment.id] || []}
                currentUser={currentUser}
                onUpdate={handleCommentUpdate}
                onDelete={handleCommentDelete}
                onReplyClick={handleReplyClick}
                onError={onError}
              />
              {/* Inline reply form */}
              {replyingTo === comment.id && (
                <div className="ml-12 mt-2 mb-4">
                  <CommentInput
                    orderId={orderId}
                    currentUser={currentUser}
                    parentId={comment.id}
                    onSubmit={handleSubmitComment}
                    onCancel={() => setReplyingTo(null)}
                    placeholder={`Ответить ${comment.author}...`}
                    autoFocus
                    onError={onError}
                  />
                </div>
              )}
            </div>
          ))
        )}
        
        {/* Load more trigger for infinite scroll */}
        {comments.length < total && (
          <div ref={loadMoreRef} className="py-4 text-center">
            {loadingMore ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500 mx-auto"></div>
            ) : (
              <button
                onClick={() => loadComments(comments.length, true)}
                className="text-sm text-primary-500 hover:text-primary-600"
              >
                Загрузить ещё ({total - comments.length} осталось)
              </button>
            )}
          </div>
        )}
      </div>

      {/* New comment input */}
      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <CommentInput
          orderId={orderId}
          currentUser={currentUser}
          onSubmit={handleSubmitComment}
          placeholder="Напишите комментарий... (Ctrl+Enter для отправки)"
          onError={onError}
        />
      </div>
    </div>
  );
}
