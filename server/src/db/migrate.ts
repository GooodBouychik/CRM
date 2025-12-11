import { db, run } from './pool.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function migrate() {
  console.log('Running migrations...');
  
  const migrationsDir = path.join(__dirname, 'migrations');
  
  // Create migrations table if not exists
  run(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      executed_at TEXT DEFAULT (datetime('now'))
    )
  `);
  
  // Get executed migrations
  const executed = new Set(
    db.prepare('SELECT name FROM migrations').all()
      .map((r: any) => r.name)
  );
  
  // Read and execute pending migrations
  if (!fs.existsSync(migrationsDir)) {
    fs.mkdirSync(migrationsDir, { recursive: true });
    console.log('Created migrations directory');
    return;
  }
  
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();
  
  for (const file of files) {
    if (!executed.has(file)) {
      console.log(`Executing migration: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
      db.exec(sql);
      run('INSERT INTO migrations (name) VALUES (?)', [file]);
      console.log(`Completed: ${file}`);
    }
  }
  
  console.log('Migrations complete');
  db.close();
}

migrate().catch(console.error);
