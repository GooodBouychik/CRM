import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as calendarService from '../services/calendarService.js';

export async function calendarRoutes(fastify: FastifyInstance) {
  // GET /api/calendar/subtasks - Subtasks for date range
  // Requirements: 10.1, 10.5
  fastify.get('/api/calendar/subtasks', async (request: FastifyRequest, reply: FastifyReply) => {
    const { from, to } = request.query as { from?: string; to?: string };

    // Validate required parameters
    if (!from || !to) {
      return reply.status(400).send({
        error: 'validation',
        message: 'Некорректная дата',
        fields: { 
          from: !from ? 'Дата начала обязательна' : undefined,
          to: !to ? 'Дата окончания обязательна' : undefined,
        },
      });
    }

    // Validate date formats
    const fromDate = new Date(from);
    const toDate = new Date(to);

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return reply.status(400).send({
        error: 'validation',
        message: 'Некорректная дата',
        fields: { 
          from: isNaN(fromDate.getTime()) ? 'Некорректный формат даты' : undefined,
          to: isNaN(toDate.getTime()) ? 'Некорректный формат даты' : undefined,
        },
      });
    }

    if (fromDate > toDate) {
      return reply.status(400).send({
        error: 'validation',
        message: 'Некорректная дата',
        fields: { from: 'Дата начала должна быть раньше даты окончания' },
      });
    }

    const subtasks = await calendarService.getSubtasksByDateRange(from, to);
    return subtasks;
  });

  // POST /api/calendar/subtasks/:id/move - Move subtask to date
  // Requirements: 10.3, 10.4
  fastify.post('/api/calendar/subtasks/:id/move', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { date } = request.body as { date?: string };

    // Validate required parameters
    if (!date) {
      return reply.status(400).send({
        error: 'validation',
        message: 'Некорректная дата',
        fields: { date: 'Дата обязательна' },
      });
    }

    // Validate date format
    const newDate = new Date(date);
    if (isNaN(newDate.getTime())) {
      return reply.status(400).send({
        error: 'validation',
        message: 'Некорректная дата',
        fields: { date: 'Некорректный формат даты' },
      });
    }

    const updatedSubtask = await calendarService.moveSubtaskToDate(id, date);

    if (!updatedSubtask) {
      return reply.status(404).send({
        error: 'not_found',
        message: 'Подзадача не найдена',
      });
    }

    return updatedSubtask;
  });

  // GET /api/calendar/workload - Get workload for date range
  // Requirements: 10.2
  fastify.get('/api/calendar/workload', async (request: FastifyRequest, reply: FastifyReply) => {
    const { from, to } = request.query as { from?: string; to?: string };

    // Validate required parameters
    if (!from || !to) {
      return reply.status(400).send({
        error: 'validation',
        message: 'Некорректная дата',
        fields: { 
          from: !from ? 'Дата начала обязательна' : undefined,
          to: !to ? 'Дата окончания обязательна' : undefined,
        },
      });
    }

    // Validate date formats
    const fromDate = new Date(from);
    const toDate = new Date(to);

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return reply.status(400).send({
        error: 'validation',
        message: 'Некорректная дата',
        fields: { 
          from: isNaN(fromDate.getTime()) ? 'Некорректный формат даты' : undefined,
          to: isNaN(toDate.getTime()) ? 'Некорректный формат даты' : undefined,
        },
      });
    }

    const workload = await calendarService.getWorkloadByDateRange(from, to);
    return workload;
  });
}
