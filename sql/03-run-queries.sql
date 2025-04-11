

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