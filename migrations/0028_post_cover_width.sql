-- Display width for THE DIRT post cover photos (percent of content column).
ALTER TABLE posts ADD COLUMN cover_width_pct INTEGER NOT NULL DEFAULT 100;
