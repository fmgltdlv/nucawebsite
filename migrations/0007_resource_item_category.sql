-- Group resource links by section (e.g. Local Utilities, National Links)

ALTER TABLE resource_items ADD COLUMN category TEXT NOT NULL DEFAULT '';
