import { z } from 'zod';
import { ParticipantNameSchema } from './order.schema.js';

// Task status enum for Trello-style board
export const TaskStatusSchema = z.enum(['todo', 'in_progress', 'done']);
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

// Dashboard task schema for database records
export const DashboardTaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().nullable(),
  status: TaskStatusSchema,
  position: z.number().int().nonnegative(),
  assignedTo: ParticipantNameSchema.nullable(),
  dueDate: z.coerce.date().nullable(),
  orderId: z.string().uuid().nullable(),
  createdBy: ParticipantNameSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type DashboardTask = z.infer<typeof DashboardTaskSchema>;

// Schema for creating a new task
export const CreateDashboardTaskSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .transform(val => val.trim())
    .refine(val => val.length > 0, 'Title cannot be empty or whitespace only'),
  description: z.string().nullable().optional(),
  status: TaskStatusSchema.optional().default('todo'),
  assignedTo: ParticipantNameSchema.nullable().optional(),
  dueDate: z.coerce.date().nullable().optional(),
  orderId: z.string().uuid().nullable().optional(),
  createdBy: ParticipantNameSchema,
});

export type CreateDashboardTaskInput = z.infer<typeof CreateDashboardTaskSchema>;

// Schema for updating an existing task
export const UpdateDashboardTaskSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .transform(val => val.trim())
    .refine(val => val.length > 0, 'Title cannot be empty or whitespace only')
    .optional(),
  description: z.string().nullable().optional(),
  status: TaskStatusSchema.optional(),
  assignedTo: ParticipantNameSchema.nullable().optional(),
  dueDate: z.coerce.date().nullable().optional(),
  orderId: z.string().uuid().nullable().optional(),
});

export type UpdateDashboardTaskInput = z.infer<typeof UpdateDashboardTaskSchema>;


// Schema for moving a task to a new column/position
export const MoveTaskSchema = z.object({
  status: TaskStatusSchema,
  position: z.number().int().nonnegative(),
});

export type MoveTaskInput = z.infer<typeof MoveTaskSchema>;

// Schema for filtering tasks
export const TaskFilterSchema = z.object({
  status: TaskStatusSchema.optional(),
  assignedTo: ParticipantNameSchema.optional(),
});

export type TaskFilter = z.infer<typeof TaskFilterSchema>;

/**
 * Validates task creation input.
 */
export function validateCreateTask(input: unknown): { success: true; data: CreateDashboardTaskInput } | { success: false; error: z.ZodError } {
  const result = CreateDashboardTaskSchema.safeParse(input);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

/**
 * Validates task update input.
 */
export function validateUpdateTask(input: unknown): { success: true; data: UpdateDashboardTaskInput } | { success: false; error: z.ZodError } {
  const result = UpdateDashboardTaskSchema.safeParse(input);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

/**
 * Validates task move input.
 */
export function validateMoveTask(input: unknown): { success: true; data: MoveTaskInput } | { success: false; error: z.ZodError } {
  const result = MoveTaskSchema.safeParse(input);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}
