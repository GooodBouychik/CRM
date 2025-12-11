import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';

/**
 * **Feature: team-crm, Property 10: Comment Creation Preserves Metadata**
 * **Validates: Requirements 5.2**
 * 
 * For any comment creation with author, content, and optional parentId,
 * the created comment should have the exact same author, content, and parentId,
 * plus a valid createdAt timestamp.
 */

// Simulated in-memory comment store for testing comment creation logic
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

  getCommentsByOrderId(orderId: string): Comment[] {
    return Array.from(this.comments.values())
      .filter(c => c.orderId === orderId)
      .map(c => ({ ...c }));
  }

  commentExists(id: string): boolean {
    return this.comments.has(id);
  }
}

// Generators
const participantNameArb = fc.constantFrom('Никита', 'Саня', 'Ксюша') as fc.Arbitrary<'Никита' | 'Саня' | 'Ксюша'>;
const validContentArb = fc.string({ minLength: 1, maxLength: 1000 }).filter(s => s.trim().length > 0);
const orderIdArb = fc.uuid();

describe('Property 10: Comment Creation Preserves Metadata', () => {
  let store: CommentStore;

  beforeEach(() => {
    store = new CommentStore();
  });

  it('created comment has exact same author as input', () => {
    fc.assert(
      fc.property(
        orderIdArb,
        participantNameArb,
        validContentArb,
        (orderId, author, content) => {
          store.reset();
          const created = store.createComment(orderId, { author, content });
          
          expect(created.author).toBe(author);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('created comment has exact same content as input', () => {
    fc.assert(
      fc.property(
        orderIdArb,
        participantNameArb,
        validContentArb,
        (orderId, author, content) => {
          store.reset();
          const created = store.createComment(orderId, { author, content });
          
          expect(created.content).toBe(content);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('created comment has exact same parentId as input (null case)', () => {
    fc.assert(
      fc.property(
        orderIdArb,
        participantNameArb,
        validContentArb,
        (orderId, author, content) => {
          store.reset();
          const created = store.createComment(orderId, { author, content, parentId: null });
          
          expect(created.parentId).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });


  it('created comment has exact same parentId as input (with parent)', () => {
    fc.assert(
      fc.property(
        orderIdArb,
        participantNameArb,
        validContentArb,
        participantNameArb,
        validContentArb,
        (orderId, parentAuthor, parentContent, replyAuthor, replyContent) => {
          store.reset();
          // Create parent comment first
          const parent = store.createComment(orderId, { 
            author: parentAuthor, 
            content: parentContent 
          });
          
          // Create reply with parentId
          const reply = store.createComment(orderId, { 
            author: replyAuthor, 
            content: replyContent,
            parentId: parent.id
          });
          
          expect(reply.parentId).toBe(parent.id);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('created comment has valid createdAt timestamp', () => {
    fc.assert(
      fc.property(
        orderIdArb,
        participantNameArb,
        validContentArb,
        (orderId, author, content) => {
          store.reset();
          const beforeCreate = new Date();
          const created = store.createComment(orderId, { author, content });
          const afterCreate = new Date();
          
          expect(created.createdAt).toBeInstanceOf(Date);
          expect(created.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
          expect(created.createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
        }
      ),
      { numRuns: 100 }
    );
  });

  it('created comment has correct orderId', () => {
    fc.assert(
      fc.property(
        orderIdArb,
        participantNameArb,
        validContentArb,
        (orderId, author, content) => {
          store.reset();
          const created = store.createComment(orderId, { author, content });
          
          expect(created.orderId).toBe(orderId);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('created comment has isSystem matching input (default false)', () => {
    fc.assert(
      fc.property(
        orderIdArb,
        participantNameArb,
        validContentArb,
        (orderId, author, content) => {
          store.reset();
          const created = store.createComment(orderId, { author, content });
          
          expect(created.isSystem).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('created comment has isSystem matching input (explicit value)', () => {
    fc.assert(
      fc.property(
        orderIdArb,
        participantNameArb,
        validContentArb,
        fc.boolean(),
        (orderId, author, content, isSystem) => {
          store.reset();
          const created = store.createComment(orderId, { author, content, isSystem });
          
          expect(created.isSystem).toBe(isSystem);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('created comment has empty reactions', () => {
    fc.assert(
      fc.property(
        orderIdArb,
        participantNameArb,
        validContentArb,
        (orderId, author, content) => {
          store.reset();
          const created = store.createComment(orderId, { author, content });
          
          expect(created.reactions).toEqual({});
        }
      ),
      { numRuns: 100 }
    );
  });

  it('created comment has null editedAt initially', () => {
    fc.assert(
      fc.property(
        orderIdArb,
        participantNameArb,
        validContentArb,
        (orderId, author, content) => {
          store.reset();
          const created = store.createComment(orderId, { author, content });
          
          expect(created.editedAt).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });
});
