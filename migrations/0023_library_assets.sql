CREATE TABLE IF NOT EXISTS library_assets (
  id TEXT PRIMARY KEY,
  r2_key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  content_kind TEXT NOT NULL CHECK (content_kind IN ('image', 'pdf')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_library_assets_kind ON library_assets (content_kind, created_at DESC);
