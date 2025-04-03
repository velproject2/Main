const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');
const { Client } = require('cassandra-driver');
const Entry = require('./models/Entry');
const TrackPrice = require('./models/TrackPrice');
const GSTRate = require('./models/GSTRate');

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
    await Entry.initialize(client);
    await TrackPrice.initialize(client);
    await GSTRate.initialize(client);

    module.exports.client = client; // Export client for routes

    const entryRoutes = require('./routes/entryRoutes');
    const adminRoutes = require('./routes/adminRoutes');

    app.use('/api', entryRoutes);
    app.use('/api/admin', adminRoutes);

    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error('Astra DB connection error:', err);
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
