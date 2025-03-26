const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');

// Load environment variables
dotenv.config();

console.log('Starting server...');

const app = express();
const PORT = process.env.PORT || 5000;

// Log the MongoDB URI to check if it’s loaded properly
console.log('MongoDB URI:', process.env.MONGO_URI); // Debug log

// Middleware setup
app.use(cors({ origin: 'https://track-entry.netlify.app' }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB connection
console.log('Connecting to MongoDB...');
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err.message));

// Log middleware execution
app.use((req, res, next) => {
    console.log(`Request: ${req.method} ${req.url}`);
    next();
});

// Routes setup
console.log('Setting up routes...');
const entryRoutes = require('./routes/entryRoutes');
const adminRoutes = require('./routes/adminRoutes');

app.use('/api', entryRoutes);
app.use('/api/admin', adminRoutes);

// Start server
console.log('Starting server on port', PORT);
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
