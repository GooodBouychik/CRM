import type { Order, OrderStatus, Priority } from '@/types';
import type { SortColumn, SortDirection } from '@/components/orders/OrderTable';

const STATUS_ORDER: Record<OrderStatus, number> = {
  new: 0,
  in_progress: 1,
  review: 2,
  completed: 3,
  rejected: 4,
};

const PRIORITY_ORDER: Record<Priority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export function sortOrders(
  orders: Order[],
  column: SortColumn | null,
  direction: SortDirection
): Order[] {
  if (!column) return orders;

  const sorted = [...orders].sort((a, b) => {
    let comparison = 0;

    switch (column) {
      case 'orderNumber':
        comparison = a.orderNumber - b.orderNumber;
        break;
      case 'clientName':
        comparison = (a.clientName || '').localeCompare(b.clientName || '', 'ru');
        break;
      case 'title':
        comparison = a.title.localeCompare(b.title, 'ru');
        break;
      case 'amount':
        comparison = (a.amount || 0) - (b.amount || 0);
        break;
      case 'status':
        comparison = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
        break;
      case 'priority':
        comparison = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
        break;
      case 'dueDate':
        const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        comparison = aDate - bDate;
        break;
      case 'updatedAt':
        comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        break;
    }

    return direction === 'asc' ? comparison : -comparison;
  });

  return sorted;
}

export function filterOrders(
  orders: Order[],
  filters: {
    status?: OrderStatus | null;
    priority?: Priority | null;
    search?: string;
  }
): Order[] {
  return orders.filter((order) => {
    if (filters.status && order.status !== filters.status) {
      return false;
    }
    if (filters.priority && order.priority !== filters.priority) {
      return false;
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesId = `#${String(order.orderNumber).padStart(3, '0')}`.toLowerCase().includes(searchLower);
      const matchesTitle = order.title.toLowerCase().includes(searchLower);
      const matchesClient = (order.clientName || '').toLowerCase().includes(searchLower);
      if (!matchesId && !matchesTitle && !matchesClient) {
        return false;
      }
    }
    return true;
  });
}

/**
 * Returns CSS class for deadline color based on days remaining
 * Red for ≤3 days, yellow for 4-7 days, normal for >7 days
 */
export function getDeadlineClass(dueDate: Date): string {
  const now = new Date();
  const deadline = new Date(dueDate);
  
  // Reset time to compare dates only
  now.setHours(0, 0, 0, 0);
  deadline.setHours(0, 0, 0, 0);
  
  const diffTime = deadline.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 3) {
    return 'text-red-600 dark:text-red-400';
  }
  if (diffDays <= 7) {
    return 'text-yellow-600 dark:text-yellow-400';
  }
  return '';
}

/**
 * Classifies deadline into categories: urgent, warning, or normal
 */
export function classifyDeadline(dueDate: Date): 'urgent' | 'warning' | 'normal' {
  const now = new Date();
  const deadline = new Date(dueDate);
  
  now.setHours(0, 0, 0, 0);
  deadline.setHours(0, 0, 0, 0);
  
  const diffTime = deadline.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 3) {
    return 'urgent';
  }
  if (diffDays <= 7) {
    return 'warning';
  }
  return 'normal';
}
