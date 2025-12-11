import { z } from 'zod';
import { ParticipantNameSchema } from './order.schema.js';

// Reactions type - maps emoji to list of participants who reacted
export const ReactionsSchema = z.record(z.string(), z.array(ParticipantNameSchema));

export type Reactions = z.infer<typeof ReactionsSchema>;

// Attachment schema
export const AttachmentSchema = z.object({
  id: z.string().uuid(),
  filename: z.string(),
  fileSize: z.number().int().nonnegative(),
  fileUrl: z.string(),
  uploadedBy: ParticipantNameSchema,
  uploadedAt: z.coerce.date(),
});

export type Attachment = z.infer<typeof AttachmentSchema>;

// Comment schema for database records
export const CommentSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  subtaskId: z.string().uuid().nullable(),
  author: ParticipantNameSchema,
  content: z.string(),
  isSystem: z.boolean(),
  parentId: z.string().uuid().nullable(),
  reactions: ReactionsSchema,
  attachments: z.array(AttachmentSchema).optional().default([]),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().nullable(),
  editedAt: z.coerce.date().nullable(),
});

export type Comment = z.infer<typeof CommentSchema>;

// Schema for creating a new comment
export const CreateCommentSchema = z.object({
  author: ParticipantNameSchema,
  content: z.string()
    .min(1, 'Content is required')
    .transform(val => val.trim())
    .refine(val => val.length > 0, 'Content cannot be empty or whitespace only'),
  isSystem: z.boolean().optional().default(false),
  parentId: z.string().uuid().nullable().optional(),
});

export type CreateCommentInput = z.infer<typeof CreateCommentSchema>;


// Schema for updating an existing comment
export const UpdateCommentSchema = z.object({
  content: z.string()
    .min(1, 'Content is required')
    .transform(val => val.trim())
    .refine(val => val.length > 0, 'Content cannot be empty or whitespace only'),
});

export type UpdateCommentInput = z.infer<typeof UpdateCommentSchema>;

// Schema for toggling a reaction
export const ToggleReactionSchema = z.object({
  emoji: z.string().min(1, 'Emoji is required'),
  participant: ParticipantNameSchema,
});

export type ToggleReactionInput = z.infer<typeof ToggleReactionSchema>;

// Schema for filtering/paginating comments
export const CommentFilterSchema = z.object({
  limit: z.coerce.number().int().positive().optional().default(50),
  offset: z.coerce.number().int().nonnegative().optional().default(0),
  parentId: z.string().uuid().nullable().optional(),
  author: ParticipantNameSchema.optional(),
  isSystem: z.coerce.boolean().optional(),
});

export type CommentFilter = z.infer<typeof CommentFilterSchema>;
export type CommentFilterInput = z.input<typeof CommentFilterSchema>;

/**
 * Validates comment creation input.
 * Returns validation result with parsed data or error.
 */
export function validateCreateComment(input: unknown): { success: true; data: CreateCommentInput } | { success: false; error: z.ZodError } {
  const result = CreateCommentSchema.safeParse(input);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

/**
 * Validates comment update input.
 * Returns validation result with parsed data or error.
 */
export function validateUpdateComment(input: unknown): { success: true; data: UpdateCommentInput } | { success: false; error: z.ZodError } {
  const result = UpdateCommentSchema.safeParse(input);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

/**
 * Validates reaction toggle input.
 * Returns validation result with parsed data or error.
 */
export function validateToggleReaction(input: unknown): { success: true; data: ToggleReactionInput } | { success: false; error: z.ZodError } {
  const result = ToggleReactionSchema.safeParse(input);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}
