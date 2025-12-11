import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { classifyDeadline, getDeadlineClass } from '@/components/orders/OrderTable';

/**
 * **Feature: team-crm, Property 3: Deadline Classification Consistency**
 * **Validates: Requirements 1.6, 1.7**
 * 
 * For any order with a deadline, the deadline classification (red for ≤3 days,
 * yellow for 4-7 days, normal for >7 days) should be consistent with the actual
 * number of days remaining calculated from the current date.
 */

// Helper to calculate days difference
function daysDifference(dueDate: Date, now: Date): number {
  const diffTime = dueDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Valid date generator that filters out NaN dates
const validDateArb = fc.date({ min: new Date('2024-01-01'), max: new Date('2026-12-31') })
  .filter(d => !isNaN(d.getTime()));

describe('Property 3: Deadline Classification Consistency', () => {
  it('classifies deadlines ≤3 days as urgent', () => {
    fc.assert(
      fc.property(
        validDateArb,
        fc.integer({ min: -30, max: 3 }),
        (now, daysAhead) => {
          const dueDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
          const classification = classifyDeadline(dueDate, now);
          
          expect(classification).toBe('urgent');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('classifies deadlines 4-7 days as warning', () => {
    fc.assert(
      fc.property(
        validDateArb,
        fc.integer({ min: 4, max: 7 }),
        (now, daysAhead) => {
          const dueDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
          const classification = classifyDeadline(dueDate, now);
          
          expect(classification).toBe('warning');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('classifies deadlines >7 days as normal', () => {
    fc.assert(
      fc.property(
        validDateArb,
        fc.integer({ min: 8, max: 365 }),
        (now, daysAhead) => {
          const dueDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
          const classification = classifyDeadline(dueDate, now);
          
          expect(classification).toBe('normal');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('null deadline is classified as normal', () => {
    fc.assert(
      fc.property(
        validDateArb,
        (now) => {
          const classification = classifyDeadline(null, now);
          expect(classification).toBe('normal');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('classification is consistent with days calculation', () => {
    fc.assert(
      fc.property(
        validDateArb,
        fc.integer({ min: -30, max: 365 }),
        (now, daysAhead) => {
          const dueDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
          const classification = classifyDeadline(dueDate, now);
          const days = daysDifference(dueDate, now);
          
          if (days <= 3) {
            expect(classification).toBe('urgent');
          } else if (days <= 7) {
            expect(classification).toBe('warning');
          } else {
            expect(classification).toBe('normal');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('getDeadlineClass returns correct CSS class for classification', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -30, max: 365 }),
        (daysAhead) => {
          const dueDate = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);
          const cssClass = getDeadlineClass(dueDate);
          const days = daysDifference(dueDate, new Date());
          
          if (days <= 3) {
            expect(cssClass).toBe('text-deadline-urgent');
          } else if (days <= 7) {
            expect(cssClass).toBe('text-deadline-warning');
          } else {
            expect(cssClass).toBe('');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('null deadline returns empty CSS class', () => {
    const cssClass = getDeadlineClass(null);
    expect(cssClass).toBe('');
  });
});
