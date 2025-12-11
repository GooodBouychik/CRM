import { z } from 'zod';

// Base types
export const OrderStatusSchema = z.enum(['new', 'in_progress', 'review', 'completed', 'rejected']);
export const PrioritySchema = z.enum(['high', 'medium', 'low']);
export const ParticipantNameSchema = z.enum(['Никита', 'Саня', 'Ксюша']);

export type OrderStatus = z.infer<typeof OrderStatusSchema>;
export type Priority = z.infer<typeof PrioritySchema>;
export type ParticipantName = z.infer<typeof ParticipantNameSchema>;

// Order schema for database records
export const OrderSchema = z.object({
  id: z.string().uuid(),
  orderNumber: z.number().int().positive(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().nullable(),
  clientName: z.string().nullable(),
  amount: z.number().nullable(),
  status: OrderStatusSchema,
  priority: PrioritySchema,
  dueDate: z.coerce.date().nullable(),
  tags: z.array(z.string()),
  assignedTo: z.array(ParticipantNameSchema),
  isFavorite: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  updatedBy: ParticipantNameSchema,
});

export type Order = z.infer<typeof OrderSchema>;

// Schema for creating a new order
export const CreateOrderSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .transform(val => val.trim())
    .refine(val => val.length > 0, 'Title cannot be empty or whitespace only'),
  description: z.string().nullable().optional(),
  clientName: z.string().nullable().optional(),
  amount: z.number().nullable().optional(),
  status: OrderStatusSchema.optional().default('new'),
  priority: PrioritySchema.optional().default('medium'),
  dueDate: z.coerce.date().nullable().optional(),
  tags: z.array(z.string()).optional().default([]),
  assignedTo: z.array(ParticipantNameSchema).optional().default([]),
  updatedBy: ParticipantNameSchema,
});

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;


// Schema for updating an existing order
export const UpdateOrderSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .transform(val => val.trim())
    .refine(val => val.length > 0, 'Title cannot be empty or whitespace only')
    .optional(),
  description: z.string().nullable().optional(),
  clientName: z.string().nullable().optional(),
  amount: z.number().nullable().optional(),
  status: OrderStatusSchema.optional(),
  priority: PrioritySchema.optional(),
  dueDate: z.coerce.date().nullable().optional(),
  tags: z.array(z.string()).optional(),
  assignedTo: z.array(ParticipantNameSchema).optional(),
  isFavorite: z.boolean().optional(),
  updatedBy: ParticipantNameSchema,
});

export type UpdateOrderInput = z.infer<typeof UpdateOrderSchema>;

// Schema for filtering orders
export const OrderFilterSchema = z.object({
  status: OrderStatusSchema.optional(),
  priority: PrioritySchema.optional(),
  search: z.string().optional(),
  assignedTo: ParticipantNameSchema.optional(),
  sortBy: z.enum(['orderNumber', 'title', 'status', 'priority', 'dueDate', 'createdAt', 'updatedAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  limit: z.coerce.number().int().positive().optional().default(100),
  offset: z.coerce.number().int().nonnegative().optional().default(0),
});

export type OrderFilter = z.infer<typeof OrderFilterSchema>;

// Input type for filter (before defaults are applied)
export type OrderFilterInput = z.input<typeof OrderFilterSchema>;

/**
 * Validates order creation input.
 * Returns validation result with parsed data or error.
 */
export function validateCreateOrder(input: unknown): { success: true; data: CreateOrderInput } | { success: false; error: z.ZodError } {
  const result = CreateOrderSchema.safeParse(input);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

/**
 * Validates order update input.
 * Returns validation result with parsed data or error.
 */
export function validateUpdateOrder(input: unknown): { success: true; data: UpdateOrderInput } | { success: false; error: z.ZodError } {
  const result = UpdateOrderSchema.safeParse(input);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}
