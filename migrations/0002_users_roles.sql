-- Users with roles; migrate legacy admin_users

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'chair', 'member')),
  member_id TEXT REFERENCES members(id),
  display_name TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS chair_committee_assignments (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  committee_key TEXT NOT NULL,
  PRIMARY KEY (user_id, committee_key)
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);
CREATE INDEX IF NOT EXISTS idx_users_member ON users (member_id);

INSERT INTO users (id, email, password_hash, password_salt, role, created_at)
SELECT id, email, password_hash, password_salt, 'admin', created_at
FROM admin_users
WHERE NOT EXISTS (SELECT 1 FROM users LIMIT 1);

DROP TABLE IF EXISTS admin_users;
