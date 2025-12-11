import { z } from 'zod';
import { ParticipantNameSchema } from './order.schema.js';

// Subtask status enum
export const SubtaskStatusSchema = z.enum(['planning', 'development', 'review', 'completed', 'archived']);

export type SubtaskStatus = z.infer<typeof SubtaskStatusSchema>;

// Subtask schema for database records
export const SubtaskSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  subtaskNumber: z.number().int().positive(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().nullable(),
  status: SubtaskStatusSchema,
  assignedTo: z.string().nullable(),
  estimatedHours: z.number().nullable(),
  position: z.number().int().nonnegative(),
  isPinned: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Subtask = z.infer<typeof SubtaskSchema>;

// Schema for creating a new subtask
export const CreateSubtaskSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .transform(val => val.trim())
    .refine(val => val.length > 0, 'Title cannot be empty or whitespace only'),
  description: z.string().nullable().optional(),
  status: SubtaskStatusSchema.optional().default('planning'),
  assignedTo: ParticipantNameSchema.nullable().optional(),
  estimatedHours: z.number().positive().nullable().optional(),
  position: z.number().int().nonnegative().optional(),
  isPinned: z.boolean().optional().default(false),
});

export type CreateSubtaskInput = z.infer<typeof CreateSubtaskSchema>;


// Schema for updating an existing subtask
export const UpdateSubtaskSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .transform(val => val.trim())
    .refine(val => val.length > 0, 'Title cannot be empty or whitespace only')
    .optional(),
  description: z.string().nullable().optional(),
  status: SubtaskStatusSchema.optional(),
  assignedTo: ParticipantNameSchema.nullable().optional(),
  estimatedHours: z.number().positive().nullable().optional(),
  position: z.number().int().nonnegative().optional(),
  isPinned: z.boolean().optional(),
});

export type UpdateSubtaskInput = z.infer<typeof UpdateSubtaskSchema>;

// Schema for moving a subtask to a different column
export const MoveSubtaskSchema = z.object({
  status: SubtaskStatusSchema,
  position: z.number().int().nonnegative().optional(),
});

export type MoveSubtaskInput = z.infer<typeof MoveSubtaskSchema>;

/**
 * Validates subtask creation input.
 * Returns validation result with parsed data or error.
 */
export function validateCreateSubtask(input: unknown): { success: true; data: CreateSubtaskInput } | { success: false; error: z.ZodError } {
  const result = CreateSubtaskSchema.safeParse(input);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

/**
 * Validates subtask update input.
 * Returns validation result with parsed data or error.
 */
export function validateUpdateSubtask(input: unknown): { success: true; data: UpdateSubtaskInput } | { success: false; error: z.ZodError } {
  const result = UpdateSubtaskSchema.safeParse(input);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

/**
 * Validates subtask move input.
 * Returns validation result with parsed data or error.
 */
export function validateMoveSubtask(input: unknown): { success: true; data: MoveSubtaskInput } | { success: false; error: z.ZodError } {
  const result = MoveSubtaskSchema.safeParse(input);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}
