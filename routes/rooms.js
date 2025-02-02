const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

// Connect to PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// ✅ Get all rooms
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM rooms');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// ✅ Get a single room by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM rooms WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Room not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// ✅ Add a new room
router.post('/', async (req, res) => {
    try {
        const { room_number, room_type, price, is_available } = req.body;
        const result = await pool.query(
            'INSERT INTO rooms (room_number, room_type, price, is_available) VALUES ($1, $2, $3, $4) RETURNING *',
            [room_number, room_type, price, is_available]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// ✅ Update a room
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { room_number, room_type, price, is_available } = req.body;
        const result = await pool.query(
            'UPDATE rooms SET room_number = $1, room_type = $2, price = $3, is_available = $4 WHERE id = $5 RETURNING *',
            [room_number, room_type, price, is_available, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Room not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// ✅ Delete a room
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM rooms WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Room not found' });
        }
        res.json({ message: 'Room deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
