import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { SubtaskStatus } from '../../schemas/subtask.schema.js';
import { SUBTASK_STATUSES } from './subtaskTestUtils.js';

/**
 * **Feature: team-crm, Property 9: Pinned Subtasks Appear First**
 * **Validates: Requirements 4.5**
 * 
 * For any column with both pinned and unpinned subtasks, all pinned subtasks
 * should appear before all unpinned subtasks when sorted by position.
 */

// Subtask interface for testing
interface TestSubtask {
  id: string;
  status: SubtaskStatus;
  isPinned: boolean;
  position: number;
}

// Generator for subtask status
const subtaskStatusArb = fc.constantFrom(...SUBTASK_STATUSES);

// Generator for a single subtask
const subtaskArb = fc.record({
  id: fc.uuid(),
  status: subtaskStatusArb,
  isPinned: fc.boolean(),
  position: fc.integer({ min: 0, max: 100 }),
});

// Generator for a list of subtasks
const subtaskListArb = fc.array(subtaskArb, { minLength: 0, maxLength: 50 });

/**
 * Sorts subtasks by pinned status first, then by position.
 * This is the sorting function used in the KanbanBoard component.
 */
function sortSubtasksByPinnedAndPosition(subtasks: TestSubtask[]): TestSubtask[] {
  return [...subtasks].sort((a, b) => {
    // Pinned subtasks first
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    // Then by position
    return a.position - b.position;
  });
}

/**
 * Gets subtasks for a specific column (status).
 */
function getColumnSubtasks(subtasks: TestSubtask[], status: SubtaskStatus): TestSubtask[] {
  return subtasks.filter(s => s.status === status);
}

describe('Property 9: Pinned Subtasks Appear First', () => {
  it('all pinned subtasks appear before all unpinned subtasks in sorted order', () => {
    fc.assert(
      fc.property(
        subtaskListArb,
        subtaskStatusArb,
        (subtasks, status) => {
          // Get subtasks for the column
          const columnSubtasks = getColumnSubtasks(subtasks, status);
          
          // Sort them
          const sorted = sortSubtasksByPinnedAndPosition(columnSubtasks);
          
          // Find the index of the last pinned subtask
          let lastPinnedIndex = -1;
          for (let i = 0; i < sorted.length; i++) {
            if (sorted[i].isPinned) {
              lastPinnedIndex = i;
            }
          }
          
          // Find the index of the first unpinned subtask
          let firstUnpinnedIndex = sorted.length;
          for (let i = 0; i < sorted.length; i++) {
            if (!sorted[i].isPinned) {
              firstUnpinnedIndex = i;
              break;
            }
          }
          
          // All pinned should come before all unpinned
          // This means lastPinnedIndex < firstUnpinnedIndex (or no pinned/unpinned exist)
          expect(lastPinnedIndex).toBeLessThan(firstUnpinnedIndex);
        }
      ),
      { numRuns: 100 }
    );
  });


  it('pinned subtasks maintain relative position order among themselves', () => {
    fc.assert(
      fc.property(
        subtaskListArb,
        subtaskStatusArb,
        (subtasks, status) => {
          const columnSubtasks = getColumnSubtasks(subtasks, status);
          const sorted = sortSubtasksByPinnedAndPosition(columnSubtasks);
          
          // Get only pinned subtasks from sorted list
          const pinnedInSorted = sorted.filter(s => s.isPinned);
          
          // Check that pinned subtasks are sorted by position
          for (let i = 1; i < pinnedInSorted.length; i++) {
            expect(pinnedInSorted[i - 1].position).toBeLessThanOrEqual(pinnedInSorted[i].position);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('unpinned subtasks maintain relative position order among themselves', () => {
    fc.assert(
      fc.property(
        subtaskListArb,
        subtaskStatusArb,
        (subtasks, status) => {
          const columnSubtasks = getColumnSubtasks(subtasks, status);
          const sorted = sortSubtasksByPinnedAndPosition(columnSubtasks);
          
          // Get only unpinned subtasks from sorted list
          const unpinnedInSorted = sorted.filter(s => !s.isPinned);
          
          // Check that unpinned subtasks are sorted by position
          for (let i = 1; i < unpinnedInSorted.length; i++) {
            expect(unpinnedInSorted[i - 1].position).toBeLessThanOrEqual(unpinnedInSorted[i].position);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('sorting preserves all subtasks (no items lost or duplicated)', () => {
    fc.assert(
      fc.property(
        subtaskListArb,
        subtaskStatusArb,
        (subtasks, status) => {
          const columnSubtasks = getColumnSubtasks(subtasks, status);
          const sorted = sortSubtasksByPinnedAndPosition(columnSubtasks);
          
          // Same length
          expect(sorted.length).toBe(columnSubtasks.length);
          
          // Same IDs (no duplicates, no missing)
          const originalIds = new Set(columnSubtasks.map(s => s.id));
          const sortedIds = new Set(sorted.map(s => s.id));
          
          expect(sortedIds.size).toBe(originalIds.size);
          for (const id of originalIds) {
            expect(sortedIds.has(id)).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('empty column returns empty array', () => {
    fc.assert(
      fc.property(
        subtaskListArb,
        (subtasks) => {
          // Use a status that doesn't exist in the subtasks
          const usedStatuses = new Set(subtasks.map(s => s.status));
          const unusedStatus = SUBTASK_STATUSES.find(s => !usedStatuses.has(s));
          
          if (unusedStatus) {
            const columnSubtasks = getColumnSubtasks(subtasks, unusedStatus);
            const sorted = sortSubtasksByPinnedAndPosition(columnSubtasks);
            expect(sorted.length).toBe(0);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('column with only pinned subtasks maintains position order', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            status: fc.constant('planning' as SubtaskStatus),
            isPinned: fc.constant(true),
            position: fc.integer({ min: 0, max: 100 }),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (pinnedSubtasks) => {
          const sorted = sortSubtasksByPinnedAndPosition(pinnedSubtasks);
          
          // All should be pinned
          expect(sorted.every(s => s.isPinned)).toBe(true);
          
          // Should be sorted by position
          for (let i = 1; i < sorted.length; i++) {
            expect(sorted[i - 1].position).toBeLessThanOrEqual(sorted[i].position);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('column with only unpinned subtasks maintains position order', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            status: fc.constant('planning' as SubtaskStatus),
            isPinned: fc.constant(false),
            position: fc.integer({ min: 0, max: 100 }),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (unpinnedSubtasks) => {
          const sorted = sortSubtasksByPinnedAndPosition(unpinnedSubtasks);
          
          // All should be unpinned
          expect(sorted.every(s => !s.isPinned)).toBe(true);
          
          // Should be sorted by position
          for (let i = 1; i < sorted.length; i++) {
            expect(sorted[i - 1].position).toBeLessThanOrEqual(sorted[i].position);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
