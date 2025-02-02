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
    ssl: { rejectUnauthorized: false }
});

// ✅ Test Route
app.get('/', (req, res) => {
    res.send('Node.js Backend Running');
});

// ✅ Import API Routes
const roomsRoutes = require('./routes/rooms');
app.use('/rooms', roomsRoutes);

// ✅ Start Server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
