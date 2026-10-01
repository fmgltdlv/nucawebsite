-- Rate-limit public forms (contact, join, newsletter, RSVP) by IP.

CREATE TABLE IF NOT EXISTS form_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ip TEXT NOT NULL,
  action TEXT NOT NULL,
  attempted_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_form_attempts_ip_action_time
  ON form_attempts (ip, action, attempted_at);
