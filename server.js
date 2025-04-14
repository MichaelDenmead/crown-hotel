// server.js - Express Server with PostgreSQL Connection
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const bcrypt = require('bcrypt');
const pool = require('./db'); // PostgreSQL connection

const app = express();
const PORT = 3000;

// EJS View Engine Setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET || 'supersecret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

// Static Files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/staff', express.static(__dirname + '/staff'));

// Middleware for login check
function requireLogin(req, res, next) {
    if (req.session && req.session.staffUser) return next();
    res.redirect('/login');
}

function requireRole(role) {
    return function (req, res, next) {
        if (req.session?.staffUser?.role === role) return next();
        res.status(403).send('⛔ Access denied: insufficient permissions.');
    };
}

// Public Routes
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public/index.html')));
app.get('/rooms', (req, res) => res.sendFile(path.join(__dirname, 'public/rooms.html')));
// ... other public static routes

// Staff Pages
app.get('/staff/reception', requireLogin, requireRole('receptionist'), (req, res) => {
    res.render('staff/reception', { title: 'Reception Dashboard', staffUser: req.session.staffUser });
});

app.get('/staff/housekeeping', requireLogin, requireRole('housekeeper'), (req, res) => {
    res.render('staff/housekeeping', { title: 'Housekeeping', staffUser: req.session.staffUser });
});

// Booking Page (EJS Form)
app.get('/booking', async (req, res) => {
    try {
        const { rows } = await pool.query("SELECT DISTINCT r_class AS type FROM hotelbooking.room WHERE r_status = 'A'");
        res.render('booking', { roomTypes: rows });
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

// [RECEPTION DASHBOARD] Get All Bookings for Reception Dashboard
app.get('/api/bookings', async (req, res) => {
    try {
        const result = await pool.query(`
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
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// [RECEPTION DASHBOARD] Route for Reception CheckIn
app.put('/api/booking/:b_ref/checkin', async (req, res) => {
    const { b_ref } = req.params;
  
    try {
      const roomResult = await pool.query(`
        SELECT r_no FROM hotelbooking.roombooking WHERE b_ref = $1
      `, [b_ref]);
  
      if (roomResult.rowCount === 0) return res.status(404).json({ message: 'Room not found' });
  
      const r_no = roomResult.rows[0].r_no;
  
      await pool.query(`
        UPDATE hotelbooking.room SET r_status = 'O' WHERE r_no = $1
      `, [r_no]);
  
      res.json({ message: 'Checked in' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Check-in failed' });
    }
  });

// [RECEPTION DASHBOARD] Route for Reception CheckOut
app.put('/api/booking/:b_ref/checkout', async (req, res) => {
    const { b_ref } = req.params;
  
    try {
      const roomResult = await pool.query(`
        SELECT r_no FROM hotelbooking.roombooking WHERE b_ref = $1
      `, [b_ref]);
  
      if (roomResult.rowCount === 0) return res.status(404).json({ message: 'Room not found' });
  
      const r_no = roomResult.rows[0].r_no;
      // Update Room status to Checked-Out
      await pool.query(`
        UPDATE hotelbooking.room SET r_status = 'C' WHERE r_no = $1
      `, [r_no]);
      // Update Outstanding Balance to £0 as payments are taken on checkout
      await pool.query(`
        UPDATE hotelbooking.booking SET b_outstanding = 0 WHERE b_ref = $1
      `, [b_ref]);
  
      res.json({ message: 'Checked out' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Check-out failed' });
    }
  });

// [RECEPTION-DETAILS] Get Single Booking for Detail Page
app.get('/staff/reception/booking/:id', async (req, res) => {
    const bookingId = req.params.id;
    try {
        const result = await pool.query(`
            SELECT b.b_ref, c.c_name, c.c_email, c.c_address, c.c_cardtype, c.c_cardexp, c.c_cardno,
                   r.r_no, r.r_class,
                   TO_CHAR(rb.checkin, 'YYYY-MM-DD') AS check_in,
                   TO_CHAR(rb.checkout, 'YYYY-MM-DD') AS check_out,
                   rb.checkout - rb.checkin AS nights, rb.guests
            FROM hotelbooking.booking b
            JOIN hotelbooking.customer c ON b.c_no = c.c_no
            JOIN hotelbooking.roombooking rb ON b.b_ref = rb.b_ref
            JOIN hotelbooking.room r ON rb.r_no = r.r_no
            WHERE b.b_ref = $1
            LIMIT 1;
        `, [bookingId]);

        const booking = result.rows[0];
        if (!booking) return res.status(404).send('Booking not found');

        res.render('staff/reception-detail', {
            booking,
            staffUser: req.session.staffUser,
            req // ✅ Pass request to use query string in EJS
        });

    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

// [RECEPTION-DETAILS] Update Booking from Detail Page
app.post('/staff/reception/booking/:id/update', async (req, res) => {
    const bookingId = req.params.id;
    const {
      c_name, c_email, c_address, c_cardtype, c_cardexp, c_cardno,
      room, checkin, checkout, guests
    } = req.body;
  
    try {
      // First, get c_no using b_ref
      const customerResult = await pool.query(`
        SELECT c_no FROM hotelbooking.booking WHERE b_ref = $1
      `, [bookingId]);
  
      if (customerResult.rowCount === 0) {
        return res.redirect(`/staff/reception/booking/${bookingId}?error=1`);
      }
  
      const c_no = customerResult.rows[0].c_no;
  
      // Update customer details
      await pool.query(`
        UPDATE hotelbooking.customer
        SET c_name = $1,
            c_email = $2,
            c_address = $3,
            c_cardtype = $4,
            c_cardexp = $5,
            c_cardno = $6
        WHERE c_no = $7
      `, [c_name, c_email, c_address, c_cardtype, c_cardexp, c_cardno, c_no]);
  
      // Update room booking details
      await pool.query(`
        UPDATE hotelbooking.roombooking
        SET r_no = $1,
            checkin = $2,
            checkout = $3,
            guests = $4
        WHERE b_ref = $5
      `, [room, checkin, checkout, guests, bookingId]);
  
      res.redirect(`/staff/reception/booking/${bookingId}?updated=1`);
    } catch (err) {
      console.error('❌ Failed to update booking & customer:', err);
      res.redirect(`/staff/reception/booking/${bookingId}?error=1`);
    }
  });
  

// Login
app.get('/login', (req, res) => res.render('login', { error: null }));

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM hotelbooking.staff WHERE username = $1', [username]);
        if (result.rowCount === 0) return res.render('login', { error: 'User not found' });

        const staff = result.rows[0];
        const match = await bcrypt.compare(password, staff.password);
        if (!match) return res.render('login', { error: 'Incorrect password' });

        req.session.staffUser = {
            id: staff.staff_id,
            username: staff.username,
            name: staff.full_name,
            role: staff.role
        };

    // ✅ Correct redirect paths
    const roleRedirects = {
        receptionist: '/staff/reception',
        housekeeper: '/staff/housekeeping'
      };
  
      const redirectPath = roleRedirects[staff.role] || '/login';
      res.redirect(redirectPath);
  
  


    } catch (err) {
        console.error(err);
        res.render('login', { error: 'An error occurred' });
    }
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/login'));
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
              TO_CHAR(rb.checkout, 'YYYY-MM-DD') AS checkout,
              CAST(r.r_status AS TEXT) AS r_status,
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
        res.json(result.rows);
    } catch (err) {
        console.error('❌ Housekeeping query error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Housekeeping status change route
app.put('/api/room/:r_no/status', async (req, res) => {
    const { r_no } = req.params;
    const { newStatus } = req.body;

    try {
        if (newStatus === 'X') {
            await pool.query(
                `UPDATE hotelbooking.room
                 SET r_status = 'X'
                 WHERE r_status = 'C'
                 AND r_no = $1`, [r_no]
            );
        } else if (newStatus === 'A') {
            await pool.query(
                `UPDATE hotelbooking.room
                 SET r_status = 'A'
                 WHERE r_status = 'X'
                 AND r_no = $1`, [r_no]
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

// ✅ Start the server
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));

