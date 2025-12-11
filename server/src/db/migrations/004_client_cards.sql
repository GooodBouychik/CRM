-- Client notes table
CREATE TABLE IF NOT EXISTS client_notes (
  id TEXT PRIMARY KEY,
  client_name TEXT NOT NULL,
  content TEXT NOT NULL,
  author TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT
);

-- Index for client notes lookup by client name
CREATE INDEX IF NOT EXISTS idx_client_notes_client ON client_notes(client_name);

-- Custom field definitions table
CREATE TABLE IF NOT EXISTS custom_fields (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('text', 'select', 'date', 'number')),
  options TEXT, -- JSON array for select type
  is_required INTEGER DEFAULT 0,
  position INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Custom field values table
CREATE TABLE IF NOT EXISTS custom_field_values (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  field_id TEXT NOT NULL REFERENCES custom_fields(id) ON DELETE CASCADE,
  value TEXT NOT NULL,
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(order_id, field_id)
);

-- Index for custom field values lookup by order
CREATE INDEX IF NOT EXISTS idx_custom_field_values_order ON custom_field_values(order_id);

-- Index for custom field values lookup by field
CREATE INDEX IF NOT EXISTS idx_custom_field_values_field ON custom_field_values(field_id);
