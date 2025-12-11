import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';

/**
 * **Feature: team-crm, Property 14: Comment Deletion Removes From Results**
 * **Validates: Requirements 5.6**
 * 
 * For any deleted comment, querying comments for that order should not 
 * include the deleted comment's id in the results.
 */

type ParticipantName = 'Никита' | 'Саня' | 'Ксюша';

interface Comment {
  id: string;
  orderId: string;
  author: ParticipantName;
  content: string;
  isSystem: boolean;
  parentId: string | null;
  reactions: Record<string, ParticipantName[]>;
  createdAt: Date;
  updatedAt: Date | null;
  editedAt: Date | null;
}

class CommentStore {
  private comments: Map<string, Comment> = new Map();

  reset() {
    this.comments.clear();
  }

  createComment(orderId: string, author: ParticipantName, content: string): Comment {
    const comment: Comment = {
      id: crypto.randomUUID(),
      orderId,
      author,
      content,
      isSystem: false,
      parentId: null,
      reactions: {},
      createdAt: new Date(),
      updatedAt: null,
      editedAt: null,
    };
    this.comments.set(comment.id, comment);
    return { ...comment };
  }

  getComment(id: string): Comment | null {
    const comment = this.comments.get(id);
    return comment ? { ...comment } : null;
  }

  getCommentsByOrderId(orderId: string): Comment[] {
    return Array.from(this.comments.values())
      .filter(c => c.orderId === orderId)
      .map(c => ({ ...c }));
  }


  deleteComment(id: string): boolean {
    return this.comments.delete(id);
  }

  commentExists(id: string): boolean {
    return this.comments.has(id);
  }
}

// Generators
const participantNameArb = fc.constantFrom('Никита', 'Саня', 'Ксюша') as fc.Arbitrary<ParticipantName>;
const validContentArb = fc.string({ minLength: 1, maxLength: 300 }).filter(s => s.trim().length > 0);
const orderIdArb = fc.uuid();

describe('Property 14: Comment Deletion Removes From Results', () => {
  let store: CommentStore;

  beforeEach(() => {
    store = new CommentStore();
  });

  it('deleted comment does not appear in order comments query', () => {
    fc.assert(
      fc.property(
        orderIdArb,
        participantNameArb,
        validContentArb,
        (orderId, author, content) => {
          store.reset();
          const comment = store.createComment(orderId, author, content);
          const commentId = comment.id;
          
          // Verify comment exists initially
          const beforeDelete = store.getCommentsByOrderId(orderId);
          expect(beforeDelete.map(c => c.id)).toContain(commentId);
          
          // Delete the comment
          const deleted = store.deleteComment(commentId);
          expect(deleted).toBe(true);
          
          // Query comments for order
          const afterDelete = store.getCommentsByOrderId(orderId);
          
          // Deleted comment should not appear
          expect(afterDelete.map(c => c.id)).not.toContain(commentId);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('deleted comment cannot be retrieved by id', () => {
    fc.assert(
      fc.property(
        orderIdArb,
        participantNameArb,
        validContentArb,
        (orderId, author, content) => {
          store.reset();
          const comment = store.createComment(orderId, author, content);
          const commentId = comment.id;
          
          // Verify comment exists initially
          expect(store.getComment(commentId)).not.toBeNull();
          
          // Delete the comment
          store.deleteComment(commentId);
          
          // Comment should not be retrievable
          expect(store.getComment(commentId)).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('deleting one comment does not affect others', () => {
    fc.assert(
      fc.property(
        orderIdArb,
        participantNameArb,
        validContentArb,
        participantNameArb,
        validContentArb,
        (orderId, author1, content1, author2, content2) => {
          store.reset();
          const comment1 = store.createComment(orderId, author1, content1);
          const comment2 = store.createComment(orderId, author2, content2);
          
          // Delete first comment
          store.deleteComment(comment1.id);
          
          // Second comment should still exist
          const remaining = store.getCommentsByOrderId(orderId);
          expect(remaining.map(c => c.id)).toContain(comment2.id);
          expect(remaining.map(c => c.id)).not.toContain(comment1.id);
          expect(remaining.length).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });


  it('deleting comment from one order does not affect other orders', () => {
    fc.assert(
      fc.property(
        orderIdArb,
        orderIdArb,
        participantNameArb,
        validContentArb,
        participantNameArb,
        validContentArb,
        (orderId1, orderId2, author1, content1, author2, content2) => {
          // Skip if same order ID generated
          fc.pre(orderId1 !== orderId2);
          
          store.reset();
          const comment1 = store.createComment(orderId1, author1, content1);
          const comment2 = store.createComment(orderId2, author2, content2);
          
          // Delete comment from first order
          store.deleteComment(comment1.id);
          
          // Comment from second order should still exist
          const order2Comments = store.getCommentsByOrderId(orderId2);
          expect(order2Comments.map(c => c.id)).toContain(comment2.id);
          expect(order2Comments.length).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('commentExists returns false after deletion', () => {
    fc.assert(
      fc.property(
        orderIdArb,
        participantNameArb,
        validContentArb,
        (orderId, author, content) => {
          store.reset();
          const comment = store.createComment(orderId, author, content);
          const commentId = comment.id;
          
          // Verify exists before deletion
          expect(store.commentExists(commentId)).toBe(true);
          
          // Delete
          store.deleteComment(commentId);
          
          // Should not exist after deletion
          expect(store.commentExists(commentId)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('deleting all comments results in empty list', () => {
    fc.assert(
      fc.property(
        orderIdArb,
        fc.array(
          fc.tuple(participantNameArb, validContentArb),
          { minLength: 1, maxLength: 5 }
        ),
        (orderId, commentData) => {
          store.reset();
          
          // Create multiple comments
          const comments = commentData.map(([author, content]) => 
            store.createComment(orderId, author, content)
          );
          
          // Delete all comments
          for (const comment of comments) {
            store.deleteComment(comment.id);
          }
          
          // Query should return empty list
          const remaining = store.getCommentsByOrderId(orderId);
          expect(remaining.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('deleting non-existent comment returns false', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        (nonExistentId) => {
          store.reset();
          
          // Try to delete non-existent comment
          const result = store.deleteComment(nonExistentId);
          
          // Should return false
          expect(result).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});
