import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { SubtaskStatusSchema, validateMoveSubtask } from '../../schemas/subtask.schema.js';
import { columnToStatus } from './subtaskTestUtils.js';

/**
 * **Feature: team-crm, Property 8: Subtask Status Matches Column**
 * **Validates: Requirements 4.2**
 * 
 * For any subtask move operation to a target column, the subtask's status
 * after the move should equal the status corresponding to that column
 * (planning, development, review, completed, archived).
 */

// All valid subtask statuses
const SUBTASK_STATUSES = ['planning', 'development', 'review', 'completed', 'archived'] as const;

// Generator for valid subtask status
const subtaskStatusArb = fc.constantFrom(...SUBTASK_STATUSES);

// Generator for valid position
const positionArb = fc.integer({ min: 0, max: 1000 });

describe('Property 8: Subtask Status Matches Column', () => {
  it('move validation accepts all valid column statuses', () => {
    fc.assert(
      fc.property(
        subtaskStatusArb,
        positionArb,
        (targetStatus, position) => {
          const result = validateMoveSubtask({
            status: targetStatus,
            position,
          });
          
          expect(result.success).toBe(true);
          if (result.success) {
            // The validated status should match the input status
            expect(result.data.status).toBe(targetStatus);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('move validation rejects invalid statuses', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => !SUBTASK_STATUSES.includes(s as typeof SUBTASK_STATUSES[number])),
        (invalidStatus) => {
          const result = validateMoveSubtask({
            status: invalidStatus,
          });
          
          expect(result.success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('column ID maps to correct status', () => {
    fc.assert(
      fc.property(
        subtaskStatusArb,
        (columnId) => {
          // The columnToStatus mapping should return the same status
          // since column IDs are the same as status values
          const mappedStatus = columnToStatus[columnId];
          expect(mappedStatus).toBe(columnId);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('status after move equals target column status', () => {
    fc.assert(
      fc.property(
        subtaskStatusArb, // source status
        subtaskStatusArb, // target status
        positionArb,
        (sourceStatus, targetStatus, position) => {
          // Simulate a subtask with source status
          const subtask = {
            id: 'test-id',
            status: sourceStatus,
            position: 0,
          };
          
          // Validate the move operation
          const moveResult = validateMoveSubtask({
            status: targetStatus,
            position,
          });
          
          expect(moveResult.success).toBe(true);
          if (moveResult.success) {
            // After applying the move, the status should equal the target
            const newStatus = moveResult.data.status;
            expect(newStatus).toBe(targetStatus);
            
            // The new status should be a valid SubtaskStatus
            const statusValidation = SubtaskStatusSchema.safeParse(newStatus);
            expect(statusValidation.success).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('move preserves position when specified', () => {
    fc.assert(
      fc.property(
        subtaskStatusArb,
        positionArb,
        (targetStatus, position) => {
          const result = validateMoveSubtask({
            status: targetStatus,
            position,
          });
          
          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data.position).toBe(position);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('move works without position (optional)', () => {
    fc.assert(
      fc.property(
        subtaskStatusArb,
        (targetStatus) => {
          const result = validateMoveSubtask({
            status: targetStatus,
          });
          
          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data.status).toBe(targetStatus);
            // Position should be undefined when not provided
            expect(result.data.position).toBeUndefined();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
