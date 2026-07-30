-- Structured page blocks (sections, headings, lists, callouts) alongside markdown fallback

ALTER TABLE pages ADD COLUMN body_json TEXT;
