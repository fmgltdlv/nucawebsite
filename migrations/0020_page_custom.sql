-- Custom CMS pages (created in admin, served at /{slug})

ALTER TABLE pages ADD COLUMN is_custom INTEGER NOT NULL DEFAULT 0;
