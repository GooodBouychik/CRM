'use client';

import { useState } from 'react';
import type { Comment, ParticipantName, Reactions } from '@/types';
import { updateComment, deleteComment, toggleReaction } from '@/lib/api';

interface CommentItemProps {
  comment: Comment;
  currentUser: ParticipantName;
  onUpdate: (comment: Comment) => void;
  onDelete: (commentId: string) => void;
  onReplyClick?: (commentId: string) => void;
  onError?: (message: string) => void;
  isReply?: boolean;
}

const AVATAR_COLORS: Record<ParticipantName, string> = {
  'Никита': 'bg-blue-500',
  'Саня': 'bg-green-500',
  'Ксюша': 'bg-purple-500',
};

const REACTION_EMOJIS = ['👍', '❤️', '😄', '🎉', '🤔', '👀'];

function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function CommentItem({
  comment,
  currentUser,
  onUpdate,
  onDelete,
  onReplyClick,
  onError,
  isReply = false,
}: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [showReactions, setShowReactions] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isOwner = comment.author === currentUser;
  const canEdit = isOwner && !comment.isSystem;
  const canDelete = isOwner && !comment.isSystem;

  const handleSaveEdit = async () => {
    if (!editContent.trim()) {
      onError?.('Комментарий не может быть пустым');
      return;
    }

    try {
      const updated = await updateComment(comment.id, { content: editContent.trim() });
      onUpdate(updated);
      setIsEditing(false);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Ошибка сохранения');
    }
  };


  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteComment(comment.id);
      onDelete(comment.id);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Ошибка удаления');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleReaction = async (emoji: string) => {
    try {
      const updated = await toggleReaction(comment.id, { emoji, participant: currentUser });
      onUpdate(updated);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Ошибка реакции');
    }
    setShowReactions(false);
  };

  const renderReactions = () => {
    const reactions = comment.reactions || {};
    const entries = Object.entries(reactions).filter(([_, users]) => users.length > 0);
    
    if (entries.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {entries.map(([emoji, users]) => {
          const hasReacted = users.includes(currentUser);
          return (
            <button
              key={emoji}
              onClick={() => handleReaction(emoji)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors ${
                hasReacted 
                  ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              title={users.join(', ')}
            >
              <span>{emoji}</span>
              <span>{users.length}</span>
            </button>
          );
        })}
      </div>
    );
  };

  // System comment styling
  if (comment.isSystem) {
    return (
      <div className={`flex items-start gap-2 py-2 ${isReply ? 'ml-8' : ''}`}>
        <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
          <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex-1">
          <div className="text-sm text-gray-500 dark:text-gray-400 italic">
            {comment.content}
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {formatDate(comment.createdAt)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-start gap-3 py-3 ${isReply ? 'ml-8 border-l-2 border-gray-200 dark:border-gray-700 pl-4' : ''}`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full ${AVATAR_COLORS[comment.author]} flex items-center justify-center text-white text-sm font-medium flex-shrink-0`}>
        {comment.author[0]}
      </div>

      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {comment.author}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatDate(comment.createdAt)}
          </span>
          {comment.editedAt && (
            <span className="text-xs text-gray-400 dark:text-gray-500 italic">
              (изменено {formatDate(comment.editedAt)})
            </span>
          )}
        </div>

        {/* Content */}
        {isEditing ? (
          <div className="mt-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              rows={3}
              autoFocus
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleSaveEdit}
                className="px-3 py-1 bg-primary-500 text-white rounded text-sm hover:bg-primary-600"
              >
                Сохранить
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(comment.content);
                }}
                className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Отмена
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-1 text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
            {comment.content}
          </div>
        )}

        {/* Reactions */}
        {renderReactions()}

        {/* Actions */}
        {!isEditing && (
          <div className="flex items-center gap-3 mt-2">
            {/* Reaction picker */}
            <div className="relative">
              <button
                onClick={() => setShowReactions(!showReactions)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm"
              >
                😀
              </button>
              {showReactions && (
                <div className="absolute bottom-full left-0 mb-1 flex gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-1 shadow-lg z-10">
                  {REACTION_EMOJIS.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => handleReaction(emoji)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Reply button */}
            {onReplyClick && (
              <button
                onClick={() => onReplyClick(comment.id)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm"
              >
                Ответить
              </button>
            )}

            {/* Edit button */}
            {canEdit && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm"
              >
                Изменить
              </button>
            )}

            {/* Delete button */}
            {canDelete && (
              <>
                {showDeleteConfirm ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-red-500">Удалить?</span>
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="text-red-500 hover:text-red-600 text-sm font-medium"
                    >
                      {isDeleting ? '...' : 'Да'}
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="text-gray-400 hover:text-gray-600 text-sm"
                    >
                      Нет
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-gray-400 hover:text-red-500 text-sm"
                  >
                    Удалить
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
