'use client';

import type { Comment, ParticipantName } from '@/types';
import { CommentItem } from './CommentItem';

interface CommentThreadProps {
  comment: Comment;
  replies: Comment[];
  currentUser: ParticipantName;
  onUpdate: (comment: Comment) => void;
  onDelete: (commentId: string) => void;
  onReplyClick?: (commentId: string) => void;
  onError?: (message: string) => void;
}

export function CommentThread({
  comment,
  replies,
  currentUser,
  onUpdate,
  onDelete,
  onReplyClick,
  onError,
}: CommentThreadProps) {
  // Sort replies chronologically
  const sortedReplies = [...replies].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return (
    <div className="border-b border-gray-100 dark:border-gray-800 last:border-b-0">
      {/* Parent comment */}
      <CommentItem
        comment={comment}
        currentUser={currentUser}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onReplyClick={onReplyClick}
        onError={onError}
      />

      {/* Replies */}
      {sortedReplies.length > 0 && (
        <div className="ml-4">
          {sortedReplies.map(reply => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUser={currentUser}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onError={onError}
              isReply
            />
          ))}
        </div>
      )}
    </div>
  );
}
