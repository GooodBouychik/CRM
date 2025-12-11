import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as statisticsService from '../services/statisticsService.js';

export async function statisticsRoutes(fastify: FastifyInstance) {
  // GET /api/statistics/revenue - Revenue by month
  // Requirements: 8.1, 8.2
  fastify.get('/api/statistics/revenue', async (request: FastifyRequest, reply: FastifyReply) => {
    const { from, to } = request.query as { from?: string; to?: string };

    // Default to last 12 months if no dates provided
    const dateTo = to ? new Date(to) : new Date();
    const dateFrom = from ? new Date(from) : new Date(dateTo.getFullYear(), dateTo.getMonth() - 11, 1);

    // Validate dates
    if (isNaN(dateFrom.getTime()) || isNaN(dateTo.getTime())) {
      return reply.status(400).send({
        error: 'validation',
        message: 'Некорректный период',
        fields: { from: 'Некорректная дата', to: 'Некорректная дата' },
      });
    }

    if (dateFrom > dateTo) {
      return reply.status(400).send({
        error: 'validation',
        message: 'Некорректный период',
        fields: { from: 'Дата начала должна быть раньше даты окончания' },
      });
    }

    const revenue = await statisticsService.getRevenueByMonth(dateFrom, dateTo);
    return revenue;
  });

  // GET /api/statistics/workload - Team workload
  // Requirements: 8.4
  fastify.get('/api/statistics/workload', async (_request: FastifyRequest, _reply: FastifyReply) => {
    const workload = await statisticsService.getTeamWorkload();
    return workload;
  });

  // GET /api/statistics/overview - General stats (order distribution by status)
  // Requirements: 8.1
  fastify.get('/api/statistics/overview', async (_request: FastifyRequest, _reply: FastifyReply) => {
    const statusDistribution = await statisticsService.getOrdersByStatus();
    
    // Calculate totals for overview
    const totalOrders = Object.values(statusDistribution).reduce((sum, count) => sum + count, 0);
    const activeOrders = statusDistribution.new + statusDistribution.in_progress + statusDistribution.review;
    
    return {
      statusDistribution,
      totalOrders,
      activeOrders,
      completedOrders: statusDistribution.completed,
      rejectedOrders: statusDistribution.rejected,
    };
  });
}
