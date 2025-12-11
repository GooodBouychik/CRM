import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getRecentActivity } from '../services/activityService.js';

export async function activityRoutes(fastify: FastifyInstance) {
  // GET /api/activity - Get recent activity feed
  fastify.get('/api/activity', async (request: FastifyRequest<{ Querystring: { limit?: string } }>, reply: FastifyReply) => {
    const limit = Math.min(parseInt(request.query.limit || '50', 10), 100);
    
    const activities = await getRecentActivity(limit);
    return activities;
  });
}
