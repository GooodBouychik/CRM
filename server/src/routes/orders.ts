import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { 
  CreateOrderSchema, 
  UpdateOrderSchema, 
  OrderFilterSchema,
  validateCreateOrder,
  validateUpdateOrder 
} from '../schemas/order.schema.js';
import * as orderService from '../services/orderService.js';
import { getOrderHistory } from '../services/historyService.js';
import { getOrderJourney } from '../services/orderJourneyService.js';
import { emitOrderCreated, emitOrderUpdated, emitOrderDeleted } from '../socket/index.js';
import { 
  queueNewOrderNotification, 
  queueStatusChangeNotification 
} from '../services/notificationQueue.js';

export async function orderRoutes(fastify: FastifyInstance) {
  // GET /api/orders - List orders with filtering and sorting
  fastify.get('/api/orders', async (request: FastifyRequest, reply: FastifyReply) => {
    const filterResult = OrderFilterSchema.safeParse(request.query);
    
    if (!filterResult.success) {
      return reply.status(400).send({
        error: 'validation',
        message: 'Invalid filter parameters',
        details: filterResult.error.errors,
      });
    }

    const orders = await orderService.getOrders(filterResult.data);
    return orders;
  });

  // POST /api/orders - Create a new order
  fastify.post('/api/orders', async (request: FastifyRequest, reply: FastifyReply) => {
    const validation = validateCreateOrder(request.body);
    
    if (!validation.success) {
      return reply.status(400).send({
        error: 'validation',
        message: 'Invalid order data',
        fields: validation.error.errors.reduce((acc, err) => {
          const path = err.path.join('.');
          acc[path] = err.message;
          return acc;
        }, {} as Record<string, string>),
      });
    }

    const order = await orderService.createOrder(validation.data);
    
    // Broadcast order creation to all connected clients
    emitOrderCreated(order);
    
    // Queue Telegram notification for new order (Requirements 8.1)
    await queueNewOrderNotification(
      { id: order.id, orderNumber: order.orderNumber, title: order.title, clientName: order.clientName },
      validation.data.updatedBy
    );
    
    return reply.status(201).send(order);
  });


  // GET /api/orders/:id - Get a single order
  fastify.get('/api/orders/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return reply.status(400).send({
        error: 'validation',
        message: 'Invalid order ID format',
      });
    }

    const order = await orderService.getOrderById(id);
    
    if (!order) {
      return reply.status(404).send({
        error: 'not_found',
        resource: 'order',
        message: `Order with ID ${id} not found`,
      });
    }

    return order;
  });

  // PATCH /api/orders/:id - Update an order
  fastify.patch('/api/orders/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return reply.status(400).send({
        error: 'validation',
        message: 'Invalid order ID format',
      });
    }

    const validation = validateUpdateOrder(request.body);
    
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

    // Get current order to detect status change (Requirements 8.3)
    const currentOrder = await orderService.getOrderById(id);
    const oldStatus = currentOrder?.status;

    const order = await orderService.updateOrder(id, validation.data);
    
    if (!order) {
      return reply.status(404).send({
        error: 'not_found',
        resource: 'order',
        message: `Order with ID ${id} not found`,
      });
    }

    // Broadcast order update to all connected clients
    emitOrderUpdated(order);

    // Queue Telegram notification for status change (Requirements 8.3)
    if (validation.data.status && oldStatus && validation.data.status !== oldStatus) {
      await queueStatusChangeNotification(
        { id: order.id, orderNumber: order.orderNumber, title: order.title },
        oldStatus,
        validation.data.status,
        validation.data.updatedBy
      );
    }

    return order;
  });

  // DELETE /api/orders/:id - Delete an order
  fastify.delete('/api/orders/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return reply.status(400).send({
        error: 'validation',
        message: 'Invalid order ID format',
      });
    }

    const deleted = await orderService.deleteOrder(id);
    
    if (!deleted) {
      return reply.status(404).send({
        error: 'not_found',
        resource: 'order',
        message: `Order with ID ${id} not found`,
      });
    }

    // Broadcast order deletion to all connected clients
    emitOrderDeleted(id);

    return reply.status(204).send();
  });

  // GET /api/orders/:id/history - Get order change history (Requirements 10.2, 10.3)
  fastify.get('/api/orders/:id/history', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return reply.status(400).send({
        error: 'validation',
        message: 'Invalid order ID format',
      });
    }

    // Check if order exists
    const order = await orderService.getOrderById(id);
    if (!order) {
      return reply.status(404).send({
        error: 'not_found',
        resource: 'order',
        message: `Order with ID ${id} not found`,
      });
    }

    const history = await getOrderHistory(id);
    return history;
  });

  // GET /api/orders/:id/journey - Get order journey (Requirements 4.1, 4.2, 4.3, 4.4, 4.5)
  fastify.get('/api/orders/:id/journey', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return reply.status(400).send({
        error: 'validation',
        message: 'Invalid order ID format',
      });
    }

    const journey = await getOrderJourney(id);
    
    if (!journey) {
      return reply.status(404).send({
        error: 'not_found',
        resource: 'order',
        message: `Order with ID ${id} not found`,
      });
    }

    return journey;
  });
}
