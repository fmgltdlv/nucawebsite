-- Primary site navigation (header menu)

CREATE TABLE IF NOT EXISTS nav_items (
  id TEXT PRIMARY KEY,
  parent_id TEXT REFERENCES nav_items(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  href TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  published INTEGER NOT NULL DEFAULT 1,
  indent INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_nav_items_parent ON nav_items(parent_id, sort_order);
