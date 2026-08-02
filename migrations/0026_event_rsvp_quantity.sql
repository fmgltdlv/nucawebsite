-- Allow one RSVP to reserve multiple spots
ALTER TABLE event_rsvps ADD COLUMN quantity INTEGER NOT NULL DEFAULT 1;
