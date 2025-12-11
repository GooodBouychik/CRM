import { query } from '../db/pool.js';
import { queueDeadlineReminderNotification } from './notificationQueue.js';
import type { ParticipantName } from '../types.js';

interface OrderWithDeadline {
  id: string;
  orderNumber: number;
  title: string;
  dueDate: Date;
  assignedTo: ParticipantName[];
}

export async function checkDeadlineReminders(daysThreshold: number = 3): Promise<number> {
  const rows = query<any>(
    `SELECT id, order_number, title, due_date, assigned_to
     FROM orders 
     WHERE due_date IS NOT NULL 
       AND date(due_date) <= date('now', '+' || ? || ' days')
       AND date(due_date) >= date('now')
       AND status NOT IN ('completed', 'rejected')
       AND assigned_to IS NOT NULL 
       AND assigned_to != '[]'`,
    [daysThreshold]
  );

  let notificationCount = 0;

  for (const row of rows) {
    const assignedTo = row.assigned_to ? JSON.parse(row.assigned_to) : [];
    if (assignedTo.length > 0) {
      await queueDeadlineReminderNotification({
        id: row.id,
        orderNumber: row.order_number,
        title: row.title,
        dueDate: row.due_date,
        assignedTo,
      });
      notificationCount++;
    }
  }

  return notificationCount;
}

let reminderIntervalId: NodeJS.Timeout | null = null;

export function startDeadlineReminderScheduler(checkIntervalHours: number = 24): void {
  checkDeadlineReminders().then(count => {
    console.log(`Initial deadline check: ${count} reminders queued`);
  }).catch(err => {
    console.error('Error in initial deadline check:', err);
  });

  const intervalMs = checkIntervalHours * 60 * 60 * 1000;
  reminderIntervalId = setInterval(async () => {
    try {
      const count = await checkDeadlineReminders();
      console.log(`Deadline check: ${count} reminders queued`);
    } catch (err) {
      console.error('Error in scheduled deadline check:', err);
    }
  }, intervalMs);

  console.log(`Deadline reminder scheduler started (interval: ${checkIntervalHours} hours)`);
}

export function stopDeadlineReminderScheduler(): void {
  if (reminderIntervalId) {
    clearInterval(reminderIntervalId);
    reminderIntervalId = null;
    console.log('Deadline reminder scheduler stopped');
  }
}
