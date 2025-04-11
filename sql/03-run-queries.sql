

SELECT * FROM hotelbooking.staff;
SELECT * FROM hotelbooking.room;
SELECT * FROM hotelbooking.booking ORDER BY b_ref DESC;

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
