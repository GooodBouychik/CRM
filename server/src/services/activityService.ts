import { query } from '../db/pool.js';
import type { ParticipantName } from '../schemas/order.schema.js';

export interface ActivityEntry {
  id: string;
  type: 'order_created' | 'order_updated' | 'status_changed' | 'comment_added' | 'task_created' | 'task_completed';
  actor: ParticipantName;
  orderId: string | null;
  orderTitle: string | null;
  taskId: string | null;
  taskTitle: string | null;
  details: string | null;
  createdAt: string;
}

export async function getRecentActivity(limit: number = 50): Promise<ActivityEntry[]> {
  const activities: ActivityEntry[] = [];
  
  // Get order history entries
  const historyRows = query<any>(
    `SELECT 
      h.id,
      h.order_id,
      h.changed_by,
      h.field_name,
      h.old_value,
      h.new_value,
      h.changed_at,
      o.title as order_title
    FROM order_history h
    LEFT JOIN orders o ON o.id = h.order_id
    ORDER BY h.changed_at DESC
    LIMIT ?`,
    [limit]
  );
  
  for (const row of historyRows) {
    let type: ActivityEntry['type'] = 'order_updated';
    let details = `Изменил ${row.field_name}`;
    
    if (row.field_name === 'status') {
      type = 'status_changed';
      details = `${row.old_value || 'новый'} → ${row.new_value}`;
    }
    
    activities.push({
      id: row.id,
      type,
      actor: row.changed_by,
      orderId: row.order_id,
      orderTitle: row.order_title,
      taskId: null,
      taskTitle: null,
      details,
      createdAt: row.changed_at,
    });
  }
  
  // Get comments
  const commentRows = query<any>(
    `SELECT 
      c.id,
      c.order_id,
      c.author,
      c.content,
      c.created_at,
      o.title as order_title
    FROM comments c
    LEFT JOIN orders o ON o.id = c.order_id
    WHERE c.is_system = 0
    ORDER BY c.created_at DESC
    LIMIT ?`,
    [limit]
  );
  
  for (const row of commentRows) {
    activities.push({
      id: `comment-${row.id}`,
      type: 'comment_added',
      actor: row.author,
      orderId: row.order_id,
      orderTitle: row.order_title,
      taskId: null,
      taskTitle: null,
      details: row.content.length > 100 ? row.content.substring(0, 100) + '...' : row.content,
      createdAt: row.created_at,
    });
  }
  
  // Get task activities
  const taskRows = query<any>(
    `SELECT 
      id,
      title,
      status,
      created_by,
      created_at,
      updated_at
    FROM dashboard_tasks
    ORDER BY created_at DESC
    LIMIT ?`,
    [limit]
  );
  
  for (const row of taskRows) {
    activities.push({
      id: `task-${row.id}`,
      type: row.status === 'done' ? 'task_completed' : 'task_created',
      actor: row.created_by,
      orderId: null,
      orderTitle: null,
      taskId: row.id,
      taskTitle: row.title,
      details: null,
      createdAt: row.status === 'done' ? row.updated_at : row.created_at,
    });
  }
  
  // Sort all by date and limit
  return activities
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}
