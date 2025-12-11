import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  AccountSearchSchema,
  validateCreateAccount,
  validateUpdateAccount,
  validateCreateCategory,
} from '../schemas/serviceAccount.schema.js';
import * as accountService from '../services/serviceAccountService.js';
import * as categoryService from '../services/accountCategoryService.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function accountRoutes(fastify: FastifyInstance) {
  // GET /api/accounts/categories - List all categories
  fastify.get('/api/accounts/categories', async (_request: FastifyRequest, _reply: FastifyReply) => {
    const categories = await categoryService.getCategories();
    return categories;
  });

  // POST /api/accounts/categories - Create a new category
  fastify.post('/api/accounts/categories', async (request: FastifyRequest, reply: FastifyReply) => {
    const validation = validateCreateCategory(request.body);

    if (!validation.success) {
      return reply.status(400).send({
        error: 'validation',
        message: 'Invalid category data',
        fields: validation.error.errors.reduce((acc, err) => {
          const path = err.path.join('.');
          acc[path] = err.message;
          return acc;
        }, {} as Record<string, string>),
      });
    }

    const category = await categoryService.createCategory(validation.data);
    return reply.status(201).send(category);
  });

  // GET /api/accounts - List accounts with optional search
  fastify.get('/api/accounts', async (request: FastifyRequest, reply: FastifyReply) => {
    const filterResult = AccountSearchSchema.safeParse(request.query);

    if (!filterResult.success) {
      return reply.status(400).send({
        error: 'validation',
        message: 'Invalid filter parameters',
        details: filterResult.error.errors,
      });
    }

    const accounts = await accountService.getAccounts(filterResult.data);
    return accounts;
  });


  // POST /api/accounts - Create a new account
  fastify.post('/api/accounts', async (request: FastifyRequest, reply: FastifyReply) => {
    const validation = validateCreateAccount(request.body);

    if (!validation.success) {
      return reply.status(400).send({
        error: 'validation',
        message: 'Invalid account data',
        fields: validation.error.errors.reduce((acc, err) => {
          const path = err.path.join('.');
          acc[path] = err.message;
          return acc;
        }, {} as Record<string, string>),
      });
    }

    const account = await accountService.createAccount(validation.data);
    return reply.status(201).send(account);
  });

  // GET /api/accounts/:id - Get a single account
  fastify.get('/api/accounts/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;

    if (!UUID_REGEX.test(id)) {
      return reply.status(400).send({
        error: 'validation',
        message: 'Invalid account ID format',
      });
    }

    const account = await accountService.getAccountById(id);

    if (!account) {
      return reply.status(404).send({
        error: 'not_found',
        resource: 'account',
        message: `Account with ID ${id} not found`,
      });
    }

    return account;
  });

  // PATCH /api/accounts/:id - Update an account
  fastify.patch('/api/accounts/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;

    if (!UUID_REGEX.test(id)) {
      return reply.status(400).send({
        error: 'validation',
        message: 'Invalid account ID format',
      });
    }

    const validation = validateUpdateAccount(request.body);

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

    const account = await accountService.updateAccount(id, validation.data);

    if (!account) {
      return reply.status(404).send({
        error: 'not_found',
        resource: 'account',
        message: `Account with ID ${id} not found`,
      });
    }

    return account;
  });

  // DELETE /api/accounts/:id - Delete an account
  fastify.delete('/api/accounts/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;

    if (!UUID_REGEX.test(id)) {
      return reply.status(400).send({
        error: 'validation',
        message: 'Invalid account ID format',
      });
    }

    const deleted = await accountService.deleteAccount(id);

    if (!deleted) {
      return reply.status(404).send({
        error: 'not_found',
        resource: 'account',
        message: `Account with ID ${id} not found`,
      });
    }

    return reply.status(204).send();
  });
}
