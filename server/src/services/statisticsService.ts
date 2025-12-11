import { query, queryOne } from '../db/pool.js';
import type { ParticipantName, OrderStatus } from '../types.js';

// Types for statistics
export interface MonthlyRevenue {
  month: string; // "2024-01"
  totalAmount: number;
  orderCount: number;
}

export interface TeamMemberWorkload {
  participant: ParticipantName;
  activeOrders: number;
  ordersByStatus: Record<OrderStatus, number>;
  totalEstimatedHours: number;
}

export interface StatusDistribution {
  new: number;
  in_progress: number;
  review: number;
  completed: number;
  rejected: number;
}

/**
 * Get revenue aggregated by month for a given date range
 * @param dateFrom - Start date (inclusive)
 * @param dateTo - End date (inclusive)
 * @returns Array of monthly revenue data
 */
export async function getRevenueByMonth(dateFrom: Date, dateTo: Date): Promise<MonthlyRevenue[]> {
  const fromStr = dateFrom.toISOString().split('T')[0];
  const toStr = dateTo.toISOString().split('T')[0];

  const rows = query<{
    month: string;
    total_amount: number;
    order_count: number;
  }>(
    `SELECT 
      strftime('%Y-%m', created_at) as month,
      COALESCE(SUM(amount), 0) as total_amount,
      COUNT(*) as order_count
    FROM orders
    WHERE date(created_at) >= date(?)
      AND date(created_at) <= date(?)
    GROUP BY strftime('%Y-%m', created_at)
    ORDER BY month ASC`,
    [fromStr, toStr]
  );

  return rows.map(row => ({
    month: row.month,
    totalAmount: Number(row.total_amount),
    orderCount: Number(row.order_count),
  }));
}


/**
 * Get team workload - active orders per participant with status distribution
 * @returns Array of team member workload data
 */
export async function getTeamWorkload(): Promise<TeamMemberWorkload[]> {
  // Get all participants from orders (assigned_to is a JSON array)
  const participantRows = query<{ assigned_to: string }>(
    `SELECT DISTINCT assigned_to FROM orders WHERE assigned_to IS NOT NULL AND assigned_to != '[]'`
  );

  // Extract unique participants from JSON arrays
  const participantsSet = new Set<ParticipantName>();
  for (const row of participantRows) {
    try {
      const assigned: ParticipantName[] = JSON.parse(row.assigned_to);
      assigned.forEach(p => participantsSet.add(p));
    } catch {
      // Skip invalid JSON
    }
  }

  const participants = Array.from(participantsSet);
  const workloadResults: TeamMemberWorkload[] = [];

  for (const participant of participants) {
    // Count orders by status for this participant (non-completed = active)
    const statusCounts = query<{ status: OrderStatus; count: number }>(
      `SELECT status, COUNT(*) as count
       FROM orders
       WHERE assigned_to LIKE ?
       GROUP BY status`,
      [`%"${participant}"%`]
    );

    const ordersByStatus: Record<OrderStatus, number> = {
      new: 0,
      in_progress: 0,
      review: 0,
      completed: 0,
      rejected: 0,
    };

    let activeOrders = 0;
    for (const row of statusCounts) {
      ordersByStatus[row.status] = Number(row.count);
      // Active orders are those not completed or rejected
      if (row.status !== 'completed' && row.status !== 'rejected') {
        activeOrders += Number(row.count);
      }
    }

    // Calculate total estimated hours from subtasks assigned to this participant
    const hoursResult = queryOne<{ total_hours: number | null }>(
      `SELECT COALESCE(SUM(estimated_hours), 0) as total_hours
       FROM subtasks
       WHERE assigned_to = ?
         AND status NOT IN ('completed', 'archived')`,
      [participant]
    );

    workloadResults.push({
      participant,
      activeOrders,
      ordersByStatus,
      totalEstimatedHours: Number(hoursResult?.total_hours ?? 0),
    });
  }

  return workloadResults;
}

/**
 * Get overall order distribution by status
 * @returns Status distribution counts
 */
export async function getOrdersByStatus(): Promise<StatusDistribution> {
  const rows = query<{ status: OrderStatus; count: number }>(
    `SELECT status, COUNT(*) as count FROM orders GROUP BY status`
  );

  const distribution: StatusDistribution = {
    new: 0,
    in_progress: 0,
    review: 0,
    completed: 0,
    rejected: 0,
  };

  for (const row of rows) {
    distribution[row.status] = Number(row.count);
  }

  return distribution;
}
