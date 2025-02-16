// server.js - Express Server with PostgreSQL Connection
const express = require('express');
const path = require('path');
const pool = require('./db'); // Import PostgreSQL connection
require('dotenv').config();

const app = express();
const PORT = 3000;

// Middleware to parse JSON requests
app.use(express.json());

// Serve static files (including CSS)
app.use(express.static(path.join(__dirname, 'public')));
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));
app.use('/components', express.static(path.join(__dirname, 'public/components')));

// Routes for static HTML pages
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/rooms', (req, res) => res.sendFile(path.join(__dirname, 'public', 'rooms.html')));
app.get('/facilities', (req, res) => res.sendFile(path.join(__dirname, 'public', 'facilities.html')));
app.get('/booking', (req, res) => res.sendFile(path.join(__dirname, 'public', 'booking.html')));
app.get('/confirmation', (req, res) => res.sendFile(path.join(__dirname, 'public', 'confirmation.html')));
app.get('/contact', (req, res) => res.sendFile(path.join(__dirname, 'public', 'contact.html')));

// API Route to Fetch Available Rooms from Database
app.get('/api/rooms', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM room WHERE r_status = 'A'");
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// API Route to Fetch All Bookings
app.get('/api/bookings', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM booking');
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start Server
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));

// Public folder structure should have the following files:
/*
/public
  |-- index.html
  |-- rooms.html
  |-- facilities.html
  |-- booking.html
  |-- confirmation.html
  |-- contact.html
  |-- css/styles.css  (For minor tweaks only, Bootstrap 5 used as main CSS framework)
  |-- js/components.js
  |-- components/
      |-- navbar.html
      |-- footer.html
*/
