import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { validateCreateCategory } from '../../schemas/serviceAccount.schema.js';

/**
 * **Feature: crm-ux-improvements, Property 8: Account Category Grouping**
 * **Validates: Requirements 5.9**
 * 
 * For any set of service accounts, grouping by category should produce groups where
 * each account belongs to exactly one category, and accounts with the same categoryId
 * appear in the same group.
 */

// Generator for category name
const categoryNameArb = fc.string({ minLength: 1, maxLength: 50 })
  .filter(s => s.trim().length > 0);

// Generator for icon (emoji)
const iconArb = fc.constantFrom('📱', '🌐', '🔧', '📁', '💼', '🔒', '📧', '🎮');

// Generator for valid hex color
const colorArb = fc.hexaString({ minLength: 6, maxLength: 6 })
  .map(hex => `#${hex}`);

// Generator for UUID
const uuidArb = fc.uuid();

// Mock account type for testing grouping logic
interface MockAccount {
  id: string;
  serviceName: string;
  categoryId: string | null;
}

// Mock category type
interface MockCategory {
  id: string;
  name: string;
}

/**
 * Groups accounts by category ID.
 * This simulates the expected grouping behavior.
 */
function groupAccountsByCategory(
  accounts: MockAccount[],
  categories: MockCategory[]
): Map<string, MockAccount[]> {
  const categoryMap = new Map(categories.map(c => [c.id, c.name]));
  const grouped = new Map<string, MockAccount[]>();

  for (const account of accounts) {
    const categoryName = account.categoryId 
      ? (categoryMap.get(account.categoryId) ?? 'Other')
      : 'Other';
    
    if (!grouped.has(categoryName)) {
      grouped.set(categoryName, []);
    }
    grouped.get(categoryName)!.push(account);
  }

  return grouped;
}


describe('Property 8: Account Category Grouping', () => {
  it('category creation validates valid data', () => {
    fc.assert(
      fc.property(
        categoryNameArb,
        iconArb,
        colorArb,
        (name, icon, color) => {
          const result = validateCreateCategory({
            name,
            icon,
            color,
          });
          
          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data.name).toBe(name.trim());
            expect(result.data.icon).toBe(icon);
            expect(result.data.color).toBe(color);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('category creation rejects empty name', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('', '   ', '\t', '\n'),
        (name) => {
          const result = validateCreateCategory({ name });
          expect(result.success).toBe(false);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('each account appears in exactly one group', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: uuidArb,
            serviceName: categoryNameArb,
            categoryId: fc.option(uuidArb, { nil: null }),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        fc.array(
          fc.record({
            id: uuidArb,
            name: categoryNameArb,
          }),
          { minLength: 1, maxLength: 5 }
        ),
        (accounts, categories) => {
          const grouped = groupAccountsByCategory(accounts, categories);
          
          // Count total accounts in all groups
          let totalInGroups = 0;
          for (const group of grouped.values()) {
            totalInGroups += group.length;
          }
          
          // Should equal original account count
          expect(totalInGroups).toBe(accounts.length);
          
          // Each account ID should appear exactly once across all groups
          const seenIds = new Set<string>();
          for (const group of grouped.values()) {
            for (const account of group) {
              expect(seenIds.has(account.id)).toBe(false);
              seenIds.add(account.id);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('accounts with same categoryId are in same group', () => {
    fc.assert(
      fc.property(
        uuidArb,
        uuidArb,
        categoryNameArb,
        categoryNameArb,
        categoryNameArb,
        (id1, id2, name1, name2, categoryName) => {
          const categoryId = 'shared-category-id';
          const accounts: MockAccount[] = [
            { id: id1, serviceName: name1, categoryId },
            { id: id2, serviceName: name2, categoryId },
          ];
          const categories: MockCategory[] = [
            { id: categoryId, name: categoryName },
          ];
          
          const grouped = groupAccountsByCategory(accounts, categories);
          
          // Both accounts should be in the same group
          const group = grouped.get(categoryName);
          expect(group).toBeDefined();
          expect(group!.length).toBe(2);
          expect(group!.map(a => a.id).sort()).toEqual([id1, id2].sort());
        }
      ),
      { numRuns: 100 }
    );
  });

  it('accounts with null categoryId go to Other group', () => {
    fc.assert(
      fc.property(
        uuidArb,
        categoryNameArb,
        (id, serviceName) => {
          const accounts: MockAccount[] = [
            { id, serviceName, categoryId: null },
          ];
          const categories: MockCategory[] = [];
          
          const grouped = groupAccountsByCategory(accounts, categories);
          
          // Account should be in "Other" group
          const otherGroup = grouped.get('Other');
          expect(otherGroup).toBeDefined();
          expect(otherGroup!.length).toBe(1);
          expect(otherGroup![0].id).toBe(id);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('category defaults are applied correctly', () => {
    fc.assert(
      fc.property(
        categoryNameArb,
        (name) => {
          const result = validateCreateCategory({ name });
          
          expect(result.success).toBe(true);
          if (result.success) {
            // Default icon and color should be applied
            expect(result.data.icon).toBe('📁');
            expect(result.data.color).toBe('#6366f1');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('color validation rejects invalid formats', () => {
    fc.assert(
      fc.property(
        categoryNameArb,
        fc.constantFrom('red', 'blue', '123456', '#GGG', '#12345', '#1234567'),
        (name, invalidColor) => {
          const result = validateCreateCategory({ name, color: invalidColor });
          expect(result.success).toBe(false);
        }
      ),
      { numRuns: 30 }
    );
  });
});
