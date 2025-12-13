import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { query, queryOne, run, uuid } from '../db/pool.js';
import { z } from 'zod';
import path from 'path';
import fs from 'fs/promises';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

async function ensureUploadDir() {
  try {
    await fs.access(UPLOAD_DIR);
  } catch {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  }
}

const CreateAttachmentSchema = z.object({
  orderId: z.string().uuid(),
  filename: z.string().min(1).max(500),
  fileSize: z.number().int().positive(),
  uploadedBy: z.enum(['Никита', 'Саня', 'Ксюша']),
});

function mapAttachment(row: any) {
  return {
    id: row.id,
    filename: row.filename,
    fileSize: row.file_size,
    fileUrl: row.file_url,
    uploadedBy: row.uploaded_by,
    uploadedAt: row.uploaded_at,
  };
}

export async function attachmentRoutes(fastify: FastifyInstance) {
  await ensureUploadDir();

  fastify.get('/api/orders/:orderId/attachments', async (request: FastifyRequest<{ Params: { orderId: string } }>, reply: FastifyReply) => {
    const { orderId } = request.params;
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(orderId)) {
      return reply.status(400).send({
        error: 'validation',
        message: 'Invalid order ID format',
      });
    }

    const rows = query<any>(
      `SELECT * FROM attachments WHERE order_id = ? AND comment_id IS NULL ORDER BY uploaded_at DESC`,
      [orderId]
    );

    return rows.map(mapAttachment);
  });

  fastify.post('/api/orders/:orderId/attachments', async (request: FastifyRequest<{ Params: { orderId: string } }>, reply: FastifyReply) => {
    const { orderId } = request.params;
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(orderId)) {
      return reply.status(400).send({
        error: 'validation',
        message: 'Invalid order ID format',
      });
    }

    const orderCheck = queryOne<any>('SELECT id FROM orders WHERE id = ?', [orderId]);
    if (!orderCheck) {
      return reply.status(404).send({
        error: 'not_found',
        message: 'Order not found',
      });
    }

    const data = await request.file();
    if (!data) {
      return reply.status(400).send({
        error: 'validation',
        message: 'No file uploaded',
      });
    }

    // Get uploadedBy from form data field (headers can't contain non-ASCII)
    const uploadedBy = (data.fields?.uploadedBy as any)?.value || 'Никита';
    const fileId = uuid();
    const ext = path.extname(data.filename);
    const storedFilename = `${fileId}${ext}`;
    const filePath = path.join(UPLOAD_DIR, storedFilename);

    const buffer = await data.toBuffer();
    await fs.writeFile(filePath, buffer);

    const fileUrl = `/uploads/${storedFilename}`;
    const fileSize = buffer.length;
    const id = uuid();

    run(
      `INSERT INTO attachments (id, order_id, filename, file_size, file_url, uploaded_by) VALUES (?, ?, ?, ?, ?, ?)`,
      [id, orderId, data.filename, fileSize, fileUrl, uploadedBy]
    );

    const row = queryOne<any>('SELECT * FROM attachments WHERE id = ?', [id]);
    return reply.status(201).send(mapAttachment(row));
  });

  fastify.delete('/api/attachments/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return reply.status(400).send({
        error: 'validation',
        message: 'Invalid attachment ID format',
      });
    }

    const attachment = queryOne<any>('SELECT file_url FROM attachments WHERE id = ?', [id]);

    if (!attachment) {
      return reply.status(404).send({
        error: 'not_found',
        message: 'Attachment not found',
      });
    }

    run('DELETE FROM attachments WHERE id = ?', [id]);

    try {
      const filename = attachment.file_url.replace('/uploads/', '');
      await fs.unlink(path.join(UPLOAD_DIR, filename));
    } catch {
      // File might not exist, ignore error
    }

    return reply.status(204).send();
  });

  fastify.get('/uploads/:filename', async (request: FastifyRequest<{ Params: { filename: string } }>, reply: FastifyReply) => {
    const { filename } = request.params;
    const filePath = path.join(UPLOAD_DIR, filename);

    try {
      const file = await fs.readFile(filePath);
      return reply.send(file);
    } catch {
      return reply.status(404).send({
        error: 'not_found',
        message: 'File not found',
      });
    }
  });
}
