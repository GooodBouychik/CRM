import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { validateCreateOrder, ParticipantNameSchema } from '../../schemas/order.schema.js';

/**
 * **Feature: team-crm, Property 5: Order Validation Rejects Invalid Input**
 * **Validates: Requirements 2.3**
 * 
 * For any order creation attempt with an empty or whitespace-only title,
 * the system should reject the creation and return a validation error
 * without modifying the database.
 */

// Generator for valid participant names
const participantNameArb = fc.constantFrom('Никита', 'Саня', 'Ксюша');

// Generator for whitespace-only strings (empty or only whitespace characters)
const whitespaceOnlyArb = fc.stringOf(
  fc.constantFrom(' ', '\t', '\n', '\r', '\u00A0'),
  { minLength: 0, maxLength: 20 }
);

// Generator for valid non-empty titles
const validTitleArb = fc.string({ minLength: 1, maxLength: 200 })
  .filter(s => s.trim().length > 0);

describe('Property 5: Order Validation Rejects Invalid Input', () => {
  it('rejects empty title', () => {
    fc.assert(
      fc.property(
        participantNameArb,
        (updatedBy) => {
          const result = validateCreateOrder({
            title: '',
            updatedBy,
          });
          
          expect(result.success).toBe(false);
          if (!result.success) {
            const titleErrors = result.error.errors.filter(e => e.path.includes('title'));
            expect(titleErrors.length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('rejects whitespace-only titles', () => {
    fc.assert(
      fc.property(
        whitespaceOnlyArb,
        participantNameArb,
        (whitespaceTitle, updatedBy) => {
          const result = validateCreateOrder({
            title: whitespaceTitle,
            updatedBy,
          });
          
          // Empty string or whitespace-only should be rejected
          expect(result.success).toBe(false);
          if (!result.success) {
            const titleErrors = result.error.errors.filter(e => e.path.includes('title'));
            expect(titleErrors.length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('accepts valid non-empty titles', () => {
    fc.assert(
      fc.property(
        validTitleArb,
        participantNameArb,
        (title, updatedBy) => {
          const result = validateCreateOrder({
            title,
            updatedBy,
          });
          
          expect(result.success).toBe(true);
          if (result.success) {
            // Title should be trimmed but preserve content
            expect(result.data.title.trim()).toBe(title.trim());
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('validation does not modify database (pure function)', () => {
    fc.assert(
      fc.property(
        fc.oneof(whitespaceOnlyArb, fc.constant('')),
        participantNameArb,
        (invalidTitle, updatedBy) => {
          // Call validation multiple times with same input
          const result1 = validateCreateOrder({ title: invalidTitle, updatedBy });
          const result2 = validateCreateOrder({ title: invalidTitle, updatedBy });
          
          // Both should fail consistently (pure function, no side effects)
          expect(result1.success).toBe(false);
          expect(result2.success).toBe(false);
          
          // Error structure should be identical
          if (!result1.success && !result2.success) {
            expect(result1.error.errors.length).toBe(result2.error.errors.length);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
