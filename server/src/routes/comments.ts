import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { 
  CommentFilterSchema,
  validateCreateComment,
  validateUpdateComment,
  validateToggleReaction
} from '../schemas/comment.schema.js';
import * as commentService from '../services/commentService.js';
import { 
  emitCommentCreated, 
  emitCommentUpdated, 
  emitCommentDeleted, 
  emitReactionToggled 
} from '../socket/index.js';
import { 
  queueNewCommentNotification,
  queueMentionNotification,
  queueReplyNotification
} from '../services/notificationQueue.js';
import * as orderService from '../services/orderService.js';
import type { ParticipantName } from '../types.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Valid participant names for mention detection
const VALID_PARTICIPANTS: ParticipantName[] = ['Никита', 'Саня', 'Ксюша'];

/**
 * Detect @mentions in comment content
 * Returns array of mentioned participant names
 */
function detectMentions(content: string): ParticipantName[] {
  const mentions: ParticipantName[] = [];
  for (const name of VALID_PARTICIPANTS) {
    if (content.includes(`@${name}`)) {
      mentions.push(name);
    }
  }
  return mentions;
}

export async function commentRoutes(fastify: FastifyInstance) {
  // GET /api/orders/:id/comments - List comments for an order with pagination
  fastify.get('/api/orders/:id/comments', async (
    request: FastifyRequest<{ Params: { id: string } }>, 
    reply: FastifyReply
  ) => {
    const { id } = request.params;
    
    if (!UUID_REGEX.test(id)) {
      return reply.status(400).send({
        error: 'validation',
        message: 'Invalid order ID format',
      });
    }

    // Check if order exists
    const exists = await commentService.orderExists(id);
    if (!exists) {
      return reply.status(404).send({
        error: 'not_found',
        resource: 'order',
        message: `Order with ID ${id} not found`,
      });
    }

    const filterResult = CommentFilterSchema.safeParse(request.query);
    
    if (!filterResult.success) {
      return reply.status(400).send({
        error: 'validation',
        message: 'Invalid filter parameters',
        details: filterResult.error.errors,
      });
    }

    const comments = await commentService.getCommentsByOrderId(id, filterResult.data);
    const total = await commentService.getCommentCount(id);
    
    return {
      comments,
      total,
      limit: filterResult.data.limit,
      offset: filterResult.data.offset,
    };
  });


  // POST /api/orders/:id/comments - Create a new comment
  fastify.post('/api/orders/:id/comments', async (
    request: FastifyRequest<{ Params: { id: string } }>, 
    reply: FastifyReply
  ) => {
    const { id } = request.params;
    
    if (!UUID_REGEX.test(id)) {
      return reply.status(400).send({
        error: 'validation',
        message: 'Invalid order ID format',
      });
    }

    // Check if order exists
    const exists = await commentService.orderExists(id);
    if (!exists) {
      return reply.status(404).send({
        error: 'not_found',
        resource: 'order',
        message: `Order with ID ${id} not found`,
      });
    }

    const validation = validateCreateComment(request.body);
    
    if (!validation.success) {
      return reply.status(400).send({
        error: 'validation',
        message: 'Invalid comment data',
        fields: validation.error.errors.reduce((acc, err) => {
          const path = err.path.join('.');
          acc[path] = err.message;
          return acc;
        }, {} as Record<string, string>),
      });
    }

    // If parentId is provided, verify it exists and belongs to the same order
    if (validation.data.parentId) {
      const parentComment = await commentService.getCommentById(validation.data.parentId);
      if (!parentComment) {
        return reply.status(400).send({
          error: 'validation',
          message: 'Parent comment not found',
        });
      }
      if (parentComment.orderId !== id) {
        return reply.status(400).send({
          error: 'validation',
          message: 'Parent comment belongs to a different order',
        });
      }
    }

    const comment = await commentService.createComment(id, validation.data);
    
    // Broadcast comment creation to clients viewing this order
    emitCommentCreated(id, comment);
    
    // Get order details for notifications
    const order = await orderService.getOrderById(id);
    if (order && !validation.data.isSystem) {
      // Queue new comment notification (Requirements 8.2)
      await queueNewCommentNotification(
        { id: order.id, orderNumber: order.orderNumber, title: order.title },
        { id: comment.id, author: comment.author, content: comment.content },
        comment.author // Exclude the author from receiving notification
      );
      
      // Queue mention notifications (Requirements 8.5)
      const mentions = detectMentions(comment.content);
      for (const mentionedUser of mentions) {
        if (mentionedUser !== comment.author) {
          await queueMentionNotification(
            { id: order.id, orderNumber: order.orderNumber, title: order.title },
            { id: comment.id, author: comment.author, content: comment.content },
            mentionedUser
          );
        }
      }
      
      // Queue reply notification (Requirements 8.6)
      if (validation.data.parentId) {
        const parentComment = await commentService.getCommentById(validation.data.parentId);
        if (parentComment && parentComment.author !== comment.author) {
          await queueReplyNotification(
            { id: order.id, orderNumber: order.orderNumber, title: order.title },
            { id: comment.id, author: comment.author, content: comment.content },
            parentComment.author
          );
        }
      }
    }
    
    return reply.status(201).send(comment);
  });

  // PATCH /api/comments/:id - Update a comment
  fastify.patch('/api/comments/:id', async (
    request: FastifyRequest<{ Params: { id: string } }>, 
    reply: FastifyReply
  ) => {
    const { id } = request.params;
    
    if (!UUID_REGEX.test(id)) {
      return reply.status(400).send({
        error: 'validation',
        message: 'Invalid comment ID format',
      });
    }

    const validation = validateUpdateComment(request.body);
    
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

    const comment = await commentService.updateComment(id, validation.data);
    
    if (!comment) {
      return reply.status(404).send({
        error: 'not_found',
        resource: 'comment',
        message: `Comment with ID ${id} not found`,
      });
    }

    // Broadcast comment update to clients viewing this order
    emitCommentUpdated(comment.orderId, comment);

    return comment;
  });


  // DELETE /api/comments/:id - Delete a comment
  fastify.delete('/api/comments/:id', async (
    request: FastifyRequest<{ Params: { id: string } }>, 
    reply: FastifyReply
  ) => {
    const { id } = request.params;
    
    if (!UUID_REGEX.test(id)) {
      return reply.status(400).send({
        error: 'validation',
        message: 'Invalid comment ID format',
      });
    }

    // Get comment first to know the orderId for broadcasting
    const comment = await commentService.getCommentById(id);
    if (!comment) {
      return reply.status(404).send({
        error: 'not_found',
        resource: 'comment',
        message: `Comment with ID ${id} not found`,
      });
    }

    const deleted = await commentService.deleteComment(id);
    
    if (!deleted) {
      return reply.status(404).send({
        error: 'not_found',
        resource: 'comment',
        message: `Comment with ID ${id} not found`,
      });
    }

    // Broadcast comment deletion to clients viewing this order
    emitCommentDeleted(comment.orderId, id);

    return reply.status(204).send();
  });

  // POST /api/comments/:id/reactions - Toggle a reaction on a comment
  fastify.post('/api/comments/:id/reactions', async (
    request: FastifyRequest<{ Params: { id: string } }>, 
    reply: FastifyReply
  ) => {
    const { id } = request.params;
    
    if (!UUID_REGEX.test(id)) {
      return reply.status(400).send({
        error: 'validation',
        message: 'Invalid comment ID format',
      });
    }

    const validation = validateToggleReaction(request.body);
    
    if (!validation.success) {
      return reply.status(400).send({
        error: 'validation',
        message: 'Invalid reaction data',
        fields: validation.error.errors.reduce((acc, err) => {
          const path = err.path.join('.');
          acc[path] = err.message;
          return acc;
        }, {} as Record<string, string>),
      });
    }

    const comment = await commentService.toggleReaction(id, validation.data);
    
    if (!comment) {
      return reply.status(404).send({
        error: 'not_found',
        resource: 'comment',
        message: `Comment with ID ${id} not found`,
      });
    }

    // Broadcast reaction toggle to clients viewing this order
    emitReactionToggled(comment.orderId, id, comment.reactions);

    return comment;
  });
}
