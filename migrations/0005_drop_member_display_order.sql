-- Members are listed alphabetically; manual display order is unused.

DROP INDEX IF EXISTS idx_members_active;
CREATE INDEX IF NOT EXISTS idx_members_active ON members (active);
ALTER TABLE members DROP COLUMN display_order;
