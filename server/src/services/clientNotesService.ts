import { query, queryOne, run, uuid } from '../db/pool.js';
import type { ParticipantName } from '../types.js';

/**
 * Client Note interface
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */
export interface ClientNote {
  id: string;
  clientName: string;
  content: string;
  author: ParticipantName;
  createdAt: string;
  updatedAt: string | null;
}

/**
 * Get all notes for a specific client
 * Requirements: 3.1
 */
export async function getClientNotes(clientName: string): Promise<ClientNote[]> {
  const rows = query<{
    id: string;
    client_name: string;
    content: string;
    author: ParticipantName;
    created_at: string;
    updated_at: string | null;
  }>(`
    SELECT id, client_name, content, author, created_at, updated_at
    FROM client_notes
    WHERE client_name = ?
    ORDER BY created_at DESC
  `, [clientName]);

  return rows.map(row => ({
    id: row.id,
    clientName: row.client_name,
    content: row.content,
    author: row.author,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

/**
 * Create a new note for a client
 * Requirements: 3.2
 */
export async function createNote(
  clientName: string,
  content: string,
  author: ParticipantName
): Promise<ClientNote> {
  const id = uuid();
  const createdAt = new Date().toISOString();

  run(`
    INSERT INTO client_notes (id, client_name, content, author, created_at)
    VALUES (?, ?, ?, ?, ?)
  `, [id, clientName, content, author, createdAt]);

  return {
    id,
    clientName,
    content,
    author,
    createdAt,
    updatedAt: null,
  };
}


/**
 * Update an existing note's content
 * Requirements: 3.3
 */
export async function updateNote(
  id: string,
  content: string
): Promise<ClientNote | null> {
  const updatedAt = new Date().toISOString();

  const result = run(`
    UPDATE client_notes
    SET content = ?, updated_at = ?
    WHERE id = ?
  `, [content, updatedAt, id]);

  if (result.changes === 0) {
    return null;
  }

  // Fetch the updated note
  const row = queryOne<{
    id: string;
    client_name: string;
    content: string;
    author: ParticipantName;
    created_at: string;
    updated_at: string | null;
  }>(`
    SELECT id, client_name, content, author, created_at, updated_at
    FROM client_notes
    WHERE id = ?
  `, [id]);

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    clientName: row.client_name,
    content: row.content,
    author: row.author,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Delete a note by ID
 * Requirements: 3.4
 */
export async function deleteNote(id: string): Promise<boolean> {
  const result = run(`
    DELETE FROM client_notes
    WHERE id = ?
  `, [id]);

  return result.changes > 0;
}

/**
 * Get a single note by ID
 * Utility function for validation
 */
export async function getNoteById(id: string): Promise<ClientNote | null> {
  const row = queryOne<{
    id: string;
    client_name: string;
    content: string;
    author: ParticipantName;
    created_at: string;
    updated_at: string | null;
  }>(`
    SELECT id, client_name, content, author, created_at, updated_at
    FROM client_notes
    WHERE id = ?
  `, [id]);

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    clientName: row.client_name,
    content: row.content,
    author: row.author,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
