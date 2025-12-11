import { query, run, uuid } from '../db/pool.js';
import type { ParticipantName, OrderStatus, Order } from '../schemas/order.schema.js';

export interface OrderHistoryEntry {
  id: string;
  orderId: string;
  changedBy: ParticipantName;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  changedAt: Date;
}

export interface FieldChange {
  fieldName: string;
  oldValue: unknown;
  newValue: unknown;
}

function mapHistoryEntry(row: any): OrderHistoryEntry {
  return {
    id: row.id,
    orderId: row.order_id,
    changedBy: row.changed_by,
    fieldName: row.field_name,
    oldValue: row.old_value,
    newValue: row.new_value,
    changedAt: row.changed_at,
  };
}

export async function recordFieldChange(
  orderId: string,
  changedBy: ParticipantName,
  fieldName: string,
  oldValue: unknown,
  newValue: unknown
): Promise<OrderHistoryEntry> {
  const id = uuid();
  run(
    `INSERT INTO order_history (id, order_id, changed_by, field_name, old_value, new_value)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, orderId, changedBy, fieldName, formatValueForStorage(oldValue), formatValueForStorage(newValue)]
  );
  
  const rows = query<any>(`SELECT * FROM order_history WHERE id = ?`, [id]);
  return mapHistoryEntry(rows[0]);
}

export async function recordFieldChanges(
  orderId: string,
  changedBy: ParticipantName,
  changes: FieldChange[]
): Promise<OrderHistoryEntry[]> {
  if (changes.length === 0) return [];

  const entries: OrderHistoryEntry[] = [];
  for (const change of changes) {
    const entry = await recordFieldChange(orderId, changedBy, change.fieldName, change.oldValue, change.newValue);
    entries.push(entry);
  }
  return entries;
}

export async function getOrderHistory(orderId: string): Promise<OrderHistoryEntry[]> {
  const rows = query<any>(
    `SELECT * FROM order_history WHERE order_id = ? ORDER BY changed_at DESC`,
    [orderId]
  );
  return rows.map(mapHistoryEntry);
}

function formatValueForStorage(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export function formatFieldNameForDisplay(fieldName: string): string {
  const fieldNameMap: Record<string, string> = {
    title: 'название',
    description: 'описание',
    clientName: 'клиент',
    amount: 'сумма',
    status: 'статус',
    priority: 'приоритет',
    dueDate: 'дедлайн',
    tags: 'теги',
    assignedTo: 'исполнители',
    isFavorite: 'избранное',
  };
  return fieldNameMap[fieldName] || fieldName;
}

export function formatValueForDisplay(value: unknown): string {
  if (value === null || value === undefined) return '(пусто)';
  if (Array.isArray(value)) return value.length > 0 ? value.join(', ') : '(пусто)';
  if (value instanceof Date) return value.toLocaleDateString('ru-RU');
  if (typeof value === 'boolean') return value ? 'да' : 'нет';
  return String(value);
}

export function generateSystemCommentMessage(
  changedBy: ParticipantName,
  fieldName: string,
  oldValue: unknown,
  newValue: unknown
): string {
  const displayFieldName = formatFieldNameForDisplay(fieldName);
  const displayOldValue = formatValueForDisplay(oldValue);
  const displayNewValue = formatValueForDisplay(newValue);
  return `${changedBy} изменил(а) ${displayFieldName}: ${displayOldValue} → ${displayNewValue}`;
}

// History filtering interfaces
export interface HistoryFilterOptions {
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  status?: OrderStatus;
  clientName?: string;
}

function mapOrderRow(row: any): Order {
  return {
    id: row.id,
    orderNumber: row.order_number,
    title: row.title,
    description: row.description,
    clientName: row.client_name,
    amount: row.amount,
    status: row.status,
    priority: row.priority,
    dueDate: row.due_date,
    tags: row.tags ? JSON.parse(row.tags) : [],
    assignedTo: row.assigned_to ? JSON.parse(row.assigned_to) : [],
    isFavorite: Boolean(row.is_favorite),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
  };
}

/**
 * Filter orders by search query (matches title, clientName, or orderNumber)
 * Requirements: 5.2
 */
export function filterBySearch(orders: Order[], searchQuery: string): Order[] {
  if (!searchQuery || searchQuery.trim() === '') {
    return orders;
  }
  
  const normalizedQuery = searchQuery.toLowerCase().trim();
  
  return orders.filter(order => {
    const titleMatch = order.title.toLowerCase().includes(normalizedQuery);
    const clientMatch = order.clientName?.toLowerCase().includes(normalizedQuery) ?? false;
    const orderNumberMatch = String(order.orderNumber).includes(normalizedQuery);
    
    return titleMatch || clientMatch || orderNumberMatch;
  });
}

/**
 * Filter orders by date range (based on createdAt)
 * Requirements: 5.3
 */
export function filterByDateRange(orders: Order[], from: Date, to: Date): Order[] {
  const fromTime = from.getTime();
  const toTime = to.getTime();
  
  return orders.filter(order => {
    const createdAtTime = new Date(order.createdAt).getTime();
    return createdAtTime >= fromTime && createdAtTime <= toTime;
  });
}

/**
 * Filter orders by status
 * Requirements: 5.4
 */
export function filterByStatus(orders: Order[], status: OrderStatus): Order[] {
  return orders.filter(order => order.status === status);
}

/**
 * Filter orders by client name
 * Requirements: 5.5
 */
export function filterByClient(orders: Order[], clientName: string): Order[] {
  if (!clientName || clientName.trim() === '') {
    return orders;
  }
  
  const normalizedClientName = clientName.toLowerCase().trim();
  
  return orders.filter(order => 
    order.clientName?.toLowerCase() === normalizedClientName
  );
}

/**
 * Get all orders for history page with optional filters
 * Combines all filter functions for convenience
 */
export async function getOrdersForHistory(filters: HistoryFilterOptions = {}): Promise<Order[]> {
  // Get all orders from database
  const rows = query<any>(
    `SELECT * FROM orders ORDER BY created_at DESC`
  );
  
  let orders = rows.map(mapOrderRow);
  
  // Apply filters
  if (filters.search) {
    orders = filterBySearch(orders, filters.search);
  }
  
  if (filters.dateFrom && filters.dateTo) {
    orders = filterByDateRange(orders, filters.dateFrom, filters.dateTo);
  }
  
  if (filters.status) {
    orders = filterByStatus(orders, filters.status);
  }
  
  if (filters.clientName) {
    orders = filterByClient(orders, filters.clientName);
  }
  
  return orders;
}
