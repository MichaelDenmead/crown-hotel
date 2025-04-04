// server.js - Express Server with PostgreSQL Connection
const express = require('express');
const path = require('path');
const pool = require('./db'); // PostgreSQL database connection
require('dotenv').config(); // Load environment variables

const app = express();
const PORT = 3000; // Server port

// ✅ Middleware to parse JSON requests
app.use(express.json());

// -------------------------------
// ✅ Serve Static Files (Public & Staff Areas)
// -------------------------------

// 📌 Public Assets (CSS, JS, Components)
app.use(express.static(path.join(__dirname, 'public'))); // KK THIS ALREADY MAPS ENTIRE PUBLIC FOLDER TO ROOT
app.use('/css', express.static(path.join(__dirname, 'public/css'))); //KK TEMP REMOVE TEST - MAY NOT NEED
app.use('/js', express.static(path.join(__dirname, 'public/js'))); //KK TEMP REMOVE TEST - MAY NOT NEED
app.use('/components', express.static(path.join(__dirname, 'public/components')));

// 📌 Staff Area (Static Files)
app.use('/staff', express.static(__dirname + '/staff'));
app.use('/staff/css', express.static(path.join(__dirname, 'staff/css')));

// -------------------------------
// ✅ Routes for Static Pages
// -------------------------------

// 📌 Public Pages
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/rooms', (req, res) => res.sendFile(path.join(__dirname, 'public', 'rooms.html')));
app.get('/facilities', (req, res) => res.sendFile(path.join(__dirname, 'public', 'facilities.html')));
app.get('/booking', (req, res) => res.sendFile(path.join(__dirname, 'public', 'booking.html')));
app.get('/confirmation', (req, res) => res.sendFile(path.join(__dirname, 'public', 'confirmation.html')));
app.get('/contact', (req, res) => res.sendFile(path.join(__dirname, 'public', 'contact.html')));
app.get('/outAndAbout', (req, res) => res.sendFile(path.join(__dirname, 'public', 'outAndAbout.html')));
app.get('/restaurant', (req, res) => res.sendFile(path.join(__dirname, 'public', 'restaurant.html')));
app.get('/bar', (req, res) => res.sendFile(path.join(__dirname, 'public', 'bar.html')));
app.get('/conference', (req, res) => res.sendFile(path.join(__dirname, 'public', 'conference.html')));
app.get('/gym', (req, res) => res.sendFile(path.join(__dirname, 'public', 'gym.html')));

// 📌 Staff Pages
app.get('/staff/reports', (req, res) => res.sendFile(path.join(__dirname, 'staff', 'reports.html')));

// -------------------------------
// ✅ API Routes - Booking Functionality
// -------------------------------

// 📌 Fetch Available Rooms (GET /api/rooms)
app.get('/api/rooms', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM room WHERE r_status = 'A'"); // Fetch available rooms
        res.json(result.rows);
    } catch (err) {
        console.error('Database query error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 📌 Fetch All Bookings (GET /api/bookings)
app.get('/api/bookings', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM booking'); // Fetch all bookings
        res.json(result.rows);
    } catch (err) {
        console.error('Database query error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 📌 Create a New Booking (POST /api/book)
app.post('/api/book', async (req, res) => {
    const { customerName, email, roomType, checkInDate, checkOutDate, guests } = req.body;

    try {
        console.log("📥 Received Booking Request:", req.body);  // Log request for debugging

        // Step 1: Check room availability (fixing column to r_no)
        const availableRoom = await pool.query(
            "SELECT r_no FROM room WHERE r_class = $1 AND r_status = 'A' LIMIT 1",
            [roomType]
        );

        console.log("🔎 Available Room:", availableRoom.rows);  // Log available room

        if (availableRoom.rowCount === 0) {
            return res.status(400).json({ message: 'No available rooms for the selected type' });
        }

        const roomNo = availableRoom.rows[0].r_no;

        // Step 2: Insert booking details into 'booking' table
        const bookingResult = await pool.query(
            `INSERT INTO booking (c_name, c_email, check_in, check_out, guests) 
            VALUES ($1, $2, $3, $4, $5) RETURNING b_ref`,
            [customerName, email, checkInDate, checkOutDate, guests]
        );

        const bookingRef = bookingResult.rows[0].b_ref;

        // Step 3: Assign room to booking in 'roombooking' table (fixing column to r_no)
        await pool.query("INSERT INTO roombooking (b_ref, r_no) VALUES ($1, $2)", [bookingRef, roomNo]);

        // Step 4: Update room status to 'B' (Booked)
        await pool.query("UPDATE room SET r_status = 'B' WHERE r_no = $1", [roomNo]);

        console.log("✅ Booking Successful! Reference:", bookingRef);
        res.status(201).json({ message: 'Booking confirmed!', bookingRef });

    } catch (error) {
        console.error('❌ Error Creating Booking:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 📌 Retrieve a Booking by Reference (GET /api/booking/:b_ref)
app.get('/api/booking/:b_ref', async (req, res) => {
    const { b_ref } = req.params;

    try {
        const bookingQuery = await pool.query(
            `SELECT b.*, r.r_class FROM booking b 
            JOIN roombooking rb ON b.b_ref = rb.b_ref 
            JOIN room r ON rb.r_no = r.r_no 
            WHERE b.b_ref = $1`, 
            [b_ref]
        );

        if (bookingQuery.rowCount === 0) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        res.status(200).json(bookingQuery.rows[0]);

    } catch (error) {
        console.error('Error fetching booking:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 📌 Cancel a Booking (DELETE /api/booking/:b_ref)
app.delete('/api/booking/:b_ref', async (req, res) => {
    const { b_ref } = req.params;

    try {
        // Step 1: Retrieve assigned room (fixing column to r_no)
        const roomQuery = await pool.query(
            "SELECT r_no FROM roombooking WHERE b_ref = $1", 
            [b_ref]
        );

        if (roomQuery.rowCount === 0) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        const roomNo = roomQuery.rows[0].r_no;

        // Step 2: Remove booking records
        await pool.query("DELETE FROM roombooking WHERE b_ref = $1", [b_ref]);
        await pool.query("DELETE FROM booking WHERE b_ref = $1", [b_ref]);

        // Step 3: Mark room as available again (fixing column to r_no)
        await pool.query("UPDATE room SET r_status = 'A' WHERE r_no = $1", [roomNo]);

        res.status(200).json({ message: 'Booking successfully cancelled' });

    } catch (error) {
        console.error('Error cancelling booking:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ✅ Start the server
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
