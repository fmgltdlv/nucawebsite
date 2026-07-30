-- Event thumbnail, flyer, and geocoded map coordinates

ALTER TABLE events ADD COLUMN thumbnail_r2_key TEXT;
ALTER TABLE events ADD COLUMN flyer_r2_key TEXT;
ALTER TABLE events ADD COLUMN latitude REAL;
ALTER TABLE events ADD COLUMN longitude REAL;
