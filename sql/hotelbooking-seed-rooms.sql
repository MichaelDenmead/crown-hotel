SELECT * FROM hotelbooking.booking;
SELECT * FROM hotelbooking.customer;
SELECT * FROM hotelbooking.rates;
SELECT * FROM hotelbooking.room;
SELECT * FROM hotelbooking.roombooking;


-- Set the schema context
SET search_path TO hotelbooking;

-- Drop all tables in dependency order
DROP TABLE IF EXISTS roombooking CASCADE;
DROP TABLE IF EXISTS booking CASCADE;
DROP TABLE IF EXISTS customer CASCADE;
DROP TABLE IF EXISTS room CASCADE;
DROP TABLE IF EXISTS rates CASCADE;

REVOKE ALL ON SCHEMA public FROM PUBLIC;
