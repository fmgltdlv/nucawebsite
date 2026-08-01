-- Membership types (editable labels for Join page, application form, members admin).
-- Also relax members.member_type CHECK so keys can grow beyond the original three.

CREATE TABLE IF NOT EXISTS membership_types (
  key TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  published INTEGER NOT NULL DEFAULT 1
);

INSERT OR IGNORE INTO membership_types (key, name, description, sort_order, published) VALUES
  ('contractor', 'Contractor Member', 'Firms engaged in excavation, site work, and construction or rehabilitation of utility systems—including water, sewer, gas, electric, and communications infrastructure.', 0, 1),
  ('associate', 'Associate Member', 'Suppliers of equipment, materials, or services to contractors in the excavation and utility construction industry.', 1, 1),
  ('institutional', 'Institutional Member', 'Schools and governmental entities involved in utility construction and excavation.', 2, 1);

-- Recreate members without rigid member_type CHECK (SQLite cannot DROP CHECK).
CREATE TABLE members_new (
  id TEXT PRIMARY KEY,
  company_name TEXT NOT NULL,
  member_type TEXT NOT NULL,
  website TEXT,
  phone TEXT,
  email TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  logo_r2_key TEXT,
  description TEXT,
  points_of_contact_json TEXT
);

INSERT INTO members_new (
  id, company_name, member_type, website, phone, email, active,
  created_at, updated_at, logo_r2_key, description, points_of_contact_json
)
SELECT
  id, company_name, member_type, website, phone, email, active,
  created_at, updated_at, logo_r2_key, description, points_of_contact_json
FROM members;

DROP TABLE members;
ALTER TABLE members_new RENAME TO members;

CREATE INDEX IF NOT EXISTS idx_members_active ON members (active);
