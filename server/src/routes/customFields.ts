import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as customFieldService from '../services/customFieldService.js';
import type { CustomFieldType, CreateFieldInput, UpdateFieldInput } from '../services/customFieldService.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Valid custom field types
const VALID_FIELD_TYPES: CustomFieldType[] = ['text', 'select', 'date', 'number'];

export async function customFieldRoutes(fastify: FastifyInstance) {
  // GET /api/custom-fields - List field definitions
  // Requirements: 9.1
  fastify.get('/api/custom-fields', async (_request: FastifyRequest, _reply: FastifyReply) => {
    const fields = customFieldService.getFieldDefinitions();
    return fields;
  });

  // POST /api/custom-fields - Create field
  // Requirements: 9.2
  fastify.post('/api/custom-fields', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as {
      name?: string;
      type?: string;
      options?: string[];
      isRequired?: boolean;
    };

    // Validate name
    if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
      return reply.status(400).send({
        error: 'validation',
        message: 'Название поля обязательно',
        fields: { name: 'Название поля обязательно' },
      });
    }

    // Validate type
    if (!body.type || !VALID_FIELD_TYPES.includes(body.type as CustomFieldType)) {
      return reply.status(400).send({
        error: 'validation',
        message: 'Некорректный тип поля',
        fields: { type: 'Тип должен быть одним из: ' + VALID_FIELD_TYPES.join(', ') },
      });
    }

    // Validate options for select type
    if (body.type === 'select') {
      if (!body.options || !Array.isArray(body.options) || body.options.length === 0) {
        return reply.status(400).send({
          error: 'validation',
          message: 'Для типа select необходимо указать варианты',
          fields: { options: 'Варианты обязательны для типа select' },
        });
      }
    }

    // Check for duplicate name
    const existingFields = customFieldService.getFieldDefinitions();
    const duplicateName = existingFields.find(
      f => f.name.toLowerCase() === body.name!.trim().toLowerCase()
    );
    if (duplicateName) {
      return reply.status(409).send({
        error: 'conflict',
        message: 'Поле с таким именем уже существует',
      });
    }

    const input: CreateFieldInput = {
      name: body.name.trim(),
      type: body.type as CustomFieldType,
      options: body.options,
      isRequired: body.isRequired,
    };

    const field = customFieldService.createFieldDefinition(input);
    return reply.status(201).send(field);
  });

  // PATCH /api/custom-fields/:id - Update field
  // Requirements: 9.2
  fastify.patch('/api/custom-fields/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    const body = request.body as {
      name?: string;
      type?: string;
      options?: string[] | null;
      isRequired?: boolean;
      position?: number;
    };

    if (!UUID_REGEX.test(id)) {
      return reply.status(400).send({
        error: 'validation',
        message: 'Некорректный формат ID поля',
      });
    }

    // Validate type if provided
    if (body.type !== undefined && !VALID_FIELD_TYPES.includes(body.type as CustomFieldType)) {
      return reply.status(400).send({
        error: 'validation',
        message: 'Некорректный тип поля',
        fields: { type: 'Тип должен быть одним из: ' + VALID_FIELD_TYPES.join(', ') },
      });
    }

    // Validate name if provided
    if (body.name !== undefined && (typeof body.name !== 'string' || body.name.trim() === '')) {
      return reply.status(400).send({
        error: 'validation',
        message: 'Название поля не может быть пустым',
        fields: { name: 'Название поля не может быть пустым' },
      });
    }

    // Check for duplicate name if name is being updated
    if (body.name !== undefined) {
      const existingFields = customFieldService.getFieldDefinitions();
      const duplicateName = existingFields.find(
        f => f.id !== id && f.name.toLowerCase() === body.name!.trim().toLowerCase()
      );
      if (duplicateName) {
        return reply.status(409).send({
          error: 'conflict',
          message: 'Поле с таким именем уже существует',
        });
      }
    }

    const updates: UpdateFieldInput = {};
    if (body.name !== undefined) updates.name = body.name.trim();
    if (body.type !== undefined) updates.type = body.type as CustomFieldType;
    if (body.options !== undefined) updates.options = body.options;
    if (body.isRequired !== undefined) updates.isRequired = body.isRequired;
    if (body.position !== undefined) updates.position = body.position;

    const field = customFieldService.updateFieldDefinition(id, updates);

    if (!field) {
      return reply.status(404).send({
        error: 'not_found',
        resource: 'custom_field',
        message: 'Поле не найдено',
      });
    }

    return field;
  });

  // DELETE /api/custom-fields/:id - Delete field
  // Requirements: 9.6
  fastify.delete('/api/custom-fields/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;

    if (!UUID_REGEX.test(id)) {
      return reply.status(400).send({
        error: 'validation',
        message: 'Некорректный формат ID поля',
      });
    }

    const deleted = customFieldService.deleteFieldDefinition(id);

    if (!deleted) {
      return reply.status(404).send({
        error: 'not_found',
        resource: 'custom_field',
        message: 'Поле не найдено',
      });
    }

    return reply.status(204).send();
  });

  // GET /api/orders/:id/custom-fields - Order field values
  // Requirements: 9.3
  fastify.get('/api/orders/:id/custom-fields', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;

    if (!UUID_REGEX.test(id)) {
      return reply.status(400).send({
        error: 'validation',
        message: 'Некорректный формат ID заказа',
      });
    }

    // Get field values with their definitions for complete information
    const fieldsWithValues = customFieldService.getFieldValuesWithDefinitions(id);
    return fieldsWithValues;
  });

  // PUT /api/orders/:id/custom-fields/:fieldId - Set value
  // Requirements: 9.4
  fastify.put('/api/orders/:id/custom-fields/:fieldId', async (
    request: FastifyRequest<{ Params: { id: string; fieldId: string } }>,
    reply: FastifyReply
  ) => {
    const { id, fieldId } = request.params;
    const body = request.body as { value?: string };

    if (!UUID_REGEX.test(id)) {
      return reply.status(400).send({
        error: 'validation',
        message: 'Некорректный формат ID заказа',
      });
    }

    if (!UUID_REGEX.test(fieldId)) {
      return reply.status(400).send({
        error: 'validation',
        message: 'Некорректный формат ID поля',
      });
    }

    // Check if field definition exists
    const fieldDef = customFieldService.getFieldDefinitionById(fieldId);
    if (!fieldDef) {
      return reply.status(404).send({
        error: 'not_found',
        resource: 'custom_field',
        message: 'Поле не найдено',
      });
    }

    // Validate value
    if (body.value === undefined || body.value === null) {
      return reply.status(400).send({
        error: 'validation',
        message: 'Значение поля обязательно',
        fields: { value: 'Значение поля обязательно' },
      });
    }

    // Validate required field
    if (fieldDef.isRequired && (typeof body.value !== 'string' || body.value.trim() === '')) {
      return reply.status(400).send({
        error: 'validation',
        message: 'Это поле обязательно для заполнения',
        fields: { value: 'Это поле обязательно для заполнения' },
      });
    }

    // Validate select type value
    if (fieldDef.type === 'select' && fieldDef.options) {
      if (body.value && !fieldDef.options.includes(body.value)) {
        return reply.status(400).send({
          error: 'validation',
          message: 'Недопустимое значение для поля',
          fields: { value: 'Значение должно быть одним из: ' + fieldDef.options.join(', ') },
        });
      }
    }

    const value = customFieldService.setFieldValue(id, fieldId, String(body.value));
    return value;
  });
}
