-- Create table: staff (to enable login functionality)
CREATE TABLE hotelbooking.staff (
    staff_id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT
);



SELECT * FROM hotelbooking.staff;
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



-- Create table: customer
CREATE TABLE hotelbooking.customer (
  c_no INTEGER UNIQUE NOT NULL,
  c_name VARCHAR(80) NOT NULL,
  c_email VARCHAR(60) NOT NULL,
  c_address VARCHAR(200) NOT NULL,
  c_cardtype VARCHAR(2),
  CHECK (c_cardtype IN ('V', 'MC', 'A')),
  c_cardexp VARCHAR(5),
  c_cardno VARCHAR(16),
  PRIMARY KEY (c_no)
);

-- Create table: room
CREATE TABLE hotelbooking.room (
  r_no INTEGER UNIQUE NOT NULL,
  r_class CHAR(5) NOT NULL,
  CHECK (r_class IN ('std_d', 'std_t', 'sup_d', 'sup_t')),
  r_status CHAR(1) DEFAULT 'A',
  CHECK (r_status IN ('O', 'C', 'A', 'X')),
  r_notes VARCHAR(300),
  PRIMARY KEY (r_no)
);

-- Create table: rates
CREATE TABLE hotelbooking.rates (
  r_class CHAR(5),
  price DECIMAL(6,2)
);

-- Create table: booking
CREATE TABLE hotelbooking.booking (
  b_ref INTEGER UNIQUE NOT NULL,
  c_no INTEGER REFERENCES hotelbooking.customer(c_no),
  b_cost DECIMAL(6,2),
  b_outstanding DECIMAL(6,2),
  b_notes VARCHAR(300),
  PRIMARY KEY (b_ref)
);

-- Create table: roombooking
CREATE TABLE hotelbooking.roombooking (
  r_no INTEGER REFERENCES hotelbooking.room(r_no),
  b_ref INTEGER REFERENCES hotelbooking.booking(b_ref),
  checkin DATE NOT NULL,
  checkout DATE NOT NULL,
  PRIMARY KEY (r_no, b_ref)
);
