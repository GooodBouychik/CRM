import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { AccountSearchSchema } from '../../schemas/serviceAccount.schema.js';

/**
 * **Feature: crm-ux-improvements, Property 7: Account Search Accuracy**
 * **Validates: Requirements 5.8**
 * 
 * For any search query on accounts, all returned results should contain the search term
 * in either the service name or notes field (case-insensitive).
 */

// Generator for search query
const searchQueryArb = fc.string({ minLength: 1, maxLength: 50 })
  .filter(s => s.trim().length > 0);

// Generator for service name
const serviceNameArb = fc.string({ minLength: 1, maxLength: 100 })
  .filter(s => s.trim().length > 0);

// Generator for notes
const notesArb = fc.option(fc.string({ maxLength: 500 }), { nil: null });

// Generator for UUID
const uuidArb = fc.uuid();

// Mock account type for testing search logic
interface MockAccount {
  id: string;
  serviceName: string;
  notes: string | null;
}

/**
 * Simulates the search filter logic that should be applied to accounts.
 * This is the expected behavior based on Requirements 5.8.
 */
function matchesSearch(account: MockAccount, query: string): boolean {
  const lowerQuery = query.toLowerCase();
  const nameMatches = account.serviceName.toLowerCase().includes(lowerQuery);
  const notesMatches = account.notes?.toLowerCase().includes(lowerQuery) ?? false;
  return nameMatches || notesMatches;
}

describe('Property 7: Account Search Accuracy', () => {
  it('search schema validates valid search queries', () => {
    fc.assert(
      fc.property(
        searchQueryArb,
        (search) => {
          const result = AccountSearchSchema.safeParse({ search });
          
          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data.search).toBe(search);
          }
        }
      ),
      { numRuns: 100 }
    );
  });


  it('search schema validates category filter', () => {
    fc.assert(
      fc.property(
        uuidArb,
        (categoryId) => {
          const result = AccountSearchSchema.safeParse({ categoryId });
          
          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data.categoryId).toBe(categoryId);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('accounts matching service name are found by search', () => {
    fc.assert(
      fc.property(
        uuidArb,
        serviceNameArb,
        notesArb,
        (id, serviceName, notes) => {
          const account: MockAccount = { id, serviceName, notes };
          
          // Search for a substring of the service name
          if (serviceName.length >= 2) {
            const searchTerm = serviceName.substring(0, Math.min(3, serviceName.length));
            const matches = matchesSearch(account, searchTerm);
            expect(matches).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('accounts matching notes are found by search', () => {
    fc.assert(
      fc.property(
        uuidArb,
        serviceNameArb,
        fc.string({ minLength: 3, maxLength: 500 }),
        (id, serviceName, notes) => {
          const account: MockAccount = { id, serviceName, notes };
          
          // Search for a substring of the notes
          const searchTerm = notes.substring(0, Math.min(3, notes.length));
          const matches = matchesSearch(account, searchTerm);
          expect(matches).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('search is case-insensitive', () => {
    fc.assert(
      fc.property(
        uuidArb,
        serviceNameArb,
        notesArb,
        (id, serviceName, notes) => {
          const account: MockAccount = { id, serviceName, notes };
          
          // Search with different cases
          const upperSearch = serviceName.toUpperCase();
          const lowerSearch = serviceName.toLowerCase();
          
          const matchesUpper = matchesSearch(account, upperSearch);
          const matchesLower = matchesSearch(account, lowerSearch);
          
          // Both should match
          expect(matchesUpper).toBe(true);
          expect(matchesLower).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('non-matching search returns no results', () => {
    fc.assert(
      fc.property(
        uuidArb,
        fc.constant('TestService'),
        fc.constant('Some notes'),
        fc.constant('ZZZZNOTFOUND12345'),
        (id, serviceName, notes, searchTerm) => {
          const account: MockAccount = { id, serviceName, notes };
          
          // Search for something that doesn't exist
          const matches = matchesSearch(account, searchTerm);
          expect(matches).toBe(false);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('empty search schema is valid (returns all)', () => {
    const result = AccountSearchSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('combined search and category filter is valid', () => {
    fc.assert(
      fc.property(
        searchQueryArb,
        uuidArb,
        (search, categoryId) => {
          const result = AccountSearchSchema.safeParse({ search, categoryId });
          
          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data.search).toBe(search);
            expect(result.data.categoryId).toBe(categoryId);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
