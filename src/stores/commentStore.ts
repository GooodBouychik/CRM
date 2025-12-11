import { create } from 'zustand';
import type { Comment } from '@/types';

interface CommentState {
  comments: Record<string, Comment>;
  drafts: Record<string, string>;
  setComments: (comments: Comment[]) => void;
  addComment: (comment: Comment) => void;
  updateComment: (id: string, data: Partial<Comment>) => void;
  deleteComment: (id: string) => void;
  setDraft: (orderId: string, content: string) => void;
  clearDraft: (orderId: string) => void;
}

export const useCommentStore = create<CommentState>((set) => ({
  comments: {},
  drafts: {},
  setComments: (comments) =>
    set({
      comments: comments.reduce((acc, comment) => ({ ...acc, [comment.id]: comment }), {}),
    }),
  addComment: (comment) =>
    set((state) => ({
      comments: { ...state.comments, [comment.id]: comment },
    })),
  updateComment: (id, data) =>
    set((state) => ({
      comments: {
        ...state.comments,
        [id]: { ...state.comments[id], ...data },
      },
    })),
  deleteComment: (id) =>
    set((state) => {
      const { [id]: _, ...rest } = state.comments;
      return { comments: rest };
    }),
  setDraft: (orderId, content) =>
    set((state) => ({
      drafts: { ...state.drafts, [orderId]: content },
    })),
  clearDraft: (orderId) =>
    set((state) => {
      const { [orderId]: _, ...rest } = state.drafts;
      return { drafts: rest };
    }),
}));
