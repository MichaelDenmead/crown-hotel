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

// API - Get All Bookings
app.get('/api/bookings', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT b.b_ref, c.c_name, c.c_email, r.r_no, r.r_class,
                   TO_CHAR(rb.checkin, 'YYYY-MM-DD') AS check_in,
                   TO_CHAR(rb.checkout, 'YYYY-MM-DD') AS check_out,
                   rb.checkout - rb.checkin AS nights, rb.guests
            FROM hotelbooking.booking b
            JOIN hotelbooking.customer c ON b.c_no = c.c_no
            JOIN hotelbooking.roombooking rb ON b.b_ref = rb.b_ref
            JOIN hotelbooking.room r ON rb.r_no = r.r_no
            ORDER BY rb.checkin ASC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// API - Get Single Booking for Detail Page
app.get('/staff/reception/booking/:id', async (req, res) => {
    const bookingId = req.params.id;
    try {
        const result = await pool.query(`
            SELECT b.b_ref, c.c_name, c.c_email, r.r_no, r.r_class,
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
            staffUser: req.session.staffUser // ✅ fix: pass session user
          });
          
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

// API - Update Booking from Detail Page
app.post('/staff/reception/booking/:id/update', async (req, res) => {
    const bookingId = req.params.id;
    const updatedData = req.body;

    try {
        // Example update - replace with actual logic
        await pool.query(`
            UPDATE hotelbooking.roombooking
            SET guests = $1
            WHERE b_ref = $2
        `, [updatedData.guests, bookingId]);

        res.redirect('/staff/reception');
    } catch (err) {
        console.error(err);
        res.status(500).send('Failed to update booking');
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

// Start Server
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
