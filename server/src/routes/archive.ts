import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { query, queryOne } from '../db/pool.js';
import { ParticipantNameSchema } from '../schemas/order.schema.js';
import { getOrderHistory } from '../services/historyService.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ArchiveFilterSchema = z.object({
  search: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  participant: ParticipantNameSchema.optional(),
  status: z.enum(['completed', 'rejected']).optional(),
  limit: z.coerce.number().int().positive().optional().default(100),
  offset: z.coerce.number().int().nonnegative().optional().default(0),
});

function mapOrder(row: any) {
  return {
    id: row.id,
    orderNumber: row.order_number,
    title: row.title,
    description: row.description,
    clientName: row.client_name,
    amount: row.amount,
    status: row.status,
    priority: row.priority,
    dueDate: row.due_date,
    tags: row.tags ? JSON.parse(row.tags) : [],
    assignedTo: row.assigned_to ? JSON.parse(row.assigned_to) : [],
    isFavorite: Boolean(row.is_favorite),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
    completedAt: row.updated_at,
    totalComments: row.totalComments ?? 0,
    participants: row.assigned_to ? JSON.parse(row.assigned_to) : [],
  };
}

export async function archiveRoutes(fastify: FastifyInstance) {
  fastify.get('/api/orders/archive', async (request: FastifyRequest, reply: FastifyReply) => {
    const filterResult = ArchiveFilterSchema.safeParse(request.query);

    if (!filterResult.success) {
      return reply.status(400).send({
        error: 'validation',
        message: 'Invalid filter parameters',
        details: filterResult.error.errors,
      });
    }

    const filter = filterResult.data;
    const conditions: string[] = ["o.status IN ('completed', 'rejected')"];
    const params: unknown[] = [];

    if (filter.status) {
      conditions.push(`o.status = ?`);
      params.push(filter.status);
    }

    if (filter.search) {
      conditions.push(`(o.title LIKE ? OR o.client_name LIKE ? OR CAST(o.order_number AS TEXT) LIKE ?)`);
      const searchPattern = `%${filter.search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    if (filter.dateFrom) {
      conditions.push(`o.updated_at >= ?`);
      params.push(filter.dateFrom.toISOString());
    }
    if (filter.dateTo) {
      conditions.push(`o.updated_at <= ?`);
      params.push(filter.dateTo.toISOString());
    }

    if (filter.participant) {
      conditions.push(`o.assigned_to LIKE ?`);
      params.push(`%"${filter.participant}"%`);
    }

    const whereClause = conditions.join(' AND ');
    params.push(filter.limit, filter.offset);

    const rows = query<any>(
      `SELECT o.*, 
              (SELECT COUNT(*) FROM comments c WHERE c.order_id = o.id) as totalComments
       FROM orders o
       WHERE ${whereClause}
       ORDER BY o.updated_at DESC
       LIMIT ? OFFSET ?`,
      params
    );

    return rows.map(mapOrder);
  });

  fastify.get('/api/orders/archive/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;

    if (!UUID_REGEX.test(id)) {
      return reply.status(400).send({
        error: 'validation',
        message: 'Invalid order ID format',
      });
    }

    const row = queryOne<any>(
      `SELECT o.*, 
              (SELECT COUNT(*) FROM comments c WHERE c.order_id = o.id) as totalComments
       FROM orders o
       WHERE o.id = ? AND o.status IN ('completed', 'rejected')`,
      [id]
    );

    if (!row) {
      return reply.status(404).send({
        error: 'not_found',
        resource: 'archived_order',
        message: `Archived order with ID ${id} not found`,
      });
    }

    const order = mapOrder(row);

    const comments = query<any>(
      `SELECT * FROM comments WHERE order_id = ? ORDER BY created_at ASC`,
      [id]
    ).map(c => ({
      id: c.id,
      orderId: c.order_id,
      author: c.author,
      content: c.content,
      isSystem: Boolean(c.is_system),
      parentId: c.parent_id,
      reactions: c.reactions ? JSON.parse(c.reactions) : {},
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    }));

    const history = await getOrderHistory(id);

    return { order, comments, history };
  });
}
