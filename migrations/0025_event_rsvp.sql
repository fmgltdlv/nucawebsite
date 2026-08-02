-- In-app RSVP forms and optional registration capacity for events

ALTER TABLE events ADD COLUMN rsvp_enabled INTEGER NOT NULL DEFAULT 0;
ALTER TABLE events ADD COLUMN registration_limit INTEGER;

CREATE TABLE IF NOT EXISTS event_rsvps (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  occurrence_starts_at TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_event_rsvps_event ON event_rsvps (event_id, occurrence_starts_at);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_created ON event_rsvps (created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_event_rsvps_email_occurrence
  ON event_rsvps (event_id, occurrence_starts_at, email);
