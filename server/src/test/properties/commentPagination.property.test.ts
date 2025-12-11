import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';

/**
 * **Feature: team-crm, Property 19: Comment Pagination Completeness**
 * **Validates: Requirements 10.4**
 * 
 * For any order with N comments, paginating through all pages should return 
 * exactly N unique comments with no duplicates and no omissions.
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

interface PaginatedResult {
  comments: Comment[];
  total: number;
  limit: number;
  offset: number;
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


  getCommentsByOrderIdPaginated(orderId: string, limit: number, offset: number): PaginatedResult {
    const allComments = Array.from(this.comments.values())
      .filter(c => c.orderId === orderId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    
    const paginatedComments = allComments.slice(offset, offset + limit);
    
    return {
      comments: paginatedComments.map(c => ({ ...c })),
      total: allComments.length,
      limit,
      offset,
    };
  }

  getCommentCount(orderId: string): number {
    return Array.from(this.comments.values())
      .filter(c => c.orderId === orderId)
      .length;
  }
}

// Generators
const participantNameArb = fc.constantFrom('Никита', 'Саня', 'Ксюша') as fc.Arbitrary<ParticipantName>;
const validContentArb = fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0);
const orderIdArb = fc.uuid();
const pageSizeArb = fc.integer({ min: 1, max: 50 });

describe('Property 19: Comment Pagination Completeness', () => {
  let store: CommentStore;

  beforeEach(() => {
    store = new CommentStore();
  });

  it('paginating through all pages returns exactly N unique comments', () => {
    fc.assert(
      fc.property(
        orderIdArb,
        fc.array(
          fc.tuple(participantNameArb, validContentArb),
          { minLength: 1, maxLength: 20 }
        ),
        pageSizeArb,
        (orderId, commentData, pageSize) => {
          store.reset();
          
          // Create N comments
          const createdComments = commentData.map(([author, content]) => 
            store.createComment(orderId, author, content)
          );
          const expectedCount = createdComments.length;
          
          // Paginate through all pages
          const allRetrievedIds = new Set<string>();
          let offset = 0;
          let totalFromApi = 0;
          
          while (true) {
            const result = store.getCommentsByOrderIdPaginated(orderId, pageSize, offset);
            totalFromApi = result.total;
            
            for (const comment of result.comments) {
              allRetrievedIds.add(comment.id);
            }
            
            // If we got fewer than pageSize, we've reached the end
            if (result.comments.length < pageSize || offset + result.comments.length >= result.total) {
              break;
            }
            
            offset += pageSize;
          }
          
          // Should have exactly N unique comments
          expect(allRetrievedIds.size).toBe(expectedCount);
          expect(totalFromApi).toBe(expectedCount);
          
          // All created comment IDs should be present
          for (const comment of createdComments) {
            expect(allRetrievedIds.has(comment.id)).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('no duplicates across pages', () => {
    fc.assert(
      fc.property(
        orderIdArb,
        fc.array(
          fc.tuple(participantNameArb, validContentArb),
          { minLength: 5, maxLength: 15 }
        ),
        fc.integer({ min: 2, max: 5 }),
        (orderId, commentData, pageSize) => {
          store.reset();
          
          // Create comments
          commentData.forEach(([author, content]) => 
            store.createComment(orderId, author, content)
          );
          
          // Collect all IDs from all pages
          const allIds: string[] = [];
          let offset = 0;
          
          while (true) {
            const result = store.getCommentsByOrderIdPaginated(orderId, pageSize, offset);
            
            for (const comment of result.comments) {
              allIds.push(comment.id);
            }
            
            if (result.comments.length < pageSize || offset + result.comments.length >= result.total) {
              break;
            }
            
            offset += pageSize;
          }
          
          // Check for duplicates
          const uniqueIds = new Set(allIds);
          expect(uniqueIds.size).toBe(allIds.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('total count is consistent across all pages', () => {
    fc.assert(
      fc.property(
        orderIdArb,
        fc.array(
          fc.tuple(participantNameArb, validContentArb),
          { minLength: 1, maxLength: 15 }
        ),
        pageSizeArb,
        (orderId, commentData, pageSize) => {
          store.reset();
          
          // Create comments
          commentData.forEach(([author, content]) => 
            store.createComment(orderId, author, content)
          );
          
          const expectedTotal = commentData.length;
          
          // Check total on multiple pages
          let offset = 0;
          while (true) {
            const result = store.getCommentsByOrderIdPaginated(orderId, pageSize, offset);
            
            // Total should always be the same
            expect(result.total).toBe(expectedTotal);
            
            if (result.comments.length < pageSize || offset + result.comments.length >= result.total) {
              break;
            }
            
            offset += pageSize;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('empty order returns zero comments and zero total', () => {
    fc.assert(
      fc.property(
        orderIdArb,
        pageSizeArb,
        (orderId, pageSize) => {
          store.reset();
          
          const result = store.getCommentsByOrderIdPaginated(orderId, pageSize, 0);
          
          expect(result.comments.length).toBe(0);
          expect(result.total).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('offset beyond total returns empty page but correct total', () => {
    fc.assert(
      fc.property(
        orderIdArb,
        fc.array(
          fc.tuple(participantNameArb, validContentArb),
          { minLength: 1, maxLength: 10 }
        ),
        pageSizeArb,
        (orderId, commentData, pageSize) => {
          store.reset();
          
          // Create comments
          commentData.forEach(([author, content]) => 
            store.createComment(orderId, author, content)
          );
          
          const expectedTotal = commentData.length;
          
          // Request with offset beyond total
          const result = store.getCommentsByOrderIdPaginated(orderId, pageSize, expectedTotal + 10);
          
          expect(result.comments.length).toBe(0);
          expect(result.total).toBe(expectedTotal);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('single page with large limit returns all comments', () => {
    fc.assert(
      fc.property(
        orderIdArb,
        fc.array(
          fc.tuple(participantNameArb, validContentArb),
          { minLength: 1, maxLength: 10 }
        ),
        (orderId, commentData) => {
          store.reset();
          
          // Create comments
          const createdComments = commentData.map(([author, content]) => 
            store.createComment(orderId, author, content)
          );
          
          // Request with limit larger than total
          const result = store.getCommentsByOrderIdPaginated(orderId, 1000, 0);
          
          expect(result.comments.length).toBe(createdComments.length);
          expect(result.total).toBe(createdComments.length);
          
          // All IDs should be present
          const retrievedIds = new Set(result.comments.map(c => c.id));
          for (const comment of createdComments) {
            expect(retrievedIds.has(comment.id)).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('comments from different orders are not mixed', () => {
    fc.assert(
      fc.property(
        orderIdArb,
        orderIdArb,
        fc.array(
          fc.tuple(participantNameArb, validContentArb),
          { minLength: 1, maxLength: 5 }
        ),
        fc.array(
          fc.tuple(participantNameArb, validContentArb),
          { minLength: 1, maxLength: 5 }
        ),
        pageSizeArb,
        (orderId1, orderId2, commentData1, commentData2, pageSize) => {
          // Skip if same order ID
          fc.pre(orderId1 !== orderId2);
          
          store.reset();
          
          // Create comments for both orders
          const order1Comments = commentData1.map(([author, content]) => 
            store.createComment(orderId1, author, content)
          );
          const order2Comments = commentData2.map(([author, content]) => 
            store.createComment(orderId2, author, content)
          );
          
          // Paginate through order1
          const order1Ids = new Set<string>();
          let offset = 0;
          while (true) {
            const result = store.getCommentsByOrderIdPaginated(orderId1, pageSize, offset);
            
            for (const comment of result.comments) {
              order1Ids.add(comment.id);
              // Should only contain order1 comments
              expect(comment.orderId).toBe(orderId1);
            }
            
            if (result.comments.length < pageSize || offset + result.comments.length >= result.total) {
              break;
            }
            offset += pageSize;
          }
          
          // Should have exactly order1 comments
          expect(order1Ids.size).toBe(order1Comments.length);
          
          // None of order2 comments should be in order1 results
          for (const comment of order2Comments) {
            expect(order1Ids.has(comment.id)).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
