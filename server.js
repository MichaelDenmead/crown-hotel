require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// PostgreSQL Connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Needed for Render PostgreSQL
});

// Test Route
app.get('/', (req, res) => {
    res.send('Node.js Backend Running');
});

// Database Test Route
app.get('/test-db', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({ success: true, time: result.rows[0].now });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
});

const roomsRoutes = require('./routes/rooms');
app.use('/rooms', roomsRoutes);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
