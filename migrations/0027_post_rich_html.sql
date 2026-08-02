-- Rich HTML body + optional cover image for THE DIRT web posts.
ALTER TABLE posts ADD COLUMN body_html TEXT;
ALTER TABLE posts ADD COLUMN cover_r2_key TEXT;
ALTER TABLE posts ADD COLUMN cover_alt TEXT;
