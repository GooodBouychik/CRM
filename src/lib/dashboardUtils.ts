import type { Order, ParticipantName } from '@/types';

export type DashboardCategory = 'urgent' | 'inProgress' | 'waiting';

export interface UnreadInfo {
  mentions: string[];  // Order IDs with unread mentions
  replies: string[];   // Order IDs with unread replies
}

/**
 * Calculates the number of days until a deadline
 */
export function getDaysUntilDeadline(dueDate: Date | string | null): number | null {
  if (!dueDate) return null;
  
  const now = new Date();
  const deadline = new Date(dueDate);
  
  now.setHours(0, 0, 0, 0);
  deadline.setHours(0, 0, 0, 0);
  
  const diffTime = deadline.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * Determines if an order is urgent based on the requirements:
 * - Deadline ≤3 days
 * - High priority in review status
 * - Has unread mentions/replies
 */
export function isOrderUrgent(
  order: Order,
  unreadInfo: UnreadInfo
): boolean {
  // Check deadline ≤3 days
  if (order.dueDate) {
    const daysUntil = getDaysUntilDeadline(order.dueDate);
    if (daysUntil !== null && daysUntil <= 3) {
      return true;
    }
  }
  
  // Check high priority in review
  if (order.priority === 'high' && order.status === 'review') {
    return true;
  }
  
  // Check unread mentions/replies
  if (unreadInfo.mentions.includes(order.id) || unreadInfo.replies.includes(order.id)) {
    return true;
  }
  
  return false;
}

/**
 * Determines if an order is "in progress" for a participant
 * - Assigned to the current participant
 */
export function isOrderInProgress(
  order: Order,
  currentUser: ParticipantName
): boolean {
  return order.assignedTo.includes(currentUser);
}


/**
 * Determines if an order is "waiting" (due this week but not urgent or in progress)
 */
export function isOrderWaiting(
  order: Order
): boolean {
  if (order.dueDate) {
    const daysUntil = getDaysUntilDeadline(order.dueDate);
    // Due within 7 days (this week)
    if (daysUntil !== null && daysUntil > 0 && daysUntil <= 7) {
      return true;
    }
  }
  return false;
}

/**
 * Categorizes an order into exactly one dashboard section.
 * Priority: Urgent > In Progress > Waiting
 * 
 * Requirements 9.1, 9.2, 9.3:
 * - Urgent: deadline ≤3 days OR high priority in review OR has unread mentions/replies
 * - In Progress: assigned to current participant
 * - Waiting: orders due this week
 */
export function categorizeOrder(
  order: Order,
  currentUser: ParticipantName,
  unreadInfo: UnreadInfo
): DashboardCategory | null {
  // First check if urgent (highest priority)
  if (isOrderUrgent(order, unreadInfo)) {
    return 'urgent';
  }
  
  // Then check if in progress (assigned to user)
  if (isOrderInProgress(order, currentUser)) {
    return 'inProgress';
  }
  
  // Finally check if waiting (due this week)
  if (isOrderWaiting(order)) {
    return 'waiting';
  }
  
  // Order doesn't fit any category
  return null;
}

/**
 * Categorizes all orders into dashboard sections
 */
export function categorizeOrders(
  orders: Order[],
  currentUser: ParticipantName,
  unreadInfo: UnreadInfo
): {
  urgent: Order[];
  inProgress: Order[];
  waiting: Order[];
} {
  const result = {
    urgent: [] as Order[],
    inProgress: [] as Order[],
    waiting: [] as Order[],
  };
  
  for (const order of orders) {
    const category = categorizeOrder(order, currentUser, unreadInfo);
    if (category) {
      result[category].push(order);
    }
  }
  
  return result;
}
