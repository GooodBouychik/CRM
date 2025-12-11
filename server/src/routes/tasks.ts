import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  TaskFilterSchema,
  validateCreateTask,
  validateUpdateTask,
  validateMoveTask,
} from '../schemas/dashboardTask.schema.js';
import * as taskService from '../services/dashboardTaskService.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function taskRoutes(fastify: FastifyInstance) {
  // GET /api/tasks - List tasks with optional filters
  fastify.get('/api/tasks', async (request: FastifyRequest, reply: FastifyReply) => {
    const filterResult = TaskFilterSchema.safeParse(request.query);

    if (!filterResult.success) {
      return reply.status(400).send({
        error: 'validation',
        message: 'Invalid filter parameters',
        details: filterResult.error.errors,
      });
    }

    const tasks = await taskService.getTasks(filterResult.data);
    return tasks;
  });

  // POST /api/tasks - Create a new task
  fastify.post('/api/tasks', async (request: FastifyRequest, reply: FastifyReply) => {
    const validation = validateCreateTask(request.body);

    if (!validation.success) {
      return reply.status(400).send({
        error: 'validation',
        message: 'Invalid task data',
        fields: validation.error.errors.reduce((acc, err) => {
          const path = err.path.join('.');
          acc[path] = err.message;
          return acc;
        }, {} as Record<string, string>),
      });
    }

    const task = await taskService.createTask(validation.data);
    return reply.status(201).send(task);
  });

  // GET /api/tasks/:id - Get a single task
  fastify.get('/api/tasks/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;

    if (!UUID_REGEX.test(id)) {
      return reply.status(400).send({
        error: 'validation',
        message: 'Invalid task ID format',
      });
    }

    const task = await taskService.getTaskById(id);

    if (!task) {
      return reply.status(404).send({
        error: 'not_found',
        resource: 'task',
        message: `Task with ID ${id} not found`,
      });
    }

    return task;
  });


  // PATCH /api/tasks/:id - Update a task
  fastify.patch('/api/tasks/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;

    if (!UUID_REGEX.test(id)) {
      return reply.status(400).send({
        error: 'validation',
        message: 'Invalid task ID format',
      });
    }

    const validation = validateUpdateTask(request.body);

    if (!validation.success) {
      return reply.status(400).send({
        error: 'validation',
        message: 'Invalid update data',
        fields: validation.error.errors.reduce((acc, err) => {
          const path = err.path.join('.');
          acc[path] = err.message;
          return acc;
        }, {} as Record<string, string>),
      });
    }

    const task = await taskService.updateTask(id, validation.data);

    if (!task) {
      return reply.status(404).send({
        error: 'not_found',
        resource: 'task',
        message: `Task with ID ${id} not found`,
      });
    }

    return task;
  });

  // POST /api/tasks/:id/move - Move task to a different column/position
  fastify.post('/api/tasks/:id/move', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;

    if (!UUID_REGEX.test(id)) {
      return reply.status(400).send({
        error: 'validation',
        message: 'Invalid task ID format',
      });
    }

    const validation = validateMoveTask(request.body);

    if (!validation.success) {
      return reply.status(400).send({
        error: 'validation',
        message: 'Invalid move data',
        fields: validation.error.errors.reduce((acc, err) => {
          const path = err.path.join('.');
          acc[path] = err.message;
          return acc;
        }, {} as Record<string, string>),
      });
    }

    const task = await taskService.moveTask(id, validation.data);

    if (!task) {
      return reply.status(404).send({
        error: 'not_found',
        resource: 'task',
        message: `Task with ID ${id} not found`,
      });
    }

    return task;
  });

  // DELETE /api/tasks/:id - Delete a task
  fastify.delete('/api/tasks/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;

    if (!UUID_REGEX.test(id)) {
      return reply.status(400).send({
        error: 'validation',
        message: 'Invalid task ID format',
      });
    }

    const deleted = await taskService.deleteTask(id);

    if (!deleted) {
      return reply.status(404).send({
        error: 'not_found',
        resource: 'task',
        message: `Task with ID ${id} not found`,
      });
    }

    return reply.status(204).send();
  });
}
