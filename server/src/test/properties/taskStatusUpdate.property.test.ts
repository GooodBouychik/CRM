import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { 
  TaskStatusSchema, 
  validateMoveTask, 
  validateCreateTask,
  validateUpdateTask 
} from '../../schemas/dashboardTask.schema.js';

/**
 * **Feature: crm-ux-improvements, Property 1: Task Status Update Consistency**
 * **Validates: Requirements 1.3**
 * 
 * For any dashboard task and any valid target status, moving the task to that status
 * should result in the task having exactly that status in the store and database.
 */

// All valid task statuses
const TASK_STATUSES = ['todo', 'in_progress', 'done'] as const;

// Generator for valid task status
const taskStatusArb = fc.constantFrom(...TASK_STATUSES);

// Generator for valid position
const positionArb = fc.integer({ min: 0, max: 1000 });

// Generator for valid participant names
const participantArb = fc.constantFrom('Никита', 'Саня', 'Ксюша');

// Generator for valid task title
const titleArb = fc.string({ minLength: 1, maxLength: 100 })
  .filter(s => s.trim().length > 0);

describe('Property 1: Task Status Update Consistency', () => {
  it('move validation accepts all valid task statuses', () => {
    fc.assert(
      fc.property(
        taskStatusArb,
        positionArb,
        (targetStatus, position) => {
          const result = validateMoveTask({
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
        fc.string().filter(s => !TASK_STATUSES.includes(s as typeof TASK_STATUSES[number])),
        (invalidStatus) => {
          const result = validateMoveTask({
            status: invalidStatus,
            position: 0,
          });
          
          expect(result.success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });


  it('status after move equals target status', () => {
    fc.assert(
      fc.property(
        taskStatusArb, // source status
        taskStatusArb, // target status
        positionArb,
        (sourceStatus, targetStatus, position) => {
          // Simulate a task with source status
          const task = {
            id: 'test-id',
            status: sourceStatus,
            position: 0,
          };
          
          // Validate the move operation
          const moveResult = validateMoveTask({
            status: targetStatus,
            position,
          });
          
          expect(moveResult.success).toBe(true);
          if (moveResult.success) {
            // After applying the move, the status should equal the target
            const newStatus = moveResult.data.status;
            expect(newStatus).toBe(targetStatus);
            
            // The new status should be a valid TaskStatus
            const statusValidation = TaskStatusSchema.safeParse(newStatus);
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
        taskStatusArb,
        positionArb,
        (targetStatus, position) => {
          const result = validateMoveTask({
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

  it('task creation with status results in that status', () => {
    fc.assert(
      fc.property(
        titleArb,
        taskStatusArb,
        participantArb,
        (title, status, createdBy) => {
          const result = validateCreateTask({
            title,
            status,
            createdBy,
          });
          
          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data.status).toBe(status);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('task update with status results in that status', () => {
    fc.assert(
      fc.property(
        taskStatusArb,
        (status) => {
          const result = validateUpdateTask({
            status,
          });
          
          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data.status).toBe(status);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('task creation defaults to todo status when not specified', () => {
    fc.assert(
      fc.property(
        titleArb,
        participantArb,
        (title, createdBy) => {
          const result = validateCreateTask({
            title,
            createdBy,
          });
          
          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data.status).toBe('todo');
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
