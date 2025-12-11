import { 
  sendTelegramMessage, 
  isInQuietHours,
  getAllTelegramUsers
} from './telegramService.js';
import { isNotificationEnabled } from './userService.js';
import type { ParticipantName } from '../types.js';

// Notification types
export type NotificationType = 
  | 'new_order'
  | 'new_comment'
  | 'status_change'
  | 'deadline_reminder'
  | 'mention'
  | 'reply'
  | 'daily_digest';

// Notification payload interfaces
export interface NewOrderNotification {
  type: 'new_order';
  orderId: string;
  orderNumber: number;
  title: string;
  clientName: string | null;
  createdBy: ParticipantName;
}

export interface NewCommentNotification {
  type: 'new_comment';
  orderId: string;
  orderNumber: number;
  orderTitle: string;
  commentId: string;
  author: ParticipantName;
  preview: string;
  excludeUser?: ParticipantName;
}

export interface StatusChangeNotification {
  type: 'status_change';
  orderId: string;
  orderNumber: number;
  orderTitle: string;
  oldStatus: string;
  newStatus: string;
  changedBy: ParticipantName;
}

export interface DeadlineReminderNotification {
  type: 'deadline_reminder';
  orderId: string;
  orderNumber: number;
  orderTitle: string;
  dueDate: string;
  daysRemaining: number;
  assignedTo: ParticipantName[];
}

export interface MentionNotification {
  type: 'mention';
  orderId: string;
  orderNumber: number;
  orderTitle: string;
  commentId: string;
  author: ParticipantName;
  mentionedUser: ParticipantName;
  preview: string;
}

export interface ReplyNotification {
  type: 'reply';
  orderId: string;
  orderNumber: number;
  orderTitle: string;
  commentId: string;
  author: ParticipantName;
  originalAuthor: ParticipantName;
  preview: string;
}

export interface DailyDigestNotification {
  type: 'daily_digest';
  recipient: ParticipantName;
  stats: {
    newOrders: number;
    completedOrders: number;
    newComments: number;
    urgentDeadlines: number;
  };
}

export type NotificationPayload = 
  | NewOrderNotification
  | NewCommentNotification
  | StatusChangeNotification
  | DeadlineReminderNotification
  | MentionNotification
  | ReplyNotification
  | DailyDigestNotification;

/**
 * Initialize the notification queue (no-op without Redis)
 */
export function initializeNotificationQueue(): null {
  console.log('Notification queue initialized (in-memory mode, no Redis)');
  return null;
}

/**
 * Get the notification queue instance (always null without Redis)
 */
export function getNotificationQueue(): null {
  return null;
}

/**
 * Check if a notification should be sent to a user
 */
async function shouldSendNotification(
  userName: ParticipantName,
  notificationType: 'newOrder' | 'comments' | 'statusChanges' | 'mentions' | 'deadlineReminders'
): Promise<boolean> {
  const isEnabled = await isNotificationEnabled(userName, notificationType);
  if (!isEnabled) {
    return false;
  }
  
  const inQuietHours = await isInQuietHours(userName);
  if (inQuietHours) {
    return false;
  }
  
  return true;
}

/**
 * Send message to users with preference and quiet hours filtering
 */
async function sendFilteredNotification(
  message: string,
  notificationType: 'newOrder' | 'comments' | 'statusChanges' | 'mentions' | 'deadlineReminders',
  excludeUser?: ParticipantName
): Promise<void> {
  const users = await getAllTelegramUsers();
  
  for (const user of users) {
    if (excludeUser && user.name === excludeUser) continue;
    
    const shouldSend = await shouldSendNotification(user.name, notificationType);
    if (shouldSend) {
      await sendTelegramMessage(user.name, message);
    }
  }
}

// Helper functions
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

function getStatusEmoji(status: string): string {
  const emojis: Record<string, string> = {
    new: '🆕',
    in_progress: '🔄',
    review: '👀',
    completed: '✅',
    rejected: '❌',
  };
  return emojis[status] || '📋';
}

function translateStatus(status: string): string {
  const translations: Record<string, string> = {
    new: 'Новый',
    in_progress: 'В работе',
    review: 'На проверке',
    completed: 'Завершён',
    rejected: 'Отклонён',
  };
  return translations[status] || status;
}

// Direct notification functions (no queue, immediate send)

export async function queueNewOrderNotification(
  order: { id: string; orderNumber: number; title: string; clientName: string | null },
  createdBy: ParticipantName
): Promise<void> {
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const message = 
    `📦 <b>Новый заказ #${order.orderNumber}</b>\n\n` +
    `<b>Название:</b> ${escapeHtml(order.title)}\n` +
    (order.clientName ? `<b>Клиент:</b> ${escapeHtml(order.clientName)}\n` : '') +
    `<b>Создал:</b> ${createdBy}\n\n` +
    `<a href="${appUrl}/orders/${order.id}">Открыть заказ</a>`;
  
  await sendFilteredNotification(message, 'newOrder', createdBy);
}

export async function queueNewCommentNotification(
  order: { id: string; orderNumber: number; title: string },
  comment: { id: string; author: ParticipantName; content: string },
  excludeUser?: ParticipantName
): Promise<void> {
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const message = 
    `💬 <b>Новый комментарий</b>\n\n` +
    `<b>Заказ:</b> #${order.orderNumber} - ${escapeHtml(order.title)}\n` +
    `<b>Автор:</b> ${comment.author}\n\n` +
    `"${escapeHtml(truncate(comment.content, 200))}"\n\n` +
    `<a href="${appUrl}/orders/${order.id}">Открыть заказ</a>`;
  
  await sendFilteredNotification(message, 'comments', excludeUser || comment.author);
}

export async function queueStatusChangeNotification(
  order: { id: string; orderNumber: number; title: string },
  oldStatus: string,
  newStatus: string,
  changedBy: ParticipantName
): Promise<void> {
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const statusEmoji = getStatusEmoji(newStatus);
  const message = 
    `${statusEmoji} <b>Статус изменён</b>\n\n` +
    `<b>Заказ:</b> #${order.orderNumber} - ${escapeHtml(order.title)}\n` +
    `<b>Статус:</b> ${translateStatus(oldStatus)} → ${translateStatus(newStatus)}\n` +
    `<b>Изменил:</b> ${changedBy}\n\n` +
    `<a href="${appUrl}/orders/${order.id}">Открыть заказ</a>`;
  
  await sendFilteredNotification(message, 'statusChanges', changedBy);
}

export async function queueDeadlineReminderNotification(
  order: { id: string; orderNumber: number; title: string; dueDate: Date; assignedTo: ParticipantName[] }
): Promise<void> {
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const now = new Date();
  const dueDate = new Date(order.dueDate);
  const daysRemaining = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  const urgencyEmoji = daysRemaining <= 1 ? '🔴' : '🟡';
  const daysText = daysRemaining === 0 
    ? 'сегодня' 
    : daysRemaining === 1 
      ? 'завтра' 
      : `через ${daysRemaining} дн.`;
  
  const message = 
    `${urgencyEmoji} <b>Напоминание о дедлайне</b>\n\n` +
    `<b>Заказ:</b> #${order.orderNumber} - ${escapeHtml(order.title)}\n` +
    `<b>Дедлайн:</b> ${dueDate.toLocaleDateString('ru-RU')} (${daysText})\n\n` +
    `<a href="${appUrl}/orders/${order.id}">Открыть заказ</a>`;
  
  for (const user of order.assignedTo) {
    const shouldSend = await shouldSendNotification(user, 'deadlineReminders');
    if (shouldSend) {
      await sendTelegramMessage(user, message);
    }
  }
}

export async function queueMentionNotification(
  order: { id: string; orderNumber: number; title: string },
  comment: { id: string; author: ParticipantName; content: string },
  mentionedUser: ParticipantName
): Promise<void> {
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const message = 
    `📢 <b>Вас упомянули</b>\n\n` +
    `<b>Заказ:</b> #${order.orderNumber} - ${escapeHtml(order.title)}\n` +
    `<b>Автор:</b> ${comment.author}\n\n` +
    `"${escapeHtml(truncate(comment.content, 200))}"\n\n` +
    `<a href="${appUrl}/orders/${order.id}">Открыть заказ</a>`;
  
  const shouldSend = await shouldSendNotification(mentionedUser, 'mentions');
  if (shouldSend) {
    await sendTelegramMessage(mentionedUser, message);
  }
}

export async function queueReplyNotification(
  order: { id: string; orderNumber: number; title: string },
  comment: { id: string; author: ParticipantName; content: string },
  originalAuthor: ParticipantName
): Promise<void> {
  if (comment.author === originalAuthor) return;
  
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const message = 
    `↩️ <b>Ответ на ваш комментарий</b>\n\n` +
    `<b>Заказ:</b> #${order.orderNumber} - ${escapeHtml(order.title)}\n` +
    `<b>Автор:</b> ${comment.author}\n\n` +
    `"${escapeHtml(truncate(comment.content, 200))}"\n\n` +
    `<a href="${appUrl}/orders/${order.id}">Открыть заказ</a>`;
  
  const shouldSend = await shouldSendNotification(originalAuthor, 'comments');
  if (shouldSend) {
    await sendTelegramMessage(originalAuthor, message);
  }
}

export async function queueDailyDigestNotification(
  recipient: ParticipantName,
  stats: DailyDigestNotification['stats']
): Promise<void> {
  const message = 
    `📊 <b>Ежедневная сводка</b>\n\n` +
    `📦 Новых заказов: ${stats.newOrders}\n` +
    `✅ Завершённых: ${stats.completedOrders}\n` +
    `💬 Новых комментариев: ${stats.newComments}\n` +
    `⚠️ Срочных дедлайнов: ${stats.urgentDeadlines}\n\n` +
    `Хорошего дня! 🌟`;
  
  await sendTelegramMessage(recipient, message);
}

/**
 * Shutdown (no-op without Redis)
 */
export async function shutdownNotificationQueue(): Promise<void> {
  console.log('Notification queue shut down');
}
