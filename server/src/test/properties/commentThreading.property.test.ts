import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';

/**
 * **Feature: team-crm, Property 11: Comment Threading Maintains Parent Reference**
 * **Validates: Requirements 5.3**
 * 
 * For any reply to a comment, the reply's parentId should equal the original 
 * comment's id, and the reply should appear in the thread when querying 
 * replies for that parent.
 */

// Simulated in-memory comment store for testing threading logic
interface Comment {
  id: string;
  orderId: string;
  author: 'Никита' | 'Саня' | 'Ксюша';
  content: string;
  isSystem: boolean;
  parentId: string | null;
  reactions: Record<string, string[]>;
  createdAt: Date;
  updatedAt: Date | null;
  editedAt: Date | null;
}

interface CreateCommentInput {
  author: 'Никита' | 'Саня' | 'Ксюша';
  content: string;
  isSystem?: boolean;
  parentId?: string | null;
}

class CommentStore {
  private comments: Map<string, Comment> = new Map();

  reset() {
    this.comments.clear();
  }

  createComment(orderId: string, input: CreateCommentInput): Comment {
    const now = new Date();
    const comment: Comment = {
      id: crypto.randomUUID(),
      orderId,
      author: input.author,
      content: input.content,
      isSystem: input.isSystem ?? false,
      parentId: input.parentId ?? null,
      reactions: {},
      createdAt: now,
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

  getRepliesByParentId(parentId: string): Comment[] {
    return Array.from(this.comments.values())
      .filter(c => c.parentId === parentId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map(c => ({ ...c }));
  }

  getCommentsByOrderId(orderId: string): Comment[] {
    return Array.from(this.comments.values())
      .filter(c => c.orderId === orderId)
      .map(c => ({ ...c }));
  }
}

// Generators
const participantNameArb = fc.constantFrom('Никита', 'Саня', 'Ксюша') as fc.Arbitrary<'Никита' | 'Саня' | 'Ксюша'>;
const validContentArb = fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0);
const orderIdArb = fc.uuid();

describe('Property 11: Comment Threading Maintains Parent Reference', () => {
  let store: CommentStore;

  beforeEach(() => {
    store = new CommentStore();
  });

  it('reply parentId equals original comment id', () => {
    fc.assert(
      fc.property(
        orderIdArb,
        participantNameArb,
        validContentArb,
        participantNameArb,
        validContentArb,
        (orderId, parentAuthor, parentContent, replyAuthor, replyContent) => {
          store.reset();
          
          // Create parent comment
          const parent = store.createComment(orderId, { 
            author: parentAuthor, 
            content: parentContent 
          });
          
          // Create reply
          const reply = store.createComment(orderId, { 
            author: replyAuthor, 
            content: replyContent,
            parentId: parent.id
          });
          
          // Verify parentId equals original comment id
          expect(reply.parentId).toBe(parent.id);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('reply appears in thread when querying replies for parent', () => {
    fc.assert(
      fc.property(
        orderIdArb,
        participantNameArb,
        validContentArb,
        participantNameArb,
        validContentArb,
        (orderId, parentAuthor, parentContent, replyAuthor, replyContent) => {
          store.reset();
          
          // Create parent comment
          const parent = store.createComment(orderId, { 
            author: parentAuthor, 
            content: parentContent 
          });
          
          // Create reply
          const reply = store.createComment(orderId, { 
            author: replyAuthor, 
            content: replyContent,
            parentId: parent.id
          });
          
          // Query replies for parent
          const replies = store.getRepliesByParentId(parent.id);
          
          // Verify reply appears in results
          const replyIds = replies.map(r => r.id);
          expect(replyIds).toContain(reply.id);
        }
      ),
      { numRuns: 100 }
    );
  });


  it('multiple replies all appear in thread for same parent', () => {
    fc.assert(
      fc.property(
        orderIdArb,
        participantNameArb,
        validContentArb,
        fc.array(
          fc.tuple(participantNameArb, validContentArb),
          { minLength: 1, maxLength: 5 }
        ),
        (orderId, parentAuthor, parentContent, replyData) => {
          store.reset();
          
          // Create parent comment
          const parent = store.createComment(orderId, { 
            author: parentAuthor, 
            content: parentContent 
          });
          
          // Create multiple replies
          const createdReplies = replyData.map(([author, content]) => 
            store.createComment(orderId, { 
              author, 
              content,
              parentId: parent.id
            })
          );
          
          // Query replies for parent
          const replies = store.getRepliesByParentId(parent.id);
          
          // Verify all replies appear in results
          const replyIds = replies.map(r => r.id);
          for (const reply of createdReplies) {
            expect(replyIds).toContain(reply.id);
          }
          
          // Verify count matches
          expect(replies.length).toBe(createdReplies.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('replies to different parents are correctly separated', () => {
    fc.assert(
      fc.property(
        orderIdArb,
        participantNameArb,
        validContentArb,
        participantNameArb,
        validContentArb,
        participantNameArb,
        validContentArb,
        participantNameArb,
        validContentArb,
        (orderId, p1Author, p1Content, p2Author, p2Content, r1Author, r1Content, r2Author, r2Content) => {
          store.reset();
          
          // Create two parent comments
          const parent1 = store.createComment(orderId, { 
            author: p1Author, 
            content: p1Content 
          });
          const parent2 = store.createComment(orderId, { 
            author: p2Author, 
            content: p2Content 
          });
          
          // Create reply to parent1
          const reply1 = store.createComment(orderId, { 
            author: r1Author, 
            content: r1Content,
            parentId: parent1.id
          });
          
          // Create reply to parent2
          const reply2 = store.createComment(orderId, { 
            author: r2Author, 
            content: r2Content,
            parentId: parent2.id
          });
          
          // Query replies for each parent
          const repliesForParent1 = store.getRepliesByParentId(parent1.id);
          const repliesForParent2 = store.getRepliesByParentId(parent2.id);
          
          // Verify correct separation
          const ids1 = repliesForParent1.map(r => r.id);
          const ids2 = repliesForParent2.map(r => r.id);
          
          expect(ids1).toContain(reply1.id);
          expect(ids1).not.toContain(reply2.id);
          expect(ids2).toContain(reply2.id);
          expect(ids2).not.toContain(reply1.id);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('top-level comments do not appear in any reply query', () => {
    fc.assert(
      fc.property(
        orderIdArb,
        participantNameArb,
        validContentArb,
        participantNameArb,
        validContentArb,
        (orderId, author1, content1, author2, content2) => {
          store.reset();
          
          // Create two top-level comments (no parentId)
          const comment1 = store.createComment(orderId, { 
            author: author1, 
            content: content1 
          });
          const comment2 = store.createComment(orderId, { 
            author: author2, 
            content: content2 
          });
          
          // Query replies for each comment
          const repliesFor1 = store.getRepliesByParentId(comment1.id);
          const repliesFor2 = store.getRepliesByParentId(comment2.id);
          
          // Neither should contain the other
          expect(repliesFor1.map(r => r.id)).not.toContain(comment2.id);
          expect(repliesFor2.map(r => r.id)).not.toContain(comment1.id);
        }
      ),
      { numRuns: 100 }
    );
  });
});
