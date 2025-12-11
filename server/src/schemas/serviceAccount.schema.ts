import { z } from 'zod';
import { ParticipantNameSchema } from './order.schema.js';

// Account category schema
export const AccountCategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Category name is required'),
  icon: z.string().default('📁'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').default('#6366f1'),
  createdAt: z.coerce.date(),
});

export type AccountCategory = z.infer<typeof AccountCategorySchema>;

// Schema for creating a category
export const CreateAccountCategorySchema = z.object({
  name: z.string()
    .min(1, 'Category name is required')
    .transform(val => val.trim())
    .refine(val => val.length > 0, 'Category name cannot be empty'),
  icon: z.string().optional().default('📁'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional().default('#6366f1'),
});

export type CreateAccountCategoryInput = z.infer<typeof CreateAccountCategorySchema>;

// Service account schema for database records
export const ServiceAccountSchema = z.object({
  id: z.string().uuid(),
  serviceName: z.string().min(1, 'Service name is required'),
  serviceUrl: z.string().url().nullable(),
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  notes: z.string().nullable(),
  categoryId: z.string().uuid().nullable(),
  category: AccountCategorySchema.nullable().optional(),
  createdBy: ParticipantNameSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type ServiceAccount = z.infer<typeof ServiceAccountSchema>;


// Schema for creating a service account
export const CreateServiceAccountSchema = z.object({
  serviceName: z.string()
    .min(1, 'Service name is required')
    .transform(val => val.trim())
    .refine(val => val.length > 0, 'Service name cannot be empty'),
  serviceUrl: z.string().url('Invalid URL format').nullable().optional(),
  username: z.string()
    .min(1, 'Username is required')
    .transform(val => val.trim())
    .refine(val => val.length > 0, 'Username cannot be empty'),
  password: z.string().min(1, 'Password is required'),
  notes: z.string().nullable().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  createdBy: ParticipantNameSchema,
});

export type CreateServiceAccountInput = z.infer<typeof CreateServiceAccountSchema>;

// Schema for updating a service account
export const UpdateServiceAccountSchema = z.object({
  serviceName: z.string()
    .min(1, 'Service name is required')
    .transform(val => val.trim())
    .refine(val => val.length > 0, 'Service name cannot be empty')
    .optional(),
  serviceUrl: z.string().url('Invalid URL format').nullable().optional(),
  username: z.string()
    .min(1, 'Username is required')
    .transform(val => val.trim())
    .refine(val => val.length > 0, 'Username cannot be empty')
    .optional(),
  password: z.string().min(1, 'Password is required').optional(),
  notes: z.string().nullable().optional(),
  categoryId: z.string().uuid().nullable().optional(),
});

export type UpdateServiceAccountInput = z.infer<typeof UpdateServiceAccountSchema>;

// Schema for searching accounts
export const AccountSearchSchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().uuid().optional(),
});

export type AccountSearchInput = z.infer<typeof AccountSearchSchema>;

/**
 * Validates service account creation input.
 */
export function validateCreateAccount(input: unknown): { success: true; data: CreateServiceAccountInput } | { success: false; error: z.ZodError } {
  const result = CreateServiceAccountSchema.safeParse(input);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

/**
 * Validates service account update input.
 */
export function validateUpdateAccount(input: unknown): { success: true; data: UpdateServiceAccountInput } | { success: false; error: z.ZodError } {
  const result = UpdateServiceAccountSchema.safeParse(input);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

/**
 * Validates category creation input.
 */
export function validateCreateCategory(input: unknown): { success: true; data: CreateAccountCategoryInput } | { success: false; error: z.ZodError } {
  const result = CreateAccountCategorySchema.safeParse(input);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}
