import { query, queryOne, run, uuid } from '../db/pool.js';

/**
 * Custom field types
 * Requirements: 9.2
 */
export type CustomFieldType = 'text' | 'select' | 'date' | 'number';

/**
 * Custom field definition interface
 * Requirements: 9.1, 9.2
 */
export interface CustomFieldDefinition {
  id: string;
  name: string;
  type: CustomFieldType;
  options: string[] | null;
  isRequired: boolean;
  position: number;
  createdAt: string;
}

/**
 * Custom field value interface
 * Requirements: 9.3, 9.4
 */
export interface CustomFieldValue {
  id: string;
  orderId: string;
  fieldId: string;
  value: string;
  updatedAt: string;
}

/**
 * Input for creating a custom field definition
 */
export interface CreateFieldInput {
  name: string;
  type: CustomFieldType;
  options?: string[];
  isRequired?: boolean;
}

/**
 * Input for updating a custom field definition
 */
export interface UpdateFieldInput {
  name?: string;
  type?: CustomFieldType;
  options?: string[] | null;
  isRequired?: boolean;
  position?: number;
}

// ============================================
// Field Definitions CRUD Operations
// Requirements: 9.1, 9.2, 9.6
// ============================================

/**
 * Get all custom field definitions
 * Requirements: 9.1
 */
export function getFieldDefinitions(): CustomFieldDefinition[] {
  const rows = query<{
    id: string;
    name: string;
    type: CustomFieldType;
    options: string | null;
    is_required: number;
    position: number;
    created_at: string;
  }>(`
    SELECT id, name, type, options, is_required, position, created_at
    FROM custom_fields
    ORDER BY position ASC, created_at ASC
  `);

  return rows.map(row => ({
    id: row.id,
    name: row.name,
    type: row.type,
    options: row.options ? JSON.parse(row.options) : null,
    isRequired: row.is_required === 1,
    position: row.position,
    createdAt: row.created_at,
  }));
}

/**
 * Get a single custom field definition by ID
 */
export function getFieldDefinitionById(id: string): CustomFieldDefinition | null {
  const row = queryOne<{
    id: string;
    name: string;
    type: CustomFieldType;
    options: string | null;
    is_required: number;
    position: number;
    created_at: string;
  }>(`
    SELECT id, name, type, options, is_required, position, created_at
    FROM custom_fields
    WHERE id = ?
  `, [id]);

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    type: row.type,
    options: row.options ? JSON.parse(row.options) : null,
    isRequired: row.is_required === 1,
    position: row.position,
    createdAt: row.created_at,
  };
}

/**
 * Create a new custom field definition
 * Requirements: 9.2
 */
export function createFieldDefinition(input: CreateFieldInput): CustomFieldDefinition {
  const id = uuid();
  const createdAt = new Date().toISOString();
  
  // Get the next position
  const maxPositionRow = queryOne<{ max_pos: number | null }>(`
    SELECT MAX(position) as max_pos FROM custom_fields
  `);
  const position = (maxPositionRow?.max_pos ?? -1) + 1;

  const optionsJson = input.options ? JSON.stringify(input.options) : null;
  const isRequired = input.isRequired ? 1 : 0;

  run(`
    INSERT INTO custom_fields (id, name, type, options, is_required, position, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [id, input.name, input.type, optionsJson, isRequired, position, createdAt]);

  return {
    id,
    name: input.name,
    type: input.type,
    options: input.options ?? null,
    isRequired: input.isRequired ?? false,
    position,
    createdAt,
  };
}

/**
 * Update an existing custom field definition
 * Requirements: 9.2
 */
export function updateFieldDefinition(
  id: string,
  updates: UpdateFieldInput
): CustomFieldDefinition | null {
  // First check if the field exists
  const existing = getFieldDefinitionById(id);
  if (!existing) {
    return null;
  }

  // Build update query dynamically
  const setClauses: string[] = [];
  const params: unknown[] = [];

  if (updates.name !== undefined) {
    setClauses.push('name = ?');
    params.push(updates.name);
  }

  if (updates.type !== undefined) {
    setClauses.push('type = ?');
    params.push(updates.type);
  }

  if (updates.options !== undefined) {
    setClauses.push('options = ?');
    params.push(updates.options ? JSON.stringify(updates.options) : null);
  }

  if (updates.isRequired !== undefined) {
    setClauses.push('is_required = ?');
    params.push(updates.isRequired ? 1 : 0);
  }

  if (updates.position !== undefined) {
    setClauses.push('position = ?');
    params.push(updates.position);
  }

  if (setClauses.length === 0) {
    return existing;
  }

  params.push(id);

  run(`
    UPDATE custom_fields
    SET ${setClauses.join(', ')}
    WHERE id = ?
  `, params);

  return getFieldDefinitionById(id);
}

/**
 * Delete a custom field definition
 * Note: This removes the field definition but preserves existing values
 * (values will be orphaned but not deleted due to ON DELETE CASCADE being on the FK)
 * Requirements: 9.6
 */
export function deleteFieldDefinition(id: string): boolean {
  const result = run(`
    DELETE FROM custom_fields
    WHERE id = ?
  `, [id]);

  return result.changes > 0;
}

// ============================================
// Field Values Operations
// Requirements: 9.3, 9.4
// ============================================

/**
 * Get all custom field values for an order
 * Requirements: 9.3
 */
export function getFieldValues(orderId: string): CustomFieldValue[] {
  const rows = query<{
    id: string;
    order_id: string;
    field_id: string;
    value: string;
    updated_at: string;
  }>(`
    SELECT id, order_id, field_id, value, updated_at
    FROM custom_field_values
    WHERE order_id = ?
  `, [orderId]);

  return rows.map(row => ({
    id: row.id,
    orderId: row.order_id,
    fieldId: row.field_id,
    value: row.value,
    updatedAt: row.updated_at,
  }));
}

/**
 * Get custom field values with field definitions for an order
 * Useful for displaying fields with their metadata
 */
export function getFieldValuesWithDefinitions(orderId: string): Array<{
  field: CustomFieldDefinition;
  value: CustomFieldValue | null;
}> {
  const definitions = getFieldDefinitions();
  const values = getFieldValues(orderId);
  
  const valueMap = new Map(values.map(v => [v.fieldId, v]));

  return definitions.map(field => ({
    field,
    value: valueMap.get(field.id) ?? null,
  }));
}

/**
 * Set or update a custom field value for an order
 * Uses UPSERT to handle both insert and update cases
 * Requirements: 9.4
 */
export function setFieldValue(
  orderId: string,
  fieldId: string,
  value: string
): CustomFieldValue {
  const updatedAt = new Date().toISOString();

  // Check if value already exists
  const existing = queryOne<{
    id: string;
    order_id: string;
    field_id: string;
    value: string;
    updated_at: string;
  }>(`
    SELECT id, order_id, field_id, value, updated_at
    FROM custom_field_values
    WHERE order_id = ? AND field_id = ?
  `, [orderId, fieldId]);

  if (existing) {
    // Update existing value
    run(`
      UPDATE custom_field_values
      SET value = ?, updated_at = ?
      WHERE order_id = ? AND field_id = ?
    `, [value, updatedAt, orderId, fieldId]);

    return {
      id: existing.id,
      orderId,
      fieldId,
      value,
      updatedAt,
    };
  } else {
    // Insert new value
    const id = uuid();
    run(`
      INSERT INTO custom_field_values (id, order_id, field_id, value, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `, [id, orderId, fieldId, value, updatedAt]);

    return {
      id,
      orderId,
      fieldId,
      value,
      updatedAt,
    };
  }
}

/**
 * Delete a custom field value
 */
export function deleteFieldValue(orderId: string, fieldId: string): boolean {
  const result = run(`
    DELETE FROM custom_field_values
    WHERE order_id = ? AND field_id = ?
  `, [orderId, fieldId]);

  return result.changes > 0;
}

/**
 * Delete all custom field values for an order
 */
export function deleteAllFieldValues(orderId: string): number {
  const result = run(`
    DELETE FROM custom_field_values
    WHERE order_id = ?
  `, [orderId]);

  return result.changes;
}
