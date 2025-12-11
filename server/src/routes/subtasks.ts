import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { 
  validateCreateSubtask,
  validateUpdateSubtask,
  validateMoveSubtask 
} from '../schemas/subtask.schema.js';
import * as subtaskService from '../services/subtaskService.js';
import { 
  emitSubtaskCreated, 
  emitSubtaskUpdated, 
  emitSubtaskMoved, 
  emitSubtaskDeleted 
} from '../socket/index.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function subtaskRoutes(fastify: FastifyInstance) {
  // GET /api/orders/:id/subtasks - List subtasks for an order
  fastify.get('/api/orders/:id/subtasks', async (
    request: FastifyRequest<{ Params: { id: string } }>, 
    reply: FastifyReply
  ) => {
    const { id: orderId } = request.params;
    
    if (!UUID_REGEX.test(orderId)) {
      return reply.status(400).send({
        error: 'validation',
        message: 'Invalid order ID format',
      });
    }

    // Check if order exists
    const exists = await subtaskService.orderExists(orderId);
    if (!exists) {
      return reply.status(404).send({
        error: 'not_found',
        resource: 'order',
        message: `Order with ID ${orderId} not found`,
      });
    }

    const subtasks = await subtaskService.getSubtasksByOrderId(orderId);
    return subtasks;
  });

  // POST /api/orders/:id/subtasks - Create a new subtask
  fastify.post('/api/orders/:id/subtasks', async (
    request: FastifyRequest<{ Params: { id: string } }>, 
    reply: FastifyReply
  ) => {
    const { id: orderId } = request.params;
    
    if (!UUID_REGEX.test(orderId)) {
      return reply.status(400).send({
        error: 'validation',
        message: 'Invalid order ID format',
      });
    }


    // Check if order exists
    const exists = await subtaskService.orderExists(orderId);
    if (!exists) {
      return reply.status(404).send({
        error: 'not_found',
        resource: 'order',
        message: `Order with ID ${orderId} not found`,
      });
    }

    const validation = validateCreateSubtask(request.body);
    
    if (!validation.success) {
      return reply.status(400).send({
        error: 'validation',
        message: 'Invalid subtask data',
        fields: validation.error.errors.reduce((acc, err) => {
          const path = err.path.join('.');
          acc[path] = err.message;
          return acc;
        }, {} as Record<string, string>),
      });
    }

    const subtask = await subtaskService.createSubtask(orderId, validation.data);
    
    // Broadcast subtask creation to clients viewing this order
    emitSubtaskCreated(orderId, subtask);
    
    return reply.status(201).send(subtask);
  });

  // PATCH /api/subtasks/:id - Update a subtask
  fastify.patch('/api/subtasks/:id', async (
    request: FastifyRequest<{ Params: { id: string } }>, 
    reply: FastifyReply
  ) => {
    const { id } = request.params;
    
    if (!UUID_REGEX.test(id)) {
      return reply.status(400).send({
        error: 'validation',
        message: 'Invalid subtask ID format',
      });
    }

    const validation = validateUpdateSubtask(request.body);
    
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

    const subtask = await subtaskService.updateSubtask(id, validation.data);
    
    if (!subtask) {
      return reply.status(404).send({
        error: 'not_found',
        resource: 'subtask',
        message: `Subtask with ID ${id} not found`,
      });
    }

    // Broadcast subtask update to clients viewing this order
    emitSubtaskUpdated(subtask.orderId, subtask);

    return subtask;
  });


  // DELETE /api/subtasks/:id - Delete a subtask
  fastify.delete('/api/subtasks/:id', async (
    request: FastifyRequest<{ Params: { id: string } }>, 
    reply: FastifyReply
  ) => {
    const { id } = request.params;
    
    if (!UUID_REGEX.test(id)) {
      return reply.status(400).send({
        error: 'validation',
        message: 'Invalid subtask ID format',
      });
    }

    // Get subtask first to know the orderId for broadcasting
    const subtask = await subtaskService.getSubtaskById(id);
    if (!subtask) {
      return reply.status(404).send({
        error: 'not_found',
        resource: 'subtask',
        message: `Subtask with ID ${id} not found`,
      });
    }

    const deleted = await subtaskService.deleteSubtask(id);
    
    if (!deleted) {
      return reply.status(404).send({
        error: 'not_found',
        resource: 'subtask',
        message: `Subtask with ID ${id} not found`,
      });
    }

    // Broadcast subtask deletion to clients viewing this order
    emitSubtaskDeleted(subtask.orderId, id);

    return reply.status(204).send();
  });

  // POST /api/subtasks/:id/move - Move a subtask to a different column
  fastify.post('/api/subtasks/:id/move', async (
    request: FastifyRequest<{ Params: { id: string } }>, 
    reply: FastifyReply
  ) => {
    const { id } = request.params;
    
    if (!UUID_REGEX.test(id)) {
      return reply.status(400).send({
        error: 'validation',
        message: 'Invalid subtask ID format',
      });
    }

    const validation = validateMoveSubtask(request.body);
    
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

    const subtask = await subtaskService.moveSubtask(id, validation.data);
    
    if (!subtask) {
      return reply.status(404).send({
        error: 'not_found',
        resource: 'subtask',
        message: `Subtask with ID ${id} not found`,
      });
    }

    // Broadcast subtask move to clients viewing this order
    emitSubtaskMoved(subtask.orderId, subtask);

    return subtask;
  });
}
