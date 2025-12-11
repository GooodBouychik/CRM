import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { filterOrders } from '@/lib/orderUtils';
import type { Order, OrderStatus, Priority, ParticipantName } from '@/types';

/**
 * **Feature: team-crm, Property 2: Filter Returns Matching Items Only**
 * **Validates: Requirements 1.3, 1.4, 1.5, 6.1, 6.2, 6.3**
 * 
 * For any filter criteria (status, priority, search query, author, system flag) and any list of items,
 * all items in the filtered result must match the filter criteria, and no matching items from the
 * original list should be excluded.
 */

// Generators
const orderStatusArb: fc.Arbitrary<OrderStatus> = fc.constantFrom(
  'new', 'in_progress', 'review', 'completed', 'rejected'
);

const priorityArb: fc.Arbitrary<Priority> = fc.constantFrom('high', 'medium', 'low');

const participantNameArb: fc.Arbitrary<ParticipantName> = fc.constantFrom('Никита', 'Саня', 'Ксюша');

const orderArb: fc.Arbitrary<Order> = fc.record({
  id: fc.uuid(),
  orderNumber: fc.integer({ min: 1, max: 10000 }),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  description: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
  clientName: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
  amount: fc.option(fc.integer({ min: 0, max: 10000000 }), { nil: null }),
  status: orderStatusArb,
  priority: priorityArb,
  dueDate: fc.option(fc.date({ min: new Date('2024-01-01'), max: new Date('2026-12-31') }), { nil: null }),
  tags: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 5 }),
  assignedTo: fc.array(participantNameArb, { maxLength: 3 }),
  isFavorite: fc.boolean(),
  createdAt: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
  updatedAt: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
  updatedBy: participantNameArb,
});

describe('Property 2: Filter Returns Matching Items Only', () => {
  it('status filter returns only orders with matching status', () => {
    fc.assert(
      fc.property(
        fc.array(orderArb, { minLength: 0, maxLength: 50 }),
        orderStatusArb,
        (orders, status) => {
          const filtered = filterOrders(orders, { status });
          
          // All filtered items must have the specified status
          expect(filtered.every(o => o.status === status)).toBe(true);
          
          // All items with matching status should be included
          const expectedCount = orders.filter(o => o.status === status).length;
          expect(filtered.length).toBe(expectedCount);
        }
      ),
      { numRuns: 100 }
    );
  });


  it('priority filter returns only orders with matching priority', () => {
    fc.assert(
      fc.property(
        fc.array(orderArb, { minLength: 0, maxLength: 50 }),
        priorityArb,
        (orders, priority) => {
          const filtered = filterOrders(orders, { priority });
          
          // All filtered items must have the specified priority
          expect(filtered.every(o => o.priority === priority)).toBe(true);
          
          // All items with matching priority should be included
          const expectedCount = orders.filter(o => o.priority === priority).length;
          expect(filtered.length).toBe(expectedCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('search filter returns only orders matching search query', () => {
    fc.assert(
      fc.property(
        fc.array(orderArb, { minLength: 0, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 10 }),
        (orders, searchQuery) => {
          const filtered = filterOrders(orders, { search: searchQuery });
          const searchLower = searchQuery.toLowerCase();
          
          // All filtered items must match the search query in ID, title, or client
          filtered.forEach(order => {
            const matchesId = `#${String(order.orderNumber).padStart(3, '0')}`.toLowerCase().includes(searchLower);
            const matchesTitle = order.title.toLowerCase().includes(searchLower);
            const matchesClient = (order.clientName || '').toLowerCase().includes(searchLower);
            expect(matchesId || matchesTitle || matchesClient).toBe(true);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('combined filters are applied conjunctively (AND)', () => {
    fc.assert(
      fc.property(
        fc.array(orderArb, { minLength: 0, maxLength: 50 }),
        orderStatusArb,
        priorityArb,
        (orders, status, priority) => {
          const filtered = filterOrders(orders, { status, priority });
          
          // All filtered items must match BOTH criteria
          expect(filtered.every(o => o.status === status && o.priority === priority)).toBe(true);
          
          // Count should match items that satisfy both conditions
          const expectedCount = orders.filter(o => o.status === status && o.priority === priority).length;
          expect(filtered.length).toBe(expectedCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('null filters return all items', () => {
    fc.assert(
      fc.property(
        fc.array(orderArb, { minLength: 0, maxLength: 50 }),
        (orders) => {
          const filtered = filterOrders(orders, { status: null, priority: null, search: '' });
          
          // Should return all items
          expect(filtered.length).toBe(orders.length);
          
          // Same elements
          const originalIds = new Set(orders.map(o => o.id));
          const filteredIds = new Set(filtered.map(o => o.id));
          expect(filteredIds).toEqual(originalIds);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('filtering does not modify original array', () => {
    fc.assert(
      fc.property(
        fc.array(orderArb, { minLength: 1, maxLength: 20 }),
        orderStatusArb,
        (orders, status) => {
          const originalLength = orders.length;
          const originalIds = orders.map(o => o.id);
          
          filterOrders(orders, { status });
          
          // Original array should be unchanged
          expect(orders.length).toBe(originalLength);
          expect(orders.map(o => o.id)).toEqual(originalIds);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('no matching items from original list are excluded', () => {
    fc.assert(
      fc.property(
        fc.array(orderArb, { minLength: 0, maxLength: 50 }),
        orderStatusArb,
        (orders, status) => {
          const filtered = filterOrders(orders, { status });
          const filteredIds = new Set(filtered.map(o => o.id));
          
          // Every order that matches the filter should be in the result
          orders.forEach(order => {
            if (order.status === status) {
              expect(filteredIds.has(order.id)).toBe(true);
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
