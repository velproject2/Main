const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');
const { Client } = require('cassandra-driver');

console.log('Starting server...');
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const client = new Client({
  cloud: { secureConnectBundle: process.env.ASTRA_DB_SECURE_BUNDLE_PATH },
  credentials: { username: 'token', password: process.env.ASTRA_DB_APPLICATION_TOKEN }
});

async function connectToAstra() {
  try {
    await client.connect();
    console.log('Connected to Astra DB');
    await client.execute(`USE ${process.env.ASTRA_DB_KEYSPACE}`);

    // Initialize test_entries table
    await client.execute(
      'CREATE TABLE IF NOT EXISTS test_entries (apxNumber text, modelName text, track text, trackNumber text, driverName text, email text, checkInTime text, checkOutTime text, totalPrice double, PRIMARY KEY (apxNumber, checkInTime))'
    );
    console.log('test_entries table initialized');

    // Initialize track_prices table
    await client.execute(
      'CREATE TABLE IF NOT EXISTS track_prices (track text, subTrack text, price double, PRIMARY KEY (track, subTrack))'
    );
    console.log('track_prices table initialized');

    // Initialize gst_rate table
    await client.execute(
      'CREATE TABLE IF NOT EXISTS gst_rate (id text PRIMARY KEY, rate double)'
    );
    console.log('gst_rate table initialized');

    // Export client for routes
    module.exports.client = client;

    const entryRoutes = require('./routes/entryRoutes');
    const adminRoutes = require('./routes/adminRoutes');

    app.use('/api', entryRoutes);
    app.use('/api/admin', adminRoutes);

    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error('Astra DB connection error:', err);
    process.exit(1); // Exit on failure
  }
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../Frontend')));
app.use((req, res, next) => {
  console.log(`Request: ${req.method} ${req.url}`);
  next();
});

connectToAstra();
