import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as clientService from '../services/clientService.js';
import * as clientNotesService from '../services/clientNotesService.js';
import type { ParticipantName } from '../types.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Valid participant names for validation
const VALID_PARTICIPANTS: ParticipantName[] = ['Никита', 'Саня', 'Ксюша'];

export async function clientRoutes(fastify: FastifyInstance) {
  // GET /api/clients - List clients with metrics
  // Requirements: 1.1, 1.2, 1.3
  fastify.get('/api/clients', async (request: FastifyRequest, _reply: FastifyReply) => {
    const { search } = request.query as { search?: string };
    const clients = await clientService.getClients(search);
    return clients;
  });

  // GET /api/clients/:name - Client details (stats)
  // Requirements: 2.1
  fastify.get('/api/clients/:name', async (request: FastifyRequest<{ Params: { name: string } }>, reply: FastifyReply) => {
    const { name } = request.params;
    
    if (!name || name.trim() === '') {
      return reply.status(400).send({
        error: 'validation',
        message: 'Имя клиента обязательно',
      });
    }

    const decodedName = decodeURIComponent(name);
    const stats = await clientService.getClientStats(decodedName);

    if (!stats) {
      return reply.status(404).send({
        error: 'not_found',
        resource: 'client',
        message: 'Клиент не найден',
      });
    }

    return {
      clientName: decodedName,
      ...stats,
    };
  });

  // GET /api/clients/:name/orders - Client orders
  // Requirements: 2.3, 2.4
  fastify.get('/api/clients/:name/orders', async (request: FastifyRequest<{ Params: { name: string } }>, reply: FastifyReply) => {
    const { name } = request.params;
    
    if (!name || name.trim() === '') {
      return reply.status(400).send({
        error: 'validation',
        message: 'Имя клиента обязательно',
      });
    }

    const decodedName = decodeURIComponent(name);
    const orders = await clientService.getClientOrders(decodedName);
    return orders;
  });


  // GET /api/clients/:name/notes - Client notes
  // Requirements: 3.1
  fastify.get('/api/clients/:name/notes', async (request: FastifyRequest<{ Params: { name: string } }>, reply: FastifyReply) => {
    const { name } = request.params;
    
    if (!name || name.trim() === '') {
      return reply.status(400).send({
        error: 'validation',
        message: 'Имя клиента обязательно',
      });
    }

    const decodedName = decodeURIComponent(name);
    const notes = await clientNotesService.getClientNotes(decodedName);
    return notes;
  });

  // POST /api/clients/:name/notes - Create note
  // Requirements: 3.2
  fastify.post('/api/clients/:name/notes', async (request: FastifyRequest<{ Params: { name: string } }>, reply: FastifyReply) => {
    const { name } = request.params;
    const body = request.body as { content?: string; author?: string };
    
    if (!name || name.trim() === '') {
      return reply.status(400).send({
        error: 'validation',
        message: 'Имя клиента обязательно',
      });
    }

    // Validate content
    if (!body.content || typeof body.content !== 'string' || body.content.trim() === '') {
      return reply.status(400).send({
        error: 'validation',
        message: 'Содержимое заметки обязательно',
        fields: { content: 'Содержимое заметки обязательно' },
      });
    }

    // Validate author
    if (!body.author || !VALID_PARTICIPANTS.includes(body.author as ParticipantName)) {
      return reply.status(400).send({
        error: 'validation',
        message: 'Некорректный автор',
        fields: { author: 'Автор должен быть одним из: ' + VALID_PARTICIPANTS.join(', ') },
      });
    }

    const decodedName = decodeURIComponent(name);
    const note = await clientNotesService.createNote(
      decodedName,
      body.content.trim(),
      body.author as ParticipantName
    );

    return reply.status(201).send(note);
  });

  // PATCH /api/client-notes/:id - Update note
  // Requirements: 3.3
  fastify.patch('/api/client-notes/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    const body = request.body as { content?: string };

    if (!UUID_REGEX.test(id)) {
      return reply.status(400).send({
        error: 'validation',
        message: 'Некорректный формат ID заметки',
      });
    }

    // Validate content
    if (!body.content || typeof body.content !== 'string' || body.content.trim() === '') {
      return reply.status(400).send({
        error: 'validation',
        message: 'Содержимое заметки обязательно',
        fields: { content: 'Содержимое заметки обязательно' },
      });
    }

    const note = await clientNotesService.updateNote(id, body.content.trim());

    if (!note) {
      return reply.status(404).send({
        error: 'not_found',
        resource: 'note',
        message: 'Заметка не найдена',
      });
    }

    return note;
  });

  // DELETE /api/client-notes/:id - Delete note
  // Requirements: 3.4
  fastify.delete('/api/client-notes/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;

    if (!UUID_REGEX.test(id)) {
      return reply.status(400).send({
        error: 'validation',
        message: 'Некорректный формат ID заметки',
      });
    }

    const deleted = await clientNotesService.deleteNote(id);

    if (!deleted) {
      return reply.status(404).send({
        error: 'not_found',
        resource: 'note',
        message: 'Заметка не найдена',
      });
    }

    return reply.status(204).send();
  });
}
