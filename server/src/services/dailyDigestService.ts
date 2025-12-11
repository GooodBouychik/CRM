import { queryOne } from '../db/pool.js';
import { queueDailyDigestNotification } from './notificationQueue.js';
import { getAllUsers } from './userService.js';
import type { ParticipantName } from '../types.js';

interface DailyStats {
  newOrders: number;
  completedOrders: number;
  newComments: number;
  urgentDeadlines: number;
}

export async function getDailyStats(): Promise<DailyStats> {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString();
  
  const newOrders = queryOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM orders WHERE created_at >= ?`,
    [yesterdayStr]
  );
  
  const completedOrders = queryOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM orders WHERE status = 'completed' AND updated_at >= ?`,
    [yesterdayStr]
  );
  
  const newComments = queryOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM comments WHERE created_at >= ? AND is_system = 0`,
    [yesterdayStr]
  );
  
  const urgentDeadlines = queryOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM orders 
     WHERE due_date IS NOT NULL 
     AND date(due_date) <= date('now', '+3 days')
     AND date(due_date) >= date('now')
     AND status NOT IN ('completed', 'rejected')`
  );

  return {
    newOrders: newOrders?.count ?? 0,
    completedOrders: completedOrders?.count ?? 0,
    newComments: newComments?.count ?? 0,
    urgentDeadlines: urgentDeadlines?.count ?? 0,
  };
}

function isDigestTime(digestTime: string): boolean {
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  const [digestHour, digestMinute] = digestTime.split(':').map(Number);
  const [currentHour, currentMinute] = currentTime.split(':').map(Number);
  
  const digestMinutes = digestHour * 60 + digestMinute;
  const currentMinutes = currentHour * 60 + currentMinute;
  
  return Math.abs(currentMinutes - digestMinutes) <= 5;
}

export async function sendDailyDigests(): Promise<number> {
  const users = await getAllUsers();
  const stats = await getDailyStats();
  
  let sentCount = 0;
  
  for (const user of users) {
    if (!user.preferences.dailyDigest.enabled) continue;
    if (!isDigestTime(user.preferences.dailyDigest.time)) continue;
    
    await queueDailyDigestNotification(user.name as ParticipantName, stats);
    sentCount++;
    console.log(`Queued daily digest for ${user.name}`);
  }
  
  return sentCount;
}

let digestIntervalId: NodeJS.Timeout | null = null;

export function startDailyDigestScheduler(): void {
  const intervalMs = 5 * 60 * 1000;
  
  digestIntervalId = setInterval(async () => {
    try {
      const count = await sendDailyDigests();
      if (count > 0) {
        console.log(`Daily digest: ${count} digests queued`);
      }
    } catch (err) {
      console.error('Error in daily digest scheduler:', err);
    }
  }, intervalMs);

  console.log('Daily digest scheduler started (checking every 5 minutes)');
}

export function stopDailyDigestScheduler(): void {
  if (digestIntervalId) {
    clearInterval(digestIntervalId);
    digestIntervalId = null;
    console.log('Daily digest scheduler stopped');
  }
}
