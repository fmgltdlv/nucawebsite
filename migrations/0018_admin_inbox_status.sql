-- Newsletter subscriber read/ack status (existing rows treated as already seen)
ALTER TABLE newsletter_subscribers ADD COLUMN status TEXT NOT NULL DEFAULT 'new';
UPDATE newsletter_subscribers SET status = 'acknowledged';

CREATE INDEX IF NOT EXISTS idx_newsletter_status ON newsletter_subscribers (status, subscribed_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications (status, submitted_at DESC);
