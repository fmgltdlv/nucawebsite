-- Admins only: promote existing chair/member accounts and drop role-assignment tables.

UPDATE users SET role = 'admin' WHERE role IN ('chair', 'member');

DROP TABLE IF EXISTS chair_committee_assignments;
