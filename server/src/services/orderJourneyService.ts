import { query, queryOne } from '../db/pool.js';
import type { OrderStatus, ParticipantName } from '../types.js';

/**
 * Represents a single step in an order's journey through statuses
 */
export interface OrderJourneyStep {
  status: OrderStatus;
  changedBy: ParticipantName;
  changedAt: Date;
  isCurrent: boolean;
}

/**
 * Represents the complete journey of an order through its lifecycle
 */
export interface OrderJourney {
  orderId: string;
  steps: OrderJourneyStep[];
  createdAt: Date;
  completedAt: Date | null;
}

interface OrderRow {
  id: string;
  status: OrderStatus;
  created_at: string;
  updated_by: ParticipantName;
}

interface HistoryRow {
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  changed_by: ParticipantName;
  changed_at: string;
}

/**
 * Builds the order journey from order_history table.
 * Maps status changes to journey steps with dates and authors.
 * Marks the current status as isCurrent.
 * 
 * @param orderId - The ID of the order to get the journey for
 * @returns OrderJourney with all status transitions, or null if order not found
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */
export async function getOrderJourney(orderId: string): Promise<OrderJourney | null> {
  // Get the order to find creation date and current status
  const order = queryOne<OrderRow>(
    `SELECT id, status, created_at, updated_by FROM orders WHERE id = ?`,
    [orderId]
  );

  if (!order) {
    return null;
  }

  const currentStatus = order.status;
  const createdAt = new Date(order.created_at);

  // Get all status changes from order_history
  const historyRows = query<HistoryRow>(
    `SELECT field_name, old_value, new_value, changed_by, changed_at 
     FROM order_history 
     WHERE order_id = ? AND field_name = 'status'
     ORDER BY changed_at ASC`,
    [orderId]
  );

  const steps: OrderJourneyStep[] = [];

  // Add the initial 'new' status as the first step
  // The first status change will have old_value = 'new', so we use that
  // If there are no status changes, the order was created and never changed
  if (historyRows.length > 0) {
    // First step is the initial status (old_value of first change)
    const firstChange = historyRows[0];
    const initialStatus = (firstChange.old_value as OrderStatus) || 'new';
    
    steps.push({
      status: initialStatus,
      changedBy: order.updated_by, // Creator of the order
      changedAt: createdAt,
      isCurrent: initialStatus === currentStatus && historyRows.length === 0,
    });

    // Add each status transition
    for (const row of historyRows) {
      const newStatus = row.new_value as OrderStatus;
      steps.push({
        status: newStatus,
        changedBy: row.changed_by,
        changedAt: new Date(row.changed_at),
        isCurrent: false, // Will be updated below
      });
    }
  } else {
    // No status changes - order is still in its initial status
    steps.push({
      status: currentStatus,
      changedBy: order.updated_by,
      changedAt: createdAt,
      isCurrent: true,
    });
  }

  // Mark the current status step
  if (steps.length > 0) {
    const lastStep = steps[steps.length - 1];
    lastStep.isCurrent = lastStep.status === currentStatus;
  }

  // Determine completion date
  const completedAt = currentStatus === 'completed' 
    ? (steps.find(s => s.status === 'completed')?.changedAt || null)
    : null;

  return {
    orderId,
    steps,
    createdAt,
    completedAt,
  };
}

/**
 * Gets order journeys for multiple orders at once
 * 
 * @param orderIds - Array of order IDs
 * @returns Map of orderId to OrderJourney
 */
export async function getOrderJourneys(orderIds: string[]): Promise<Map<string, OrderJourney>> {
  const journeys = new Map<string, OrderJourney>();
  
  for (const orderId of orderIds) {
    const journey = await getOrderJourney(orderId);
    if (journey) {
      journeys.set(orderId, journey);
    }
  }
  
  return journeys;
}
