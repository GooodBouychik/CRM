import { db, query, queryOne, run, uuid } from '../db/pool.js';
import type { 
  DashboardTask, 
  CreateDashboardTaskInput, 
  UpdateDashboardTaskInput, 
  MoveTaskInput,
  TaskFilter,
  TaskStatus
} from '../schemas/dashboardTask.schema.js';

export type { DashboardTask, CreateDashboardTaskInput, UpdateDashboardTaskInput, MoveTaskInput, TaskFilter };

function mapTask(row: any): DashboardTask {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    position: row.position,
    assignedTo: row.assigned_to,
    dueDate: row.due_date,
    orderId: row.order_id,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createTask(input: CreateDashboardTaskInput): Promise<DashboardTask> {
  const status = input.status ?? 'todo';
  const id = uuid();
  
  const positionResult = queryOne<{ maxPos: number | null }>(
    `SELECT MAX(position) as maxPos FROM dashboard_tasks WHERE status = ?`,
    [status]
  );
  const nextPosition = (positionResult?.maxPos ?? -1) + 1;

  run(
    `INSERT INTO dashboard_tasks (id, title, description, status, position, assigned_to, due_date, order_id, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.title,
      input.description ?? null,
      status,
      nextPosition,
      input.assignedTo ?? null,
      input.dueDate ?? null,
      input.orderId ?? null,
      input.createdBy,
    ]
  );
  
  return (await getTaskById(id))!;
}

export async function getTaskById(id: string): Promise<DashboardTask | null> {
  const row = queryOne<any>(`SELECT * FROM dashboard_tasks WHERE id = ?`, [id]);
  return row ? mapTask(row) : null;
}

export async function getTasks(filter?: TaskFilter): Promise<DashboardTask[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filter?.status) {
    conditions.push(`status = ?`);
    params.push(filter.status);
  }
  if (filter?.assignedTo) {
    conditions.push(`assigned_to = ?`);
    params.push(filter.assignedTo);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const rows = query<any>(
    `SELECT * FROM dashboard_tasks ${whereClause} ORDER BY status, position ASC`,
    params
  );
  return rows.map(mapTask);
}

export async function getTasksByStatus(): Promise<Record<TaskStatus, DashboardTask[]>> {
  const tasks = await getTasks();
  
  const grouped: Record<TaskStatus, DashboardTask[]> = {
    todo: [],
    in_progress: [],
    done: [],
  };

  for (const task of tasks) {
    grouped[task.status].push(task);
  }

  return grouped;
}

export async function updateTask(id: string, input: UpdateDashboardTaskInput): Promise<DashboardTask | null> {
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
  if (input.dueDate !== undefined) {
    updates.push(`due_date = ?`);
    params.push(input.dueDate);
  }
  if (input.orderId !== undefined) {
    updates.push(`order_id = ?`);
    params.push(input.orderId);
  }

  updates.push(`updated_at = datetime('now')`);

  if (updates.length === 1) {
    return getTaskById(id);
  }

  params.push(id);
  
  run(`UPDATE dashboard_tasks SET ${updates.join(', ')} WHERE id = ?`, params);
  
  return getTaskById(id);
}

export async function moveTask(id: string, input: MoveTaskInput): Promise<DashboardTask | null> {
  const task = await getTaskById(id);
  if (!task) return null;

  const { status: newStatus, position: newPosition } = input;
  const oldStatus = task.status;
  const oldPosition = task.position;

  if (oldStatus === newStatus) {
    if (oldPosition === newPosition) return task;

    if (newPosition > oldPosition) {
      run(
        `UPDATE dashboard_tasks SET position = position - 1 
         WHERE status = ? AND position > ? AND position <= ?`,
        [newStatus, oldPosition, newPosition]
      );
    } else {
      run(
        `UPDATE dashboard_tasks SET position = position + 1 
         WHERE status = ? AND position >= ? AND position < ?`,
        [newStatus, newPosition, oldPosition]
      );
    }
  } else {
    run(
      `UPDATE dashboard_tasks SET position = position - 1 WHERE status = ? AND position > ?`,
      [oldStatus, oldPosition]
    );
    run(
      `UPDATE dashboard_tasks SET position = position + 1 WHERE status = ? AND position >= ?`,
      [newStatus, newPosition]
    );
  }

  run(
    `UPDATE dashboard_tasks SET status = ?, position = ?, updated_at = datetime('now') WHERE id = ?`,
    [newStatus, newPosition, id]
  );
  
  return getTaskById(id);
}

export async function deleteTask(id: string): Promise<boolean> {
  const task = await getTaskById(id);
  if (!task) return false;

  const result = run('DELETE FROM dashboard_tasks WHERE id = ?', [id]);

  if (result.changes > 0) {
    run(
      `UPDATE dashboard_tasks SET position = position - 1 WHERE status = ? AND position > ?`,
      [task.status, task.position]
    );
    return true;
  }

  return false;
}
