import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';

/**
 * **Feature: team-crm, Property 13: Comment Edit Updates Timestamp**
 * **Validates: Requirements 5.5**
 * 
 * For any comment edit operation, the comment's editedAt timestamp should be 
 * set to a value greater than or equal to the original createdAt, and the 
 * content should match the new value.
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


  updateComment(id: string, newContent: string): Comment | null {
    const comment = this.comments.get(id);
    if (!comment) return null;

    const now = new Date();
    comment.content = newContent;
    comment.updatedAt = now;
    comment.editedAt = now;
    
    return { ...comment };
  }
}

// Generators
const participantNameArb = fc.constantFrom('Никита', 'Саня', 'Ксюша') as fc.Arbitrary<ParticipantName>;
const validContentArb = fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0);
const orderIdArb = fc.uuid();

describe('Property 13: Comment Edit Updates Timestamp', () => {
  let store: CommentStore;

  beforeEach(() => {
    store = new CommentStore();
  });

  it('editedAt is set after edit operation', () => {
    fc.assert(
      fc.property(
        orderIdArb,
        participantNameArb,
        validContentArb,
        validContentArb,
        (orderId, author, originalContent, newContent) => {
          store.reset();
          const comment = store.createComment(orderId, author, originalContent);
          
          // Initially editedAt is null
          expect(comment.editedAt).toBeNull();
          
          // Edit the comment
          const updated = store.updateComment(comment.id, newContent);
          
          // editedAt should now be set
          expect(updated).not.toBeNull();
          expect(updated!.editedAt).not.toBeNull();
          expect(updated!.editedAt).toBeInstanceOf(Date);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('editedAt is greater than or equal to createdAt', () => {
    fc.assert(
      fc.property(
        orderIdArb,
        participantNameArb,
        validContentArb,
        validContentArb,
        (orderId, author, originalContent, newContent) => {
          store.reset();
          const comment = store.createComment(orderId, author, originalContent);
          const createdAt = comment.createdAt;
          
          // Edit the comment
          const updated = store.updateComment(comment.id, newContent);
          
          // editedAt should be >= createdAt
          expect(updated).not.toBeNull();
          expect(updated!.editedAt!.getTime()).toBeGreaterThanOrEqual(createdAt.getTime());
        }
      ),
      { numRuns: 100 }
    );
  });

  it('content matches new value after edit', () => {
    fc.assert(
      fc.property(
        orderIdArb,
        participantNameArb,
        validContentArb,
        validContentArb,
        (orderId, author, originalContent, newContent) => {
          store.reset();
          const comment = store.createComment(orderId, author, originalContent);
          
          // Edit the comment
          const updated = store.updateComment(comment.id, newContent);
          
          // Content should match new value
          expect(updated).not.toBeNull();
          expect(updated!.content).toBe(newContent);
        }
      ),
      { numRuns: 100 }
    );
  });


  it('updatedAt is also set after edit', () => {
    fc.assert(
      fc.property(
        orderIdArb,
        participantNameArb,
        validContentArb,
        validContentArb,
        (orderId, author, originalContent, newContent) => {
          store.reset();
          const comment = store.createComment(orderId, author, originalContent);
          
          // Initially updatedAt is null
          expect(comment.updatedAt).toBeNull();
          
          // Edit the comment
          const updated = store.updateComment(comment.id, newContent);
          
          // updatedAt should now be set
          expect(updated).not.toBeNull();
          expect(updated!.updatedAt).not.toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('multiple edits update editedAt each time', () => {
    fc.assert(
      fc.property(
        orderIdArb,
        participantNameArb,
        validContentArb,
        validContentArb,
        validContentArb,
        (orderId, author, content1, content2, content3) => {
          store.reset();
          const comment = store.createComment(orderId, author, content1);
          
          // First edit
          const afterFirst = store.updateComment(comment.id, content2);
          const firstEditedAt = afterFirst!.editedAt!;
          
          // Small delay to ensure different timestamp
          // (In real tests this would be mocked, but for property testing we verify the invariant)
          
          // Second edit
          const afterSecond = store.updateComment(comment.id, content3);
          const secondEditedAt = afterSecond!.editedAt!;
          
          // Second editedAt should be >= first editedAt
          expect(secondEditedAt.getTime()).toBeGreaterThanOrEqual(firstEditedAt.getTime());
          
          // Content should be the latest
          expect(afterSecond!.content).toBe(content3);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('author remains unchanged after edit', () => {
    fc.assert(
      fc.property(
        orderIdArb,
        participantNameArb,
        validContentArb,
        validContentArb,
        (orderId, author, originalContent, newContent) => {
          store.reset();
          const comment = store.createComment(orderId, author, originalContent);
          
          // Edit the comment
          const updated = store.updateComment(comment.id, newContent);
          
          // Author should remain the same
          expect(updated).not.toBeNull();
          expect(updated!.author).toBe(author);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('createdAt remains unchanged after edit', () => {
    fc.assert(
      fc.property(
        orderIdArb,
        participantNameArb,
        validContentArb,
        validContentArb,
        (orderId, author, originalContent, newContent) => {
          store.reset();
          const comment = store.createComment(orderId, author, originalContent);
          const originalCreatedAt = comment.createdAt;
          
          // Edit the comment
          const updated = store.updateComment(comment.id, newContent);
          
          // createdAt should remain the same
          expect(updated).not.toBeNull();
          expect(updated!.createdAt.getTime()).toBe(originalCreatedAt.getTime());
        }
      ),
      { numRuns: 100 }
    );
  });
});
