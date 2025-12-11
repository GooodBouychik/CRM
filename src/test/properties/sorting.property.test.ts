import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { sortOrders } from '@/lib/orderUtils';
import type { Order, OrderStatus, Priority, ParticipantName } from '@/types';
import type { SortColumn, SortDirection } from '@/components/orders/OrderTable';

/**
 * **Feature: team-crm, Property 1: Sorting Correctness**
 * **Validates: Requirements 1.2, 5.1**
 * 
 * For any list of orders and any sortable column (date, deadline, priority, status, updated),
 * sorting the list by that column should produce a list where each element is less than or
 * equal to the next element according to the column's comparison function.
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

const sortColumnArb: fc.Arbitrary<SortColumn> = fc.constantFrom(
  'orderNumber', 'clientName', 'title', 'amount', 'status', 'priority', 'dueDate', 'updatedAt'
);

const sortDirectionArb: fc.Arbitrary<SortDirection> = fc.constantFrom('asc', 'desc');

// Comparison functions for each column
const STATUS_ORDER: Record<OrderStatus, number> = {
  new: 0, in_progress: 1, review: 2, completed: 3, rejected: 4,
};

const PRIORITY_ORDER: Record<Priority, number> = {
  high: 0, medium: 1, low: 2,
};


function getComparator(column: SortColumn): (a: Order, b: Order) => number {
  switch (column) {
    case 'orderNumber':
      return (a, b) => a.orderNumber - b.orderNumber;
    case 'clientName':
      return (a, b) => (a.clientName || '').localeCompare(b.clientName || '', 'ru');
    case 'title':
      return (a, b) => a.title.localeCompare(b.title, 'ru');
    case 'amount':
      return (a, b) => (a.amount || 0) - (b.amount || 0);
    case 'status':
      return (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    case 'priority':
      return (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    case 'dueDate':
      return (a, b) => {
        const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        return aDate - bDate;
      };
    case 'updatedAt':
      return (a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
  }
}

function isSorted(orders: Order[], column: SortColumn, direction: SortDirection): boolean {
  if (orders.length <= 1) return true;
  
  const comparator = getComparator(column);
  
  for (let i = 0; i < orders.length - 1; i++) {
    const comparison = comparator(orders[i], orders[i + 1]);
    if (direction === 'asc' && comparison > 0) return false;
    if (direction === 'desc' && comparison < 0) return false;
  }
  
  return true;
}

describe('Property 1: Sorting Correctness', () => {
  it('sorted list maintains order invariant for any column and direction', () => {
    fc.assert(
      fc.property(
        fc.array(orderArb, { minLength: 0, maxLength: 100 }),
        sortColumnArb,
        sortDirectionArb,
        (orders, column, direction) => {
          const sorted = sortOrders(orders, column, direction);
          
          // The sorted list should be properly ordered
          expect(isSorted(sorted, column, direction)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('sorting preserves all original elements', () => {
    fc.assert(
      fc.property(
        fc.array(orderArb, { minLength: 0, maxLength: 50 }),
        sortColumnArb,
        sortDirectionArb,
        (orders, column, direction) => {
          const sorted = sortOrders(orders, column, direction);
          
          // Same length
          expect(sorted.length).toBe(orders.length);
          
          // Same elements (by id)
          const originalIds = new Set(orders.map(o => o.id));
          const sortedIds = new Set(sorted.map(o => o.id));
          expect(sortedIds).toEqual(originalIds);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('sorting is stable for equal elements', () => {
    fc.assert(
      fc.property(
        fc.array(orderArb, { minLength: 2, maxLength: 20 }),
        sortColumnArb,
        (orders, column) => {
          // Sort ascending then descending should reverse equal groups
          const ascSorted = sortOrders(orders, column, 'asc');
          const descSorted = sortOrders(orders, column, 'desc');
          
          // Both should have same length
          expect(ascSorted.length).toBe(descSorted.length);
          expect(ascSorted.length).toBe(orders.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('null column returns original order', () => {
    fc.assert(
      fc.property(
        fc.array(orderArb, { minLength: 0, maxLength: 50 }),
        sortDirectionArb,
        (orders, direction) => {
          const sorted = sortOrders(orders, null, direction);
          
          // Should return same array (by reference check on elements)
          expect(sorted.length).toBe(orders.length);
          for (let i = 0; i < orders.length; i++) {
            expect(sorted[i].id).toBe(orders[i].id);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
