import { query, queryOne, run } from '../db/pool.js';
import type { ParticipantName, SubtaskStatus } from '../types.js';

/**
 * Calendar subtask with order info for display
 */
export interface CalendarSubtask {
  id: string;
  title: string;
  dueDate: string;
  assignedTo: ParticipantName | null;
  orderId: string;
  orderTitle: string;
  orderNumber: number;
  status: SubtaskStatus;
  estimatedHours: number | null;
}

/**
 * Day workload information
 */
export interface DayWorkload {
  date: string;
  subtaskCount: number;
  totalEstimatedHours: number;
  isOverloaded: boolean; // > 8 hours
}

/**
 * Maps a database row to CalendarSubtask
 */
function mapCalendarSubtask(row: any): CalendarSubtask {
  return {
    id: row.id,
    title: row.title,
    dueDate: row.due_date,
    assignedTo: row.assigned_to as ParticipantName | null,
    orderId: row.order_id,
    orderTitle: row.order_title,
    orderNumber: row.order_number,
    status: row.status as SubtaskStatus,
    estimatedHours: row.estimated_hours,
  };
}

/**
 * Get subtasks with due dates within a date range
 * Includes order info (title, number) for each subtask
 * 
 * @param from - Start date (inclusive) in ISO format (YYYY-MM-DD)
 * @param to - End date (inclusive) in ISO format (YYYY-MM-DD)
 * @returns Array of calendar subtasks
 */
export async function getSubtasksByDateRange(from: string, to: string): Promise<CalendarSubtask[]> {
  const rows = query<any>(
    `SELECT 
      s.id,
      s.title,
      s.due_date,
      s.assigned_to,
      s.order_id,
      s.status,
      s.estimated_hours,
      o.title as order_title,
      o.order_number
    FROM subtasks s
    JOIN orders o ON s.order_id = o.id
    WHERE s.due_date IS NOT NULL
      AND date(s.due_date) >= date(?)
      AND date(s.due_date) <= date(?)
    ORDER BY s.due_date ASC, s.position ASC`,
    [from, to]
  );
  
  return rows.map(mapCalendarSubtask);
}


/**
 * Move a subtask to a new date (for drag-and-drop functionality)
 * Triggers a notification about the deadline change
 * 
 * @param subtaskId - The ID of the subtask to move
 * @param newDate - The new due date in ISO format (YYYY-MM-DD)
 * @returns The updated subtask or null if not found
 */
export async function moveSubtaskToDate(
  subtaskId: string, 
  newDate: string
): Promise<CalendarSubtask | null> {
  // First check if subtask exists
  const existing = queryOne<any>(
    `SELECT s.*, o.title as order_title, o.order_number
     FROM subtasks s
     JOIN orders o ON s.order_id = o.id
     WHERE s.id = ?`,
    [subtaskId]
  );
  
  if (!existing) {
    return null;
  }
  
  const oldDate = existing.due_date;
  
  // Update the due date
  run(
    `UPDATE subtasks SET due_date = ?, updated_at = datetime('now') WHERE id = ?`,
    [newDate, subtaskId]
  );
  
  // Fetch the updated subtask
  const updated = queryOne<any>(
    `SELECT s.*, o.title as order_title, o.order_number
     FROM subtasks s
     JOIN orders o ON s.order_id = o.id
     WHERE s.id = ?`,
    [subtaskId]
  );
  
  if (!updated) {
    return null;
  }
  
  // Trigger notification about deadline change (async, don't await)
  notifyDeadlineChange(updated, oldDate, newDate).catch(err => {
    console.error('Failed to send deadline change notification:', err);
  });
  
  return mapCalendarSubtask(updated);
}

/**
 * Send notification about subtask deadline change
 */
async function notifyDeadlineChange(
  subtask: any,
  oldDate: string | null,
  newDate: string
): Promise<void> {
  // Import dynamically to avoid circular dependencies
  const { sendTelegramMessage, getAllTelegramUsers } = await import('./telegramService.js');
  const { isNotificationEnabled } = await import('./userService.js');
  
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const oldDateStr = oldDate ? new Date(oldDate).toLocaleDateString('ru-RU') : 'не установлен';
  const newDateStr = new Date(newDate).toLocaleDateString('ru-RU');
  
  const message = 
    `📅 <b>Дедлайн изменён</b>\n\n` +
    `<b>Подзадача:</b> ${escapeHtml(subtask.title)}\n` +
    `<b>Заказ:</b> #${subtask.order_number} - ${escapeHtml(subtask.order_title)}\n` +
    `<b>Дедлайн:</b> ${oldDateStr} → ${newDateStr}\n\n` +
    `<a href="${appUrl}/orders/${subtask.order_id}">Открыть заказ</a>`;
  
  // Notify assigned user if any
  if (subtask.assigned_to) {
    const shouldSend = await isNotificationEnabled(subtask.assigned_to, 'deadlineReminders');
    if (shouldSend) {
      await sendTelegramMessage(subtask.assigned_to, message);
    }
  }
}

/**
 * Escape HTML special characters for Telegram messages
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}


/**
 * Calculate workload for a specific day
 * Returns total hours and overload indicator (> 8 hours)
 * 
 * @param date - The date to calculate workload for in ISO format (YYYY-MM-DD)
 * @returns Day workload information
 */
export async function getDayWorkload(date: string): Promise<DayWorkload> {
  const result = queryOne<{ count: number; total_hours: number | null }>(
    `SELECT 
      COUNT(*) as count,
      SUM(COALESCE(estimated_hours, 0)) as total_hours
    FROM subtasks
    WHERE date(due_date) = date(?)
      AND status NOT IN ('completed', 'archived')`,
    [date]
  );
  
  const subtaskCount = result?.count ?? 0;
  const totalEstimatedHours = result?.total_hours ?? 0;
  
  return {
    date,
    subtaskCount,
    totalEstimatedHours,
    isOverloaded: totalEstimatedHours > 8,
  };
}

/**
 * Get workload for multiple days in a range
 * Useful for displaying workload indicators on a calendar grid
 * 
 * @param from - Start date (inclusive) in ISO format (YYYY-MM-DD)
 * @param to - End date (inclusive) in ISO format (YYYY-MM-DD)
 * @returns Array of day workload information
 */
export async function getWorkloadByDateRange(from: string, to: string): Promise<DayWorkload[]> {
  const rows = query<{ due_date: string; count: number; total_hours: number | null }>(
    `SELECT 
      date(due_date) as due_date,
      COUNT(*) as count,
      SUM(COALESCE(estimated_hours, 0)) as total_hours
    FROM subtasks
    WHERE due_date IS NOT NULL
      AND date(due_date) >= date(?)
      AND date(due_date) <= date(?)
      AND status NOT IN ('completed', 'archived')
    GROUP BY date(due_date)
    ORDER BY due_date ASC`,
    [from, to]
  );
  
  return rows.map(row => ({
    date: row.due_date,
    subtaskCount: row.count,
    totalEstimatedHours: row.total_hours ?? 0,
    isOverloaded: (row.total_hours ?? 0) > 8,
  }));
}
