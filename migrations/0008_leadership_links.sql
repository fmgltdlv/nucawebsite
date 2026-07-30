-- Company, committee chair title, and external links for leadership roster

ALTER TABLE leadership ADD COLUMN chair_title TEXT;
ALTER TABLE leadership ADD COLUMN company TEXT;
ALTER TABLE leadership ADD COLUMN website TEXT;
ALTER TABLE leadership ADD COLUMN linkedin_url TEXT;
