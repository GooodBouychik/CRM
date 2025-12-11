import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  categorizeOrder,
  categorizeOrders,
  getDaysUntilDeadline,
  type UnreadInfo,
} from '@/lib/dashboardUtils';
import type { Order, OrderStatus, Priority, ParticipantName } from '@/types';

/**
 * **Feature: team-crm, Property 18: Dashboard Categorization Correctness**
 * **Validates: Requirements 9.1, 9.2, 9.3**
 * 
 * For any order, it should appear in exactly one dashboard section based on these rules:
 * - Urgent: deadline ≤3 days OR high priority in review OR has unread mentions/replies
 * - In Progress: assigned to current participant
 * - Waiting: orders due this week (4-7 days)
 */

// Generators
const orderStatusArb: fc.Arbitrary<OrderStatus> = fc.constantFrom(
  'new', 'in_progress', 'review', 'completed', 'rejected'
);

const priorityArb: fc.Arbitrary<Priority> = fc.constantFrom('high', 'medium', 'low');

const participantNameArb: fc.Arbitrary<ParticipantName> = fc.constantFrom('Никита', 'Саня', 'Ксюша');

// Generate a date relative to now for testing deadline logic
const relativeDateArb = (minDays: number, maxDays: number): fc.Arbitrary<Date> => {
  return fc.integer({ min: minDays, max: maxDays }).map(days => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    date.setHours(12, 0, 0, 0);
    return date;
  });
};

const orderArb: fc.Arbitrary<Order> = fc.record({
  id: fc.uuid(),
  orderNumber: fc.integer({ min: 1, max: 10000 }),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  description: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
  clientName: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
  amount: fc.option(fc.integer({ min: 0, max: 10000000 }), { nil: null }),
  status: orderStatusArb,
  priority: priorityArb,
  dueDate: fc.option(relativeDateArb(-10, 30), { nil: null }),
  tags: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 5 }),
  assignedTo: fc.array(participantNameArb, { maxLength: 3 }),
  isFavorite: fc.boolean(),
  createdAt: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
  updatedAt: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
  updatedBy: participantNameArb,
});

const unreadInfoArb: fc.Arbitrary<UnreadInfo> = fc.record({
  mentions: fc.array(fc.uuid(), { maxLength: 5 }),
  replies: fc.array(fc.uuid(), { maxLength: 5 }),
});

describe('Property 18: Dashboard Categorization Correctness', () => {
  describe('Urgent categorization', () => {
    it('orders with deadline ≤3 days are categorized as urgent', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -5, max: 3 }),
          participantNameArb,
          (daysAhead, currentUser) => {
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + daysAhead);
            dueDate.setHours(12, 0, 0, 0);
            
            const order: Order = {
              id: 'test-id',
              orderNumber: 1,
              title: 'Test Order',
              description: null,
              clientName: null,
              amount: null,
              status: 'new',
              priority: 'low',
              dueDate: dueDate,
              tags: [],
              assignedTo: [],
              isFavorite: false,
              createdAt: new Date(),
              updatedAt: new Date(),
              updatedBy: currentUser,
            };
            const unreadInfo: UnreadInfo = { mentions: [], replies: [] };
            const category = categorizeOrder(order, currentUser, unreadInfo);
            expect(category).toBe('urgent');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('high priority orders in review status are categorized as urgent', () => {
      fc.assert(
        fc.property(
          orderArb.map(order => ({
            ...order,
            priority: 'high' as Priority,
            status: 'review' as OrderStatus,
            dueDate: null, // No deadline to isolate this condition
          })),
          participantNameArb,
          (order, currentUser) => {
            const unreadInfo: UnreadInfo = { mentions: [], replies: [] };
            const category = categorizeOrder(order, currentUser, unreadInfo);
            expect(category).toBe('urgent');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('orders with unread mentions are categorized as urgent', () => {
      fc.assert(
        fc.property(
          orderArb.map(order => ({
            ...order,
            priority: 'low' as Priority,
            status: 'new' as OrderStatus,
            dueDate: null,
            assignedTo: [] as ParticipantName[],
          })),
          participantNameArb,
          (order, currentUser) => {
            const unreadInfo: UnreadInfo = { mentions: [order.id], replies: [] };
            const category = categorizeOrder(order, currentUser, unreadInfo);
            expect(category).toBe('urgent');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('orders with unread replies are categorized as urgent', () => {
      fc.assert(
        fc.property(
          orderArb.map(order => ({
            ...order,
            priority: 'low' as Priority,
            status: 'new' as OrderStatus,
            dueDate: null,
            assignedTo: [] as ParticipantName[],
          })),
          participantNameArb,
          (order, currentUser) => {
            const unreadInfo: UnreadInfo = { mentions: [], replies: [order.id] };
            const category = categorizeOrder(order, currentUser, unreadInfo);
            expect(category).toBe('urgent');
          }
        ),
        { numRuns: 100 }
      );
    });
  });


  describe('In Progress categorization', () => {
    it('orders assigned to current user are categorized as inProgress (when not urgent)', () => {
      fc.assert(
        fc.property(
          participantNameArb,
          (currentUser) => {
            // Create order that is assigned to user but not urgent
            const order: Order = {
              id: 'test-id',
              orderNumber: 1,
              title: 'Test Order',
              description: null,
              clientName: null,
              amount: null,
              status: 'new',
              priority: 'low',
              dueDate: null, // No deadline
              tags: [],
              assignedTo: [currentUser],
              isFavorite: false,
              createdAt: new Date(),
              updatedAt: new Date(),
              updatedBy: currentUser,
            };
            const unreadInfo: UnreadInfo = { mentions: [], replies: [] };
            const category = categorizeOrder(order, currentUser, unreadInfo);
            expect(category).toBe('inProgress');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('orders not assigned to current user are not categorized as inProgress', () => {
      fc.assert(
        fc.property(
          orderArb.map(order => ({
            ...order,
            dueDate: null,
            priority: 'low' as Priority,
            status: 'new' as OrderStatus,
            assignedTo: [] as ParticipantName[],
          })),
          participantNameArb,
          (order, currentUser) => {
            const unreadInfo: UnreadInfo = { mentions: [], replies: [] };
            const category = categorizeOrder(order, currentUser, unreadInfo);
            expect(category).not.toBe('inProgress');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Waiting categorization', () => {
    it('orders due in 4-7 days are categorized as waiting (when not urgent or in progress)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 4, max: 7 }),
          participantNameArb,
          (daysAhead, currentUser) => {
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + daysAhead);
            dueDate.setHours(12, 0, 0, 0);
            
            const order: Order = {
              id: 'test-id',
              orderNumber: 1,
              title: 'Test Order',
              description: null,
              clientName: null,
              amount: null,
              status: 'new',
              priority: 'low',
              dueDate: dueDate,
              tags: [],
              assignedTo: [], // Not assigned to anyone
              isFavorite: false,
              createdAt: new Date(),
              updatedAt: new Date(),
              updatedBy: currentUser,
            };
            const unreadInfo: UnreadInfo = { mentions: [], replies: [] };
            const category = categorizeOrder(order, currentUser, unreadInfo);
            expect(category).toBe('waiting');
          }
        ),
        { numRuns: 100 }
      );
    });
  });


  describe('Mutual exclusivity', () => {
    it('each order appears in at most one category', () => {
      fc.assert(
        fc.property(
          fc.array(orderArb, { minLength: 1, maxLength: 20 }),
          participantNameArb,
          unreadInfoArb,
          (orders, currentUser, unreadInfo) => {
            const categorized = categorizeOrders(orders, currentUser, unreadInfo);
            
            // Check that no order appears in multiple categories
            const urgentIds = new Set(categorized.urgent.map(o => o.id));
            const inProgressIds = new Set(categorized.inProgress.map(o => o.id));
            const waitingIds = new Set(categorized.waiting.map(o => o.id));
            
            // No overlap between urgent and inProgress
            Array.from(urgentIds).forEach(id => {
              expect(inProgressIds.has(id)).toBe(false);
              expect(waitingIds.has(id)).toBe(false);
            });
            
            // No overlap between inProgress and waiting
            Array.from(inProgressIds).forEach(id => {
              expect(waitingIds.has(id)).toBe(false);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('urgent takes priority over inProgress', () => {
      fc.assert(
        fc.property(
          participantNameArb,
          (currentUser) => {
            // Order that qualifies for both urgent (deadline ≤3 days) and inProgress (assigned)
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 2); // 2 days = urgent
            
            const order: Order = {
              id: 'test-id',
              orderNumber: 1,
              title: 'Test Order',
              description: null,
              clientName: null,
              amount: null,
              status: 'new',
              priority: 'low',
              dueDate: dueDate,
              tags: [],
              assignedTo: [currentUser], // Also assigned
              isFavorite: false,
              createdAt: new Date(),
              updatedAt: new Date(),
              updatedBy: currentUser,
            };
            const unreadInfo: UnreadInfo = { mentions: [], replies: [] };
            const category = categorizeOrder(order, currentUser, unreadInfo);
            
            // Should be urgent, not inProgress
            expect(category).toBe('urgent');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('inProgress takes priority over waiting', () => {
      fc.assert(
        fc.property(
          participantNameArb,
          (currentUser) => {
            // Order that qualifies for both inProgress (assigned) and waiting (due in 5 days)
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 5); // 5 days = waiting range
            
            const order: Order = {
              id: 'test-id',
              orderNumber: 1,
              title: 'Test Order',
              description: null,
              clientName: null,
              amount: null,
              status: 'new',
              priority: 'low',
              dueDate: dueDate,
              tags: [],
              assignedTo: [currentUser], // Assigned
              isFavorite: false,
              createdAt: new Date(),
              updatedAt: new Date(),
              updatedBy: currentUser,
            };
            const unreadInfo: UnreadInfo = { mentions: [], replies: [] };
            const category = categorizeOrder(order, currentUser, unreadInfo);
            
            // Should be inProgress, not waiting
            expect(category).toBe('inProgress');
          }
        ),
        { numRuns: 100 }
      );
    });
  });


  describe('Completeness', () => {
    it('categorizeOrders preserves all categorizable orders', () => {
      fc.assert(
        fc.property(
          fc.array(orderArb, { minLength: 0, maxLength: 20 }),
          participantNameArb,
          unreadInfoArb,
          (orders, currentUser, unreadInfo) => {
            const categorized = categorizeOrders(orders, currentUser, unreadInfo);
            const totalCategorized = 
              categorized.urgent.length + 
              categorized.inProgress.length + 
              categorized.waiting.length;
            
            // Count how many orders should be categorized
            let expectedCount = 0;
            for (const order of orders) {
              const category = categorizeOrder(order, currentUser, unreadInfo);
              if (category !== null) {
                expectedCount++;
              }
            }
            
            expect(totalCategorized).toBe(expectedCount);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('getDaysUntilDeadline helper', () => {
    it('returns null for null deadline', () => {
      expect(getDaysUntilDeadline(null)).toBe(null);
    });

    it('calculates correct days for future dates', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 365 }),
          (daysAhead) => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + daysAhead);
            futureDate.setHours(12, 0, 0, 0);
            
            const result = getDaysUntilDeadline(futureDate);
            expect(result).toBeGreaterThanOrEqual(daysAhead - 1);
            expect(result).toBeLessThanOrEqual(daysAhead + 1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('calculates correct days for past dates', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 30 }),
          (daysAgo) => {
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - daysAgo);
            pastDate.setHours(12, 0, 0, 0);
            
            const result = getDaysUntilDeadline(pastDate);
            expect(result).toBeLessThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
