-- Add due_date column to subtasks table for calendar functionality
ALTER TABLE subtasks ADD COLUMN due_date TEXT;

-- Index for calendar queries by due date
CREATE INDEX IF NOT EXISTS idx_subtasks_due_date ON subtasks(due_date);
