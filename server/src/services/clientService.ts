import { query, queryOne } from '../db/pool.js';
import type { ParticipantName, OrderStatus } from '../types.js';

// Types for Client module
export interface ClientSummary {
  clientName: string;
  totalOrders: number;
  totalAmount: number;
  lastOrderDate: string | null;
}

export interface ClientStats {
  totalOrders: number;
  totalAmount: number;
  averageOrderValue: number;
  orderFrequencyDays: number | null;
  completedOrders: number;
  activeOrders: number;
}

export interface ClientOrder {
  id: string;
  orderNumber: number;
  title: string;
  description: string | null;
  status: OrderStatus;
  amount: number | null;
  createdAt: string;
  dueDate: string | null;
  assignedTo: ParticipantName[];
}

/**
 * Get list of unique clients with their metrics
 * Aggregates data from orders table
 * Requirements: 1.1, 1.2, 1.3
 */
export async function getClients(search?: string): Promise<ClientSummary[]> {
  let sql = `
    SELECT 
      client_name as clientName,
      COUNT(*) as totalOrders,
      COALESCE(SUM(amount), 0) as totalAmount,
      MAX(created_at) as lastOrderDate
    FROM orders
    WHERE client_name IS NOT NULL AND client_name != ''
  `;
  
  const params: unknown[] = [];
  
  if (search && search.trim()) {
    sql += ` AND client_name LIKE ?`;
    params.push(`%${search.trim()}%`);
  }
  
  sql += ` GROUP BY client_name ORDER BY lastOrderDate DESC`;
  
  const rows = query<{
    clientName: string;
    totalOrders: number;
    totalAmount: number;
    lastOrderDate: string | null;
  }>(sql, params);
  
  return rows.map(row => ({
    clientName: row.clientName,
    totalOrders: row.totalOrders,
    totalAmount: row.totalAmount,
    lastOrderDate: row.lastOrderDate,
  }));
}


/**
 * Get detailed statistics for a specific client
 * Requirements: 2.1, 2.2
 */
export async function getClientStats(clientName: string): Promise<ClientStats | null> {
  // Get basic stats
  const basicStats = queryOne<{
    totalOrders: number;
    totalAmount: number;
    completedOrders: number;
    activeOrders: number;
  }>(`
    SELECT 
      COUNT(*) as totalOrders,
      COALESCE(SUM(amount), 0) as totalAmount,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completedOrders,
      SUM(CASE WHEN status != 'completed' AND status != 'rejected' THEN 1 ELSE 0 END) as activeOrders
    FROM orders
    WHERE client_name = ?
  `, [clientName]);

  if (!basicStats || basicStats.totalOrders === 0) {
    return null;
  }

  // Calculate order frequency (average days between orders)
  const orderDates = query<{ created_at: string }>(`
    SELECT created_at
    FROM orders
    WHERE client_name = ?
    ORDER BY created_at ASC
  `, [clientName]);

  let orderFrequencyDays: number | null = null;
  
  if (orderDates.length >= 2) {
    const dates = orderDates.map(row => new Date(row.created_at).getTime());
    let totalDays = 0;
    for (let i = 1; i < dates.length; i++) {
      totalDays += (dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24);
    }
    orderFrequencyDays = Math.round(totalDays / (dates.length - 1));
  }

  const averageOrderValue = basicStats.totalOrders > 0 
    ? basicStats.totalAmount / basicStats.totalOrders 
    : 0;

  return {
    totalOrders: basicStats.totalOrders,
    totalAmount: basicStats.totalAmount,
    averageOrderValue: Math.round(averageOrderValue * 100) / 100,
    orderFrequencyDays,
    completedOrders: basicStats.completedOrders,
    activeOrders: basicStats.activeOrders,
  };
}

/**
 * Get all orders for a specific client, sorted by date descending
 * Requirements: 2.3, 2.4
 */
export async function getClientOrders(clientName: string): Promise<ClientOrder[]> {
  const rows = query<{
    id: string;
    order_number: number;
    title: string;
    description: string | null;
    status: OrderStatus;
    amount: number | null;
    created_at: string;
    due_date: string | null;
    assigned_to: string;
  }>(`
    SELECT 
      id,
      order_number,
      title,
      description,
      status,
      amount,
      created_at,
      due_date,
      assigned_to
    FROM orders
    WHERE client_name = ?
    ORDER BY created_at DESC
  `, [clientName]);

  return rows.map(row => ({
    id: row.id,
    orderNumber: row.order_number,
    title: row.title,
    description: row.description,
    status: row.status,
    amount: row.amount,
    createdAt: row.created_at,
    dueDate: row.due_date,
    assignedTo: row.assigned_to ? JSON.parse(row.assigned_to) : [],
  }));
}
