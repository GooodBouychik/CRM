import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import * as userService from '../services/userService.js';
import type { UpdatePreferencesInput } from '../services/userService.js';

// Validation schemas
const ParticipantNameSchema = z.enum(['Никита', 'Саня', 'Ксюша']);

const NotificationPreferencesSchema = z.object({
  newOrder: z.boolean().optional(),
  comments: z.boolean().optional(),
  statusChanges: z.boolean().optional(),
  mentions: z.boolean().optional(),
  deadlineReminders: z.boolean().optional(),
});

const QuietHoursSchema = z.object({
  enabled: z.boolean().optional(),
  start: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  end: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
});

const DailyDigestSchema = z.object({
  enabled: z.boolean().optional(),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
});

const UpdatePreferencesSchema = z.object({
  notifications: NotificationPreferencesSchema.optional(),
  quietHours: QuietHoursSchema.optional(),
  dailyDigest: DailyDigestSchema.optional(),
});

export async function userRoutes(fastify: FastifyInstance) {
  // GET /api/users - List all users
  fastify.get('/api/users', async (_request: FastifyRequest, _reply: FastifyReply) => {
    const users = await userService.getAllUsers();
    return users;
  });

  // GET /api/users/:name - Get user by name
  fastify.get('/api/users/:name', async (request: FastifyRequest<{ Params: { name: string } }>, reply: FastifyReply) => {
    const { name } = request.params;
    
    const nameValidation = ParticipantNameSchema.safeParse(name);
    if (!nameValidation.success) {
      return reply.status(400).send({
        error: 'validation',
        message: 'Invalid user name. Must be one of: Никита, Саня, Ксюша',
      });
    }


    const user = await userService.getUserByName(nameValidation.data);
    
    if (!user) {
      return reply.status(404).send({
        error: 'not_found',
        resource: 'user',
        message: `User ${name} not found`,
      });
    }

    return user;
  });

  // PATCH /api/users/:name/preferences - Update user preferences
  fastify.patch('/api/users/:name/preferences', async (
    request: FastifyRequest<{ Params: { name: string } }>,
    reply: FastifyReply
  ) => {
    const { name } = request.params;
    
    const nameValidation = ParticipantNameSchema.safeParse(name);
    if (!nameValidation.success) {
      return reply.status(400).send({
        error: 'validation',
        message: 'Invalid user name. Must be one of: Никита, Саня, Ксюша',
      });
    }

    const prefsValidation = UpdatePreferencesSchema.safeParse(request.body);
    if (!prefsValidation.success) {
      return reply.status(400).send({
        error: 'validation',
        message: 'Invalid preferences data',
        details: prefsValidation.error.errors,
      });
    }

    const user = await userService.updateUserPreferences(
      nameValidation.data,
      prefsValidation.data as UpdatePreferencesInput
    );
    
    if (!user) {
      return reply.status(404).send({
        error: 'not_found',
        resource: 'user',
        message: `User ${name} not found`,
      });
    }

    return user;
  });

  // GET /api/users/:name/preferences - Get user preferences
  fastify.get('/api/users/:name/preferences', async (
    request: FastifyRequest<{ Params: { name: string } }>,
    reply: FastifyReply
  ) => {
    const { name } = request.params;
    
    const nameValidation = ParticipantNameSchema.safeParse(name);
    if (!nameValidation.success) {
      return reply.status(400).send({
        error: 'validation',
        message: 'Invalid user name. Must be one of: Никита, Саня, Ксюша',
      });
    }

    const user = await userService.getUserByName(nameValidation.data);
    
    if (!user) {
      return reply.status(404).send({
        error: 'not_found',
        resource: 'user',
        message: `User ${name} not found`,
      });
    }

    return user.preferences;
  });
}
