import { query, queryOne, run, uuid } from '../db/pool.js';
import type { 
  Order, 
  CreateOrderInput, 
  UpdateOrderInput, 
  OrderFilterInput 
} from '../schemas/order.schema.js';
import { 
  recordFieldChanges, 
  generateSystemCommentMessage,
  type FieldChange 
} from './historyService.js';
import { createComment } from './commentService.js';

export type { Order, CreateOrderInput, UpdateOrderInput, OrderFilterInput };

function mapOrder(row: any): Order {
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

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const id = uuid();
  const maxNum = queryOne<{ max: number | null }>('SELECT MAX(order_number) as max FROM orders');
  const orderNumber = (maxNum?.max ?? 0) + 1;

  run(
    `INSERT INTO orders (id, order_number, title, description, client_name, amount, status, priority, due_date, tags, assigned_to, updated_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      orderNumber,
      input.title,
      input.description ?? null,
      input.clientName ?? null,
      input.amount ?? null,
      input.status ?? 'new',
      input.priority ?? 'medium',
      input.dueDate ?? null,
      JSON.stringify(input.tags ?? []),
      JSON.stringify(input.assignedTo ?? []),
      input.updatedBy,
    ]
  );
  
  return (await getOrderById(id))!;
}

export async function getOrderById(id: string): Promise<Order | null> {
  const row = queryOne<any>(`SELECT * FROM orders WHERE id = ?`, [id]);
  return row ? mapOrder(row) : null;
}

export async function getOrders(filter: OrderFilterInput = {}): Promise<Order[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filter.status) {
    conditions.push(`status = ?`);
    params.push(filter.status);
  }
  if (filter.priority) {
    conditions.push(`priority = ?`);
    params.push(filter.priority);
  }
  if (filter.assignedTo) {
    conditions.push(`assigned_to LIKE ?`);
    params.push(`%"${filter.assignedTo}"%`);
  }
  if (filter.search) {
    conditions.push(`(title LIKE ? OR client_name LIKE ? OR CAST(order_number AS TEXT) LIKE ?)`);
    const searchPattern = `%${filter.search}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  
  const sortColumnMap: Record<string, string> = {
    orderNumber: 'order_number',
    title: 'title',
    status: 'status',
    priority: 'priority',
    dueDate: 'due_date',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  };
  
  const sortColumn = sortColumnMap[filter.sortBy || 'createdAt'] || 'created_at';
  const sortOrder = filter.sortOrder === 'asc' ? 'ASC' : 'DESC';
  
  params.push(filter.limit ?? 100, filter.offset ?? 0);
  
  const rows = query<any>(
    `SELECT * FROM orders ${whereClause} ORDER BY ${sortColumn} ${sortOrder} LIMIT ? OFFSET ?`,
    params
  );
  return rows.map(mapOrder);
}

export async function updateOrder(id: string, input: UpdateOrderInput): Promise<Order | null> {
  const currentOrder = await getOrderById(id);
  if (!currentOrder) return null;

  const updates: string[] = [];
  const params: unknown[] = [];
  const fieldChanges: FieldChange[] = [];

  if (input.title !== undefined && input.title !== currentOrder.title) {
    updates.push(`title = ?`);
    params.push(input.title);
    fieldChanges.push({ fieldName: 'title', oldValue: currentOrder.title, newValue: input.title });
  }
  if (input.description !== undefined && input.description !== currentOrder.description) {
    updates.push(`description = ?`);
    params.push(input.description);
    fieldChanges.push({ fieldName: 'description', oldValue: currentOrder.description, newValue: input.description });
  }
  if (input.clientName !== undefined && input.clientName !== currentOrder.clientName) {
    updates.push(`client_name = ?`);
    params.push(input.clientName);
    fieldChanges.push({ fieldName: 'clientName', oldValue: currentOrder.clientName, newValue: input.clientName });
  }
  if (input.amount !== undefined && input.amount !== currentOrder.amount) {
    updates.push(`amount = ?`);
    params.push(input.amount);
    fieldChanges.push({ fieldName: 'amount', oldValue: currentOrder.amount, newValue: input.amount });
  }
  if (input.status !== undefined && input.status !== currentOrder.status) {
    updates.push(`status = ?`);
    params.push(input.status);
    fieldChanges.push({ fieldName: 'status', oldValue: currentOrder.status, newValue: input.status });
  }
  if (input.priority !== undefined && input.priority !== currentOrder.priority) {
    updates.push(`priority = ?`);
    params.push(input.priority);
    fieldChanges.push({ fieldName: 'priority', oldValue: currentOrder.priority, newValue: input.priority });
  }
  if (input.dueDate !== undefined) {
    const currentDueDate = currentOrder.dueDate ? new Date(currentOrder.dueDate).toISOString().split('T')[0] : null;
    const newDueDate = input.dueDate ? new Date(input.dueDate).toISOString().split('T')[0] : null;
    if (currentDueDate !== newDueDate) {
      updates.push(`due_date = ?`);
      params.push(input.dueDate);
      fieldChanges.push({ fieldName: 'dueDate', oldValue: currentOrder.dueDate, newValue: input.dueDate });
    }
  }
  if (input.tags !== undefined && JSON.stringify(input.tags) !== JSON.stringify(currentOrder.tags)) {
    updates.push(`tags = ?`);
    params.push(JSON.stringify(input.tags));
    fieldChanges.push({ fieldName: 'tags', oldValue: currentOrder.tags, newValue: input.tags });
  }
  if (input.assignedTo !== undefined && JSON.stringify(input.assignedTo.sort()) !== JSON.stringify([...currentOrder.assignedTo].sort())) {
    updates.push(`assigned_to = ?`);
    params.push(JSON.stringify(input.assignedTo));
    fieldChanges.push({ fieldName: 'assignedTo', oldValue: currentOrder.assignedTo, newValue: input.assignedTo });
  }
  if (input.isFavorite !== undefined && input.isFavorite !== currentOrder.isFavorite) {
    updates.push(`is_favorite = ?`);
    params.push(input.isFavorite ? 1 : 0);
    fieldChanges.push({ fieldName: 'isFavorite', oldValue: currentOrder.isFavorite, newValue: input.isFavorite });
  }

  if (updates.length === 0) return currentOrder;

  updates.push(`updated_at = datetime('now')`);
  updates.push(`updated_by = ?`);
  params.push(input.updatedBy);
  params.push(id);
  
  run(`UPDATE orders SET ${updates.join(', ')} WHERE id = ?`, params);
  
  const updatedOrder = await getOrderById(id);
  if (!updatedOrder) return null;

  if (fieldChanges.length > 0) {
    await recordFieldChanges(id, input.updatedBy, fieldChanges);
    for (const change of fieldChanges) {
      const message = generateSystemCommentMessage(input.updatedBy, change.fieldName, change.oldValue, change.newValue);
      await createComment(id, { author: input.updatedBy, content: message, isSystem: true });
    }
  }

  return updatedOrder;
}

export async function deleteOrder(id: string): Promise<boolean> {
  const result = run('DELETE FROM orders WHERE id = ?', [id]);
  return result.changes > 0;
}

export async function getMaxOrderNumber(): Promise<number> {
  const result = queryOne<{ max: number | null }>('SELECT MAX(order_number) as max FROM orders');
  return result?.max ?? 0;
}

export async function createOrdersBatch(inputs: CreateOrderInput[]): Promise<Order[]> {
  const orders: Order[] = [];
  for (const input of inputs) {
    const order = await createOrder(input);
    orders.push(order);
  }
  return orders;
}
