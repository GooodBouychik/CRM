-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  avatar_color TEXT NOT NULL DEFAULT '#3b82f6',
  telegram_id INTEGER,
  telegram_username TEXT,
  email TEXT,
  preferences TEXT DEFAULT '{}',
  last_seen TEXT DEFAULT (datetime('now')),
  created_at TEXT DEFAULT (datetime('now'))
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  order_number INTEGER UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  client_name TEXT,
  amount REAL,
  status TEXT NOT NULL DEFAULT 'new',
  priority TEXT NOT NULL DEFAULT 'medium',
  due_date TEXT,
  tags TEXT DEFAULT '[]',
  assigned_to TEXT DEFAULT '[]',
  is_favorite INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  updated_by TEXT
);

-- Auto-increment for order_number
CREATE TRIGGER IF NOT EXISTS orders_auto_number
AFTER INSERT ON orders
WHEN NEW.order_number IS NULL
BEGIN
  UPDATE orders SET order_number = (SELECT COALESCE(MAX(order_number), 0) + 1 FROM orders) WHERE id = NEW.id;
END;

-- Subtasks table
CREATE TABLE IF NOT EXISTS subtasks (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  subtask_number INTEGER,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'planning',
  assigned_to TEXT,
  estimated_hours REAL,
  position INTEGER NOT NULL DEFAULT 0,
  is_pinned INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Comments table (for orders)
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  content TEXT NOT NULL,
  is_system INTEGER DEFAULT 0,
  parent_id TEXT REFERENCES comments(id) ON DELETE CASCADE,
  reactions TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT,
  edited_at TEXT
);

-- Subtask comments table
CREATE TABLE IF NOT EXISTS subtask_comments (
  id TEXT PRIMARY KEY,
  subtask_id TEXT NOT NULL REFERENCES subtasks(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  content TEXT NOT NULL,
  is_system INTEGER DEFAULT 0,
  parent_id TEXT REFERENCES subtask_comments(id) ON DELETE CASCADE,
  reactions TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT,
  edited_at TEXT
);
