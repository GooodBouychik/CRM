-- Dashboard tasks table (Trello-style task board)
CREATE TABLE IF NOT EXISTS dashboard_tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo',
  position INTEGER NOT NULL DEFAULT 0,
  assigned_to TEXT,
  due_date TEXT,
  order_id TEXT REFERENCES orders(id) ON DELETE SET NULL,
  created_by TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Account categories table
CREATE TABLE IF NOT EXISTS account_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '📁',
  color TEXT DEFAULT '#6366f1',
  created_at TEXT DEFAULT (datetime('now'))
);

-- Service accounts table (Account Vault)
CREATE TABLE IF NOT EXISTS service_accounts (
  id TEXT PRIMARY KEY,
  service_name TEXT NOT NULL,
  service_url TEXT,
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  notes TEXT,
  category_id TEXT REFERENCES account_categories(id) ON DELETE SET NULL,
  created_by TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Indexes for dashboard_tasks
CREATE INDEX IF NOT EXISTS idx_dashboard_tasks_status ON dashboard_tasks(status);
CREATE INDEX IF NOT EXISTS idx_dashboard_tasks_assigned ON dashboard_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_dashboard_tasks_position ON dashboard_tasks(status, position);

-- Indexes for service_accounts
CREATE INDEX IF NOT EXISTS idx_service_accounts_category ON service_accounts(category_id);
CREATE INDEX IF NOT EXISTS idx_service_accounts_service_name ON service_accounts(service_name);

-- Insert default account categories
INSERT OR IGNORE INTO account_categories (id, name, icon, color) VALUES
  ('cat-social', 'Social', '📱', '#3b82f6'),
  ('cat-hosting', 'Hosting', '🌐', '#10b981'),
  ('cat-tools', 'Tools', '🔧', '#f59e0b'),
  ('cat-other', 'Other', '📁', '#6366f1');
