// server.js - Express Server with PostgreSQL Connection
require('dotenv').config(); // Load environment variables
const express = require('express');
const session = require('express-session');
const path = require('path');
const bcrypt = require('bcrypt');
const pool = require('./db'); // PostgreSQL database connection

const app = express();
const PORT = 3000; // Server port

// View Engine Setup for EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware to parse JSON requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET || 'supersecret', // store securely
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // set true only if using HTTPS
}));


// -------------------------------
// Serve Static Files (Public & Staff Areas)
// -------------------------------

// Public Assets (CSS, JS, Components)
app.use(express.static(path.join(__dirname, 'public')));
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));
app.use('/components', express.static(path.join(__dirname, 'public/components')));

// Staff Area (Static Files)
app.use('/staff', express.static(__dirname + '/staff'));
app.use('/staff/css', express.static(path.join(__dirname, 'staff/css')));

// -------------------------------
// Routes for Static Pages
// -------------------------------

// Public Pages
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/rooms', (req, res) => res.sendFile(path.join(__dirname, 'public', 'rooms.html')));
app.get('/facilities', (req, res) => res.sendFile(path.join(__dirname, 'public', 'facilities.html')));
app.get('/confirmation', (req, res) => res.sendFile(path.join(__dirname, 'public', 'confirmation.html')));
app.get('/contact', (req, res) => res.sendFile(path.join(__dirname, 'public', 'contact.html')));
app.get('/outAndAbout', (req, res) => res.sendFile(path.join(__dirname, 'public', 'outAndAbout.html')));
app.get('/restaurant', (req, res) => res.sendFile(path.join(__dirname, 'public', 'restaurant.html')));
app.get('/bar', (req, res) => res.sendFile(path.join(__dirname, 'public', 'bar.html')));
app.get('/conference', (req, res) => res.sendFile(path.join(__dirname, 'public', 'conference.html')));
app.get('/gym', (req, res) => res.sendFile(path.join(__dirname, 'public', 'gym.html')));

// Staff Pages
app.get('/staff/reception', requireLogin, requireRole('receptionist'), (req, res) => {
    res.render('staff/reception', {
        title: 'Reception Dashboard',
        staffUser: req.session.staffUser
      });   
});

app.get('/staff/housekeeping', requireLogin, requireRole('housekeeper'), (req, res) => {
    res.render('staff/housekeeping', {
        title: 'Housekeeping',
        staffUser: req.session.staffUser
      });      
});


// EJS Booking Page
app.get('/booking', async (req, res) => {
    try {
        const { rows } = await pool.query("SELECT DISTINCT r_class AS type FROM hotelbooking.room WHERE r_status = 'A'");
        res.render('booking', { roomTypes: rows });
    } catch (err) {
        console.error('Error fetching room types:', err);
        res.status(500).send('Internal Server Error');
    }
});

// -------------------------------
// API Routes - Booking Functionality
// -------------------------------

// Fetch Available Rooms (GET /api/rooms)
app.get('/api/rooms', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM hotelbooking.room WHERE r_status = 'A'");
        res.json(result.rows);
    } catch (err) {
        console.error('Database query error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Fetch All Bookings (GET /api/bookings)
app.get('/api/bookings', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        b.b_ref,
        c.c_name,
        c.c_email,
        r.r_no,
        r.r_class,
        TO_CHAR(rb.checkin, 'YYYY-MM-DD') AS check_in,
        TO_CHAR(rb.checkout, 'YYYY-MM-DD') AS check_out,
        rb.checkout - rb.checkin AS nights,
        rb.guests
      FROM hotelbooking.booking b
      JOIN hotelbooking.customer c ON b.c_no = c.c_no
      JOIN hotelbooking.roombooking rb ON b.b_ref = rb.b_ref
      JOIN hotelbooking.room r ON rb.r_no = r.r_no
      ORDER BY rb.checkin ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// Create a New Booking (POST /api/book)
app.post('/api/book', async (req, res) => {
    const { customerName, email, checkInDate, checkOutDate, roomType, guests, confirmDuplicate } = req.body;

    try {
        console.log("📥 Booking Request Received:", req.body);

        // STEP 1️⃣: Get or create the customer
        let customerResult = await pool.query(
            "SELECT c_no FROM hotelbooking.customer WHERE c_email = $1",
            [email]
        );

        let customerId;

        if (customerResult.rowCount > 0) {
            customerId = customerResult.rows[0].c_no;
            console.log("👤 Existing Customer ID:", customerId);
        } else {
            const newCustomer = await pool.query(
                `INSERT INTO hotelbooking.customer (c_name, c_email, c_address)
                 VALUES ($1, $2, 'TEMP ADDRESS') RETURNING c_no`,
                [customerName, email]
            );
            customerId = newCustomer.rows[0].c_no;
            console.log("🆕 New Customer Created:", customerId);
        }

        // STEP 1️⃣.5: Check for accidental duplicate booking
        const duplicateCheck = await pool.query(`
            SELECT 1
            FROM hotelbooking.booking b
            JOIN hotelbooking.roombooking rb ON b.b_ref = rb.b_ref
            JOIN hotelbooking.room r ON rb.r_no = r.r_no
            WHERE b.c_no = $1
            AND rb.checkin = $2
            AND rb.checkout = $3
            AND r.r_class = $4
            LIMIT 1;
        `, [customerId, checkInDate, checkOutDate, roomType]);

        if (duplicateCheck.rowCount > 0 && !confirmDuplicate) {
            return res.status(409).json({
                message: 'You’ve already booked this type of room for those dates. Do you want to book another?',
                allowDuplicate: true
            });
        }

        // STEP 2️⃣: Find an available room with no overlap
        const roomResult = await pool.query(`
            SELECT r.r_no 
            FROM hotelbooking.room r
            WHERE r.r_class = $1
            AND NOT EXISTS (
                SELECT 1 FROM hotelbooking.roombooking rb
                WHERE rb.r_no = r.r_no
                AND rb.checkin < $3
                AND rb.checkout > $2
            )
            LIMIT 1;
        `, [roomType, checkInDate, checkOutDate]);

        if (roomResult.rowCount === 0) {
            return res.status(400).json({ message: 'No available rooms of this type for your selected dates' });
        }

        const roomNo = roomResult.rows[0].r_no;
        console.log("🏨 Room Assigned:", roomNo);

        // STEP 3️⃣: Look up rate for room type
        const rateResult = await pool.query(
            `SELECT price FROM hotelbooking.rates WHERE r_class = $1`,
            [roomType]
        );
        
        if (rateResult.rowCount === 0) {
            console.log("❌ No rate found for room type:", roomType);
            return res.status(400).json({ message: "No rate found for selected room type." });
        }
        
        const cost = parseFloat(rateResult.rows[0].price);
        const outstanding = cost;
        
        // STEP 3A: Create booking with price
        const bookingResult = await pool.query(
            `INSERT INTO hotelbooking.booking (c_no, b_cost, b_outstanding, b_notes)
            VALUES ($1, $2, $3, 'Online booking') RETURNING b_ref`,
            [customerId, cost, outstanding]
        );
        
        const bookingRef = bookingResult.rows[0].b_ref;
        console.log("📘 Booking Reference:", bookingRef);

        // STEP 4️⃣: Link room with dates
        await pool.query(
            `INSERT INTO hotelbooking.roombooking (b_ref, r_no, checkin, checkout, guests)
             VALUES ($1, $2, $3, $4, $5)`,
            [bookingRef, roomNo, checkInDate, checkOutDate, guests]
        );

        // STEP 5️⃣: Update room status
        await pool.query(
            "UPDATE hotelbooking.room SET r_status = 'O' WHERE r_no = $1",
            [roomNo]
        );

        res.status(201).json({ message: 'Booking confirmed!', bookingRef });

    } catch (error) {
        console.error('❌ Error during booking:', error);
        res.status(500).json({ error: 'Something went wrong with your booking.' });
    }
});


// Retrieve a Booking by Reference (GET /api/booking/:b_ref)
app.get('/api/booking/:b_ref', async (req, res) => {
    const { b_ref } = req.params;

    try {
        const query = await pool.query(`
        SELECT 
            b.b_ref,
            c.c_name,
            c.c_email,
            r.r_no,
            r.r_class,
            TO_CHAR(rb.checkin, 'DD Mon YYYY') AS check_in,
            TO_CHAR(rb.checkout, 'DD Mon YYYY') AS check_out,
            rb.checkout - rb.checkin AS nights,
            rb.guests
        FROM hotelbooking.booking b
        JOIN hotelbooking.customer c ON b.c_no = c.c_no
        JOIN hotelbooking.roombooking rb ON b.b_ref = rb.b_ref
        JOIN hotelbooking.room r ON rb.r_no = r.r_no
        WHERE b.b_ref = $1
        LIMIT 1
    `, [b_ref]);
    

        if (query.rowCount === 0) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        res.status(200).json(query.rows[0]);

    } catch (error) {
        console.error('Error fetching booking:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});




// Cancel a Booking (DELETE /api/booking/:b_ref)
app.delete('/api/booking/:b_ref', async (req, res) => {
    const { b_ref } = req.params;

    try {
        const roomQuery = await pool.query(
            "SELECT r_no FROM hotelbooking.roombooking WHERE b_ref = $1", 
            [b_ref]
        );

        if (roomQuery.rowCount === 0) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        const roomNo = roomQuery.rows[0].r_no;

        await pool.query("DELETE FROM hotelbooking.roombooking WHERE b_ref = $1", [b_ref]);
        await pool.query("DELETE FROM hotelbooking.booking WHERE b_ref = $1", [b_ref]);
        await pool.query("UPDATE hotelbooking.room SET r_status = 'A' WHERE r_no = $1", [roomNo]);

        res.status(200).json({ message: 'Booking successfully cancelled' });

    } catch (error) {
        console.error('Error cancelling booking:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Login Routes + Middleware

// Middleware to protect staff pages
function requireLogin(req, res, next) {
    if (req.session && req.session.staffUser) {
        next();
    } else {
        res.redirect('/login');
    }
}

function requireRole(role) {
    return function (req, res, next) {
        if (req.session && req.session.staffUser && req.session.staffUser.role === role) {
            next();
        } else {
            res.status(403).send('⛔ Access denied: insufficient permissions.');
        }
    };
}


// Login Page (GET)
app.get('/login', (req, res) => {
    res.render('login', { error: null });
});

// Login Submission (POST)
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    console.log("📨 Form submitted:");
    console.log("🧑 Username:", username);
    console.log("🔒 Password:", password);

    try {
        const result = await pool.query('SELECT * FROM hotelbooking.staff WHERE username = $1', [username]);

        console.log("📦 DB Result Row Count:", result.rowCount);
        console.log("📦 DB Rows:", result.rows);

        if (result.rowCount === 0) {
            return res.render('login', { error: 'User not found' });
        }

        const staff = result.rows[0];
        const match = await bcrypt.compare(password, staff.password);
        console.log("🔍 Bcrypt match result:", match);

        if (!match) {
            console.log("❌ Password did not match");
            return res.render('login', { error: 'Incorrect password' });
        }

        req.session.staffUser = {
            id: staff.staff_id,
            username: staff.username,
            name: staff.full_name,
            role: staff.role 
        };

        console.log("✅ Login success for", staff.username);
        if (staff.role === 'receptionist') {
            res.redirect('/staff/reception');
        } else if (staff.role === 'housekeeper') {
            res.redirect('/staff/housekeeping'); 
        } else {
            res.status(403).send('Role not recognised');
        }
        
    } catch (err) {
        console.error('❌ Login error:', err);
        res.render('login', { error: 'An error occurred' });
    }
});


// Logout
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});


// Fetch Today's Check-Outs for Housekeeping (GET /api/housekeeping)
app.get('/api/housekeeping', async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT 
          r.r_no,
          CASE
              WHEN r.r_class = 'std_d' THEN 'Standard Double'
              WHEN r.r_class = 'std_t' THEN 'Standard Twin'
              WHEN r.r_class = 'sup_d' THEN 'Superior Double'
              WHEN r.r_class = 'sup_t' THEN 'Superior Twin'
              ELSE 'Unknown'
          END AS r_class,
          TO_CHAR(rb.checkout, 'YYYY-MM-DD') AS checkout,  -- Formats checkout date as 'YYYY-MM-DD'
          CAST(r.r_status AS TEXT) AS r_status,  -- Casts r_status as TEXT
          CASE 
              WHEN r.r_status = 'C' THEN 'Checked-out'
              WHEN r.r_status = 'X' THEN 'Cleaning'
              WHEN r.r_status = 'O' THEN 'Occupied'
              WHEN r.r_status = 'A' THEN 'Ready for next guest'
              ELSE 'Unknown Status'
          END AS r_status_desc
        FROM hotelbooking.booking b
        JOIN hotelbooking.customer c ON b.c_no = c.c_no
        JOIN hotelbooking.roombooking rb ON b.b_ref = rb.b_ref
        JOIN hotelbooking.room r ON rb.r_no = r.r_no
        WHERE rb.checkout = CURRENT_DATE
        ORDER BY 
            CASE r.r_status 
                WHEN 'C' THEN 1
                WHEN 'X' THEN 2
                WHEN 'O' THEN 3
                WHEN 'A' THEN 4
                ELSE 5
            END,
            r.r_no ASC
      `);
      // console.log("🏨 Housekeeping Data:", result.rows);  // This will log the data before sending it to the frontend
      result.rows.forEach(row => {
        // console.log(`🔍 Room ${row.r_no} | Status: ${row.r_status} | Desc: ${row.r_status_desc}`);
      });   
  
      res.json(result.rows);
    } catch (err) {
      console.error('❌ Housekeeping query error:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

// Housekeeping status change routes
// PUT /api/room/:r_no/status
app.put('/api/room/:r_no/status', async (req, res) => {
    const { r_no } = req.params;
    const { newStatus } = req.body; // new status: 'X' (Cleaning) or 'A' (Available)
  
    try {
      // If newStatus is 'X', update status to Cleaning
      if (newStatus === 'X') {
        await pool.query(
          `UPDATE hotelbooking.room
           SET r_status = 'X'
           WHERE r_status = 'C'  -- Only rooms that are currently checked-out
           AND r_no = $1`, 
          [r_no]  // Update for this specific room
        );
      }
      
      // If newStatus is 'A', update status to Ready for next guest
      else if (newStatus === 'A') {
        await pool.query(
          `UPDATE hotelbooking.room
           SET r_status = 'A'
           WHERE r_status = 'X'  -- Only rooms that are currently being cleaned
           AND r_no = $1`, 
          [r_no]  // Update for this specific room
        );
      } else {
        return res.status(400).json({ message: 'Invalid status change requested' });
      }
  
      res.json({ message: `Room ${r_no} updated to status ${newStatus}` });
    } catch (err) {
      console.error('❌ Room status update error:', err);
      res.status(500).json({ message: 'Failed to update room status' });
    }
  });

// Start the server
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
