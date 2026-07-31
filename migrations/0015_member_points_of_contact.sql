-- Manual points of contact for member directory listings (max 5 per member).

ALTER TABLE members ADD COLUMN points_of_contact_json TEXT;
