import { query, queryOne, run, uuid } from '../db/pool.js';
import type { 
  Subtask, 
  CreateSubtaskInput, 
  UpdateSubtaskInput, 
  MoveSubtaskInput 
} from '../schemas/subtask.schema.js';

export type { Subtask, CreateSubtaskInput, UpdateSubtaskInput, MoveSubtaskInput };

function mapSubtask(row: any): Subtask {
  return {
    id: row.id,
    orderId: row.order_id,
    subtaskNumber: row.subtask_number,
    title: row.title,
    description: row.description,
    status: row.status,
    assignedTo: row.assigned_to,
    estimatedHours: row.estimated_hours,
    position: row.position,
    isPinned: Boolean(row.is_pinned),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createSubtask(orderId: string, input: CreateSubtaskInput): Promise<Subtask> {
  const id = uuid();
  const status = input.status ?? 'planning';
  
  const positionResult = queryOne<{ maxPos: number | null }>(
    `SELECT MAX(position) as maxPos FROM subtasks WHERE order_id = ? AND status = ?`,
    [orderId, status]
  );
  const nextPosition = input.position ?? ((positionResult?.maxPos ?? -1) + 1);

  run(
    `INSERT INTO subtasks (id, order_id, title, description, status, assigned_to, estimated_hours, position, is_pinned)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      orderId,
      input.title,
      input.description ?? null,
      status,
      input.assignedTo ?? null,
      input.estimatedHours ?? null,
      nextPosition,
      input.isPinned ? 1 : 0,
    ]
  );
  
  return (await getSubtaskById(id))!;
}

export async function getSubtaskById(id: string): Promise<Subtask | null> {
  const row = queryOne<any>(`SELECT * FROM subtasks WHERE id = ?`, [id]);
  return row ? mapSubtask(row) : null;
}

export async function getSubtasksByOrderId(orderId: string): Promise<Subtask[]> {
  const rows = query<any>(
    `SELECT * FROM subtasks WHERE order_id = ? ORDER BY is_pinned DESC, position ASC`,
    [orderId]
  );
  return rows.map(mapSubtask);
}

export async function updateSubtask(id: string, input: UpdateSubtaskInput): Promise<Subtask | null> {
  const updates: string[] = [];
  const params: unknown[] = [];

  if (input.title !== undefined) {
    updates.push(`title = ?`);
    params.push(input.title);
  }
  if (input.description !== undefined) {
    updates.push(`description = ?`);
    params.push(input.description);
  }
  if (input.status !== undefined) {
    updates.push(`status = ?`);
    params.push(input.status);
  }
  if (input.assignedTo !== undefined) {
    updates.push(`assigned_to = ?`);
    params.push(input.assignedTo);
  }
  if (input.estimatedHours !== undefined) {
    updates.push(`estimated_hours = ?`);
    params.push(input.estimatedHours);
  }
  if (input.position !== undefined) {
    updates.push(`position = ?`);
    params.push(input.position);
  }
  if (input.isPinned !== undefined) {
    updates.push(`is_pinned = ?`);
    params.push(input.isPinned ? 1 : 0);
  }

  updates.push(`updated_at = datetime('now')`);

  if (updates.length === 1) return getSubtaskById(id);

  params.push(id);
  run(`UPDATE subtasks SET ${updates.join(', ')} WHERE id = ?`, params);
  
  return getSubtaskById(id);
}

export async function moveSubtask(id: string, input: MoveSubtaskInput): Promise<Subtask | null> {
  const subtask = await getSubtaskById(id);
  if (!subtask) return null;

  let newPosition = input.position;
  if (newPosition === undefined) {
    const positionResult = queryOne<{ maxPos: number | null }>(
      `SELECT MAX(position) as maxPos FROM subtasks WHERE order_id = ? AND status = ?`,
      [subtask.orderId, input.status]
    );
    newPosition = (positionResult?.maxPos ?? -1) + 1;
  }

  run(
    `UPDATE subtasks SET status = ?, position = ?, updated_at = datetime('now') WHERE id = ?`,
    [input.status, newPosition, id]
  );
  
  return getSubtaskById(id);
}

export async function deleteSubtask(id: string): Promise<boolean> {
  const result = run('DELETE FROM subtasks WHERE id = ?', [id]);
  return result.changes > 0;
}

export async function orderExists(orderId: string): Promise<boolean> {
  const result = queryOne<{ cnt: number }>('SELECT COUNT(*) as cnt FROM orders WHERE id = ?', [orderId]);
  return (result?.cnt ?? 0) > 0;
}
