-- Member-company link requests: users pick a company; admins approve before member_id updates.

ALTER TABLE users ADD COLUMN pending_member_id TEXT REFERENCES members(id);
ALTER TABLE users ADD COLUMN member_link_status TEXT NOT NULL DEFAULT 'none'
  CHECK (member_link_status IN ('none', 'pending', 'approved', 'rejected'));

CREATE INDEX IF NOT EXISTS idx_users_member_link_pending
  ON users (member_link_status)
  WHERE member_link_status = 'pending';

-- Existing admin-assigned links are already live
UPDATE users
SET member_link_status = 'approved'
WHERE member_id IS NOT NULL AND member_link_status = 'none';
