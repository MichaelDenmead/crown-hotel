-- CREATE A TEST CUSTOMER
DO $$
DECLARE
    start_date CONSTANT DATE := '2025-04-10';  -- Set check-in date here
    end_date CONSTANT DATE := '2025-04-13';    -- Set check-out date here
BEGIN

-- 1. Insert Test Customers
INSERT INTO hotelbooking.customer (c_no, c_name, c_email, c_address, c_cardtype, c_cardexp, c_cardno)
VALUES
(8001, 'Test Customer 1', 'test1@example.com', '123 Test Lane', 'V', '12/25', '1111222233334444'),
(8002, 'Test Customer 2', 'test2@example.com', '123 Test Lane', 'V', '12/25', '1111222233334445'),
(8003, 'Test Customer 3', 'test3@example.com', '123 Test Lane', 'V', '12/25', '1111222233334446'),
(8004, 'Test Customer 4', 'test4@example.com', '123 Test Lane', 'V', '12/25', '1111222233334447'),
(8005, 'Test Customer 5', 'test5@example.com', '123 Test Lane', 'V', '12/25', '1111222233334448'),
(8006, 'Test Customer 6', 'test6@example.com', '123 Test Lane', 'V', '12/25', '1111222233334449'),
(8007, 'Test Customer 7', 'test7@example.com', '123 Test Lane', 'V', '12/25', '1111222233334450'),
(8008, 'Test Customer 8', 'test8@example.com', '123 Test Lane', 'V', '12/25', '1111222233334451'),
(8009, 'Test Customer 9', 'test9@example.com', '123 Test Lane', 'V', '12/25', '1111222233334452'),
(8010, 'Test Customer 10', 'test10@example.com', '123 Test Lane', 'V', '12/25', '1111222233334453'),
(8011, 'Test Customer 11', 'test11@example.com', '123 Test Lane', 'V', '12/25', '1111222233334454'),
(8012, 'Test Customer 12', 'test12@example.com', '123 Test Lane', 'V', '12/25', '1111222233334455'),
(8013, 'Test Customer 13', 'test13@example.com', '123 Test Lane', 'V', '12/25', '1111222233334456'),
(8014, 'Test Customer 14', 'test14@example.com', '123 Test Lane', 'V', '12/25', '1111222233334457'),
(8015, 'Test Customer 15', 'test15@example.com', '123 Test Lane', 'V', '12/25', '1111222233334458'),
(8016, 'Test Customer 16', 'test16@example.com', '123 Test Lane', 'V', '12/25', '1111222233334459'),
(8017, 'Test Customer 17', 'test17@example.com', '123 Test Lane', 'V', '12/25', '1111222233334460'),
(8018, 'Test Customer 18', 'test18@example.com', '123 Test Lane', 'V', '12/25', '1111222233334461'),
(8019, 'Test Customer 19', 'test19@example.com', '123 Test Lane', 'V', '12/25', '1111222233334462'),
(8020, 'Test Customer 20', 'test20@example.com', '123 Test Lane', 'V', '12/25', '1111222233334463'),
(8021, 'Test Customer 21', 'test21@example.com', '123 Test Lane', 'V', '12/25', '1111222233334464'),
(8022, 'Test Customer 22', 'test22@example.com', '123 Test Lane', 'V', '12/25', '1111222233334465'),
(8023, 'Test Customer 23', 'test23@example.com', '123 Test Lane', 'V', '12/25', '1111222233334466'),
(8024, 'Test Customer 24', 'test24@example.com', '123 Test Lane', 'V', '12/25', '1111222233334467'),
(8025, 'Test Customer 25', 'test25@example.com', '123 Test Lane', 'V', '12/25', '1111222233334468'),
(8026, 'Test Customer 26', 'test26@example.com', '123 Test Lane', 'V', '12/25', '1111222233334469'),
(8027, 'Test Customer 27', 'test27@example.com', '123 Test Lane', 'V', '12/25', '1111222233334470'),
(8028, 'Test Customer 28', 'test28@example.com', '123 Test Lane', 'V', '12/25', '1111222233334471'),
(8029, 'Test Customer 29', 'test29@example.com', '123 Test Lane', 'V', '12/25', '1111222233334472'),
(8030, 'Test Customer 30', 'test30@example.com', '123 Test Lane', 'V', '12/25', '1111222233334473'),
(8031, 'Test Customer 31', 'test31@example.com', '123 Test Lane', 'V', '12/25', '1111222233334474'),
(8032, 'Test Customer 32', 'test32@example.com', '123 Test Lane', 'V', '12/25', '1111222233334475');

-- 2. Insert Bookings with Calculated Costs (3 nights)
-- Room class pricing: std_t=62, std_d=65, sup_t=75, sup_d=77
-- Booking refs 9001 to 9032 correspond to customers 8001 to 8032 and rooms 1 to 32
INSERT INTO hotelbooking.booking (b_ref, c_no, b_cost, b_outstanding, b_notes)
VALUES
(9001, 8001, 231.00, 0.00, 'TEST_DATA'),
(9002, 8002, 186.00, 0.00, 'TEST_DATA'),
(9003, 8003, 186.00, 0.00, 'TEST_DATA'),
(9004, 8004, 186.00, 0.00, 'TEST_DATA'),
(9005, 8005, 225.00, 0.00, 'TEST_DATA'),
(9006, 8006, 225.00, 0.00, 'TEST_DATA'),
(9007, 8007, 195.00, 0.00, 'TEST_DATA'),
(9008, 8008, 195.00, 0.00, 'TEST_DATA'),
(9009, 8009, 195.00, 0.00, 'TEST_DATA'),
(9010, 8010, 195.00, 0.00, 'TEST_DATA'),
(9011, 8011, 231.00, 0.00, 'TEST_DATA'),
(9012, 8012, 231.00, 0.00, 'TEST_DATA'),
(9013, 8013, 231.00, 0.00, 'TEST_DATA'),
(9014, 8014, 231.00, 0.00, 'TEST_DATA'),
(9015, 8015, 225.00, 0.00, 'TEST_DATA'),
(9016, 8016, 225.00, 0.00, 'TEST_DATA'),
(9017, 8017, 225.00, 0.00, 'TEST_DATA'),
(9018, 8018, 225.00, 0.00, 'TEST_DATA'),
(9019, 8019, 225.00, 0.00, 'TEST_DATA'),
(9020, 8020, 225.00, 0.00, 'TEST_DATA'),
(9021, 8021, 186.00, 0.00, 'TEST_DATA'),
(9022, 8022, 231.00, 0.00, 'TEST_DATA'),
(9023, 8023, 186.00, 0.0, 'TEST_DATA'),
(9024, 8024, 231.00, 0.00, 'TEST_DATA'),
(9025, 8025, 186.00, 0.00, 'TEST_DATA'),
(9026, 8026, 186.00, 0.00, 'TEST_DATA'),
(9027, 8027, 231.00, 0.00, 'TEST_DATA'),
(9028, 8028, 195.00, 0.00, 'TEST_DATA'),
(9029, 8029, 225.00, 0.00, 'TEST_DATA'),
(9030, 8030, 195.00, 0.00, 'TEST_DATA'),
(9031, 8031, 195.00, 0.00, 'TEST_DATA'),
(9032, 8032, 231.00, 0.00, 'TEST_DATA');

-- 3. Insert Room Bookings using existing r_no values from the room table
INSERT INTO hotelbooking.roombooking (r_no, b_ref, checkin, checkout)
VALUES
(203, 9001, start_date, end_date),
(205, 9002, start_date, end_date),
(206, 9003, start_date, end_date),
(207, 9004, start_date, end_date),
(209, 9005, start_date, end_date),
(210, 9006, start_date, end_date),
(211, 9007, start_date, end_date),
(212, 9008, start_date, end_date),
(301, 9009, start_date, end_date),
(302, 9010, start_date, end_date),
(303, 9011, start_date, end_date),
(304, 9012, start_date, end_date),
(305, 9013, start_date, end_date),
(306, 9014, start_date, end_date),
(307, 9015, start_date, end_date),
(308, 9016, start_date, end_date),
(309, 9017, start_date, end_date),
(310, 9018, start_date, end_date),
(311, 9019, start_date, end_date),
(312, 9020, start_date, end_date),
(106, 9021, start_date, end_date),
(101, 9022, start_date, end_date),
(107, 9023, start_date, end_date),
(102, 9024, start_date, end_date),
(108, 9025, start_date, end_date),
(204, 9026, start_date, end_date),
(201, 9027, start_date, end_date),
(104, 9028, start_date, end_date),
(208, 9029, start_date, end_date),
(105, 9030, start_date, end_date),
(103, 9031, start_date, end_date),
(202, 9032, start_date, end_date);

END $$;

-- TO UPDATE THE DATES ONCE IN THE DATABASE (CHANGE AS REQUIRED)
-- Update the check-in and check-out dates for all test bookings
UPDATE hotelbooking.roombooking
SET checkin = '2025-04-11',  -- New check-in date
    checkout = '2025-04-14'  -- New check-out date
WHERE b_ref IN ( 
    SELECT b_ref 
    FROM hotelbooking.booking 
    WHERE b_notes = 'TEST_DATA'
);

-- TO DELETE THE TEST DATA ABOVE RUN THE BELOW QUERIES
-- 1) Delete test room bookings
DELETE FROM hotelbooking.roombooking 
WHERE b_ref IN ( 
    SELECT b_ref 
    FROM hotelbooking.booking
    WHERE b_notes = 'TEST_DATA'
);

-- 2) Delete test bookings
DELETE FROM hotelbooking.booking 
WHERE b_notes = 'TEST_DATA';

-- 3) Delete test customers (assuming customer numbers fall within the given range)
DELETE FROM hotelbooking.customer 
WHERE c_no BETWEEN 8001 AND 8032;
