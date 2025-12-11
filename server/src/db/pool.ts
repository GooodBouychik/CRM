import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/crm.db');

// Ensure data directory exists
import fs from 'fs';
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Helper to generate UUID
export function uuid(): string {
  return randomUUID();
}

export function query<T>(sql: string, params: unknown[] = []): T[] {
  const stmt = db.prepare(sql);
  return stmt.all(...params) as T[];
}

export function queryOne<T>(sql: string, params: unknown[] = []): T | null {
  const stmt = db.prepare(sql);
  return (stmt.get(...params) as T) || null;
}

export function run(sql: string, params: unknown[] = []): Database.RunResult {
  const stmt = db.prepare(sql);
  return stmt.run(...params);
}

export function transaction<T>(callback: () => T): T {
  const tx = db.transaction(callback);
  return tx();
}

// For compatibility with existing code that uses pool.query
export const pool = {
  query: <T>(sql: string, params: unknown[] = []): { rows: T[]; rowCount: number } => {
    const stmt = db.prepare(sql);
    if (sql.trim().toUpperCase().startsWith('SELECT') || sql.includes('RETURNING')) {
      const rows = stmt.all(...params) as T[];
      return { rows, rowCount: rows.length };
    } else {
      const result = stmt.run(...params);
      return { rows: [] as T[], rowCount: result.changes };
    }
  },
  end: async () => {
    db.close();
  }
};
