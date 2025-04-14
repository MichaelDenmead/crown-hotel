

SELECT * FROM hotelbooking.staff;
SELECT * FROM hotelbooking.room;
SELECT * FROM hotelbooking.booking ORDER BY b_ref DESC;
SELECT * FROM hotelbooking.customer;
SELECT * FROM hotelbooking.rates;
SELECT * FROM hotelbooking.roombooking;

SELECT 
  b.*, 
  c.c_name, 
  c.c_email
FROM 
  hotelbooking.booking b
JOIN 
  hotelbooking.customer c ON b.c_no = c.c_no
ORDER BY 
  b.b_ref DESC;


ALTER TABLE hotelbooking.staff
ADD COLUMN role TEXT CHECK (role IN ('receptionist', 'housekeeper')) NOT NULL DEFAULT 'receptionist';

UPDATE hotelbooking.staff
SET role = 'housekeeper'
WHERE username = 'tester';

SELECT username, role FROM hotelbooking.staff;

-- RECEPTION DASHBOARD VIEW
SELECT 
  b.b_ref AS "Booking Ref",
  c.c_name AS "Guest",
  c.c_email AS "Email",
  r.r_no AS "Room Number",
  r.r_class AS "Room Type",
  TO_CHAR(rb.checkin, 'YYYY-MM-DD') AS "Check-In",
  TO_CHAR(rb.checkout, 'YYYY-MM-DD') AS "Check-Out",
  rb.checkout - rb.checkin AS "Nights",
  rb.guests AS "Guests"
FROM hotelbooking.booking b
JOIN hotelbooking.customer c ON b.c_no = c.c_no
JOIN hotelbooking.roombooking rb ON b.b_ref = rb.b_ref
JOIN hotelbooking.room r ON rb.r_no = r.r_no
ORDER BY rb.checkin ASC;

-- LIST ALL BOOKINGS LIVE OR IN THE FUTURE
SELECT 
    b.b_ref AS "Booking Ref",
    c.c_name AS "Guest",
    r.r_no AS "Room Number",
    CASE
        WHEN r.r_class = 'std_d' THEN 'Standard Double'
        WHEN r.r_class = 'std_t' THEN 'Standard Twin'
        WHEN r.r_class = 'sup_d' THEN 'Superior Double'
        WHEN r.r_class = 'sup_t' THEN 'Superior Twin'
        ELSE 'Unknown'  -- In case of an unexpected value
    END AS "Room Type",
    rb.checkin AS "Check-in",
    rb.checkout AS "Check-out",
    rb.checkout - rb.checkin AS "Nights",
    rb.guests AS "Guests",
    '£' || TO_CHAR(b.b_cost, '999,999.99') AS "Booking Cost",
    '£' || TO_CHAR(b.b_outstanding, '999,999.99') AS "Outstanding Amount"
FROM hotelbooking.booking b
JOIN hotelbooking.customer c ON b.c_no = c.c_no
JOIN hotelbooking.roombooking rb ON b.b_ref = rb.b_ref
JOIN hotelbooking.room r ON rb.r_no = r.r_no
WHERE rb.checkin >= CURRENT_DATE  -- Future bookings
   OR (rb.checkin <= CURRENT_DATE AND rb.checkout >= CURRENT_DATE)  -- Live bookings
ORDER BY rb.checkin;

-- LIST ALL CHECK-OUTS DUE TODAY AND PLACE THESE IN A SPECIFIC STATUS ORDER
SELECT 
    -- b.b_ref AS "Booking Ref", -- NOT REQUIRED
    -- c.c_name AS "Guest", -- NOT REQUIRED
    r.r_no AS "Room Number",
    CASE
        WHEN r.r_class = 'std_d' THEN 'Standard Double'
        WHEN r.r_class = 'std_t' THEN 'Standard Twin'
        WHEN r.r_class = 'sup_d' THEN 'Superior Double'
        WHEN r.r_class = 'sup_t' THEN 'Superior Twin'
        ELSE 'Unknown'  -- In case of an unexpected value
    END AS "Room Type",
    -- rb.checkin AS "Check-in", -- NOT REQUIRED
    rb.checkout AS "Check-out",
    -- rb.guests AS "Guests", -- NOT REQUIRED
    r.r_status AS "Room Status",
    CASE 
        WHEN r.r_status = 'C' THEN 'Checked-out and ready to clean'
        WHEN r.r_status = 'X' THEN 'Cleaning in progress'
        WHEN r.r_status = 'O' THEN 'Occupied'
        WHEN r.r_status = 'A' THEN 'Ready for next guest'
        ELSE 'Unknown Status'
    END AS "Room Status Description"
FROM hotelbooking.booking b
JOIN hotelbooking.customer c ON b.c_no = c.c_no
JOIN hotelbooking.roombooking rb ON b.b_ref = rb.b_ref
JOIN hotelbooking.room r ON rb.r_no = r.r_no
WHERE rb.checkout = CURRENT_DATE
ORDER BY
    CASE 
        WHEN r.r_status = 'C' THEN 1
        WHEN r.r_status = 'X' THEN 2
        WHEN r.r_status = 'O' THEN 3
        WHEN r.r_status = 'A' THEN 4
        ELSE 5
    END,
    r.r_no ASC;

-- UPDATE ROOM TO CLEANING IN PROGRESS
UPDATE hotelbooking.room
SET r_status = 'X'  -- Cleaning in progress
WHERE r_status = 'C'  -- Only rooms that are currently checked-out
AND r_no IN ();  -- (Add room numbers as required)

-- UPDATE ROOM TO CLEANING FINISHED AND AVAILABLE FOR NEW GUEST
UPDATE hotelbooking.room
SET r_status = 'A'  -- Ready for next guest
WHERE r_status = 'X'  -- Only rooms that are currently being cleaned
AND r_no IN ();  -- (Add room numbers as required)

-- UPDATE ROOM TO CHECKED-OUT
UPDATE hotelbooking.room
SET r_status = 'C'  -- Checked-out and ready for cleaning
WHERE r_status = 'O'  -- Only rooms that are currently occupied
AND r_no IN ();  -- (Add room numbers as required)

-- UPDATE ROOM TO OCCUPIED CHECKED-IN
UPDATE hotelbooking.room
SET r_status = 'O'  -- Checked-in and occupied
WHERE r_status = 'A'  -- Only rooms that are ready for next guest
AND r_no IN ();  -- (Add room numbers as required)

--KK TEMP ADD REMOVE WHEN FINISHED
SELECT b.b_ref, c.c_name, c.c_email, r.r_no, r.r_class,
                   TO_CHAR(rb.checkin, 'YYYY-MM-DD') AS check_in,
                   TO_CHAR(rb.checkout, 'YYYY-MM-DD') AS check_out,
                   rb.checkout - rb.checkin AS nights, rb.guests,
                   b.b_cost, b.b_outstanding
            FROM hotelbooking.booking b
            JOIN hotelbooking.customer c ON b.c_no = c.c_no
            JOIN hotelbooking.roombooking rb ON b.b_ref = rb.b_ref
            JOIN hotelbooking.room r ON rb.r_no = r.r_no
            ORDER BY rb.checkin DESC

-- BOOKING CALENDAR - CHECK FOR FULLY BOOKED DATES
WITH booked_dates AS ( --
    SELECT generate_series(checkin, checkout - INTERVAL '1 day', INTERVAL '1 day') AS day
    FROM hotelbooking.roombooking
),
room_counts AS (
    SELECT day::date, COUNT(*) AS booked_rooms
    FROM booked_dates
    GROUP BY day
)
SELECT day
FROM room_counts
WHERE booked_rooms >= 32
ORDER BY day;