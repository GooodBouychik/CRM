import { query, queryOne, run, uuid } from '../db/pool.js';
import type { 
  Comment, 
  CreateCommentInput, 
  UpdateCommentInput, 
  ToggleReactionInput,
  CommentFilterInput,
  Reactions
} from '../schemas/comment.schema.js';

export type { Comment, CreateCommentInput, UpdateCommentInput, ToggleReactionInput, CommentFilterInput };

function mapComment(row: any): Comment {
  return {
    id: row.id,
    orderId: row.order_id,
    subtaskId: null,
    author: row.author,
    content: row.content,
    isSystem: Boolean(row.is_system),
    parentId: row.parent_id,
    reactions: row.reactions ? JSON.parse(row.reactions) : {},
    attachments: [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    editedAt: row.edited_at,
  };
}

export async function createComment(orderId: string, input: CreateCommentInput): Promise<Comment> {
  const id = uuid();
  run(
    `INSERT INTO comments (id, order_id, author, content, is_system, parent_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, orderId, input.author, input.content, input.isSystem ? 1 : 0, input.parentId ?? null]
  );
  return (await getCommentById(id))!;
}

export async function getCommentById(id: string): Promise<Comment | null> {
  const row = queryOne<any>(`SELECT * FROM comments WHERE id = ?`, [id]);
  return row ? mapComment(row) : null;
}

export async function getCommentsByOrderId(orderId: string, filter: CommentFilterInput = {}): Promise<Comment[]> {
  const conditions: string[] = ['order_id = ?'];
  const params: unknown[] = [orderId];

  if (filter.parentId !== undefined) {
    if (filter.parentId === null) {
      conditions.push('parent_id IS NULL');
    } else {
      conditions.push(`parent_id = ?`);
      params.push(filter.parentId);
    }
  }
  if (filter.author) {
    conditions.push(`author = ?`);
    params.push(filter.author);
  }
  if (filter.isSystem !== undefined) {
    conditions.push(`is_system = ?`);
    params.push(filter.isSystem ? 1 : 0);
  }

  const whereClause = conditions.join(' AND ');
  params.push(filter.limit ?? 50, filter.offset ?? 0);
  
  const rows = query<any>(
    `SELECT * FROM comments WHERE ${whereClause} ORDER BY created_at ASC LIMIT ? OFFSET ?`,
    params
  );
  return rows.map(mapComment);
}

export async function getRepliesByParentId(parentId: string): Promise<Comment[]> {
  const rows = query<any>(
    `SELECT * FROM comments WHERE parent_id = ? ORDER BY created_at ASC`,
    [parentId]
  );
  return rows.map(mapComment);
}

export async function updateComment(id: string, input: UpdateCommentInput): Promise<Comment | null> {
  run(
    `UPDATE comments SET content = ?, updated_at = datetime('now'), edited_at = datetime('now') WHERE id = ?`,
    [input.content, id]
  );
  return getCommentById(id);
}

export async function deleteComment(id: string): Promise<boolean> {
  const result = run('DELETE FROM comments WHERE id = ?', [id]);
  return result.changes > 0;
}

export async function toggleReaction(id: string, input: ToggleReactionInput): Promise<Comment | null> {
  const comment = await getCommentById(id);
  if (!comment) return null;

  const reactions: Reactions = comment.reactions || {};
  const { emoji, participant } = input;

  if (!reactions[emoji]) {
    reactions[emoji] = [];
  }

  const participantIndex = reactions[emoji].indexOf(participant);
  if (participantIndex === -1) {
    reactions[emoji].push(participant);
  } else {
    reactions[emoji].splice(participantIndex, 1);
    if (reactions[emoji].length === 0) {
      delete reactions[emoji];
    }
  }

  run(
    `UPDATE comments SET reactions = ?, updated_at = datetime('now') WHERE id = ?`,
    [JSON.stringify(reactions), id]
  );
  
  return getCommentById(id);
}

export async function orderExists(orderId: string): Promise<boolean> {
  const result = queryOne<{ cnt: number }>('SELECT COUNT(*) as cnt FROM orders WHERE id = ?', [orderId]);
  return (result?.cnt ?? 0) > 0;
}

export async function commentExists(commentId: string): Promise<boolean> {
  const result = queryOne<{ cnt: number }>('SELECT COUNT(*) as cnt FROM comments WHERE id = ?', [commentId]);
  return (result?.cnt ?? 0) > 0;
}

export async function getCommentCount(orderId: string): Promise<number> {
  const result = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM comments WHERE order_id = ?', [orderId]);
  return result?.count ?? 0;
}
