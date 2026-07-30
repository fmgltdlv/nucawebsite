-- Recurring event series (weekly, monthly, yearly)

ALTER TABLE events ADD COLUMN repeat_rule TEXT;
ALTER TABLE events ADD COLUMN repeat_until TEXT;
