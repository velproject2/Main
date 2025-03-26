const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');

console.log('Starting server...');
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: 'http://127.0.0.1:5500' }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

console.log('Connecting to MongoDB...');
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Log middleware execution
app.use((req, res, next) => {
    console.log(`Request: ${req.method} ${req.url}`);
    next();
});

console.log('Setting up routes...');
const entryRoutes = require('./routes/entryRoutes');
const adminRoutes = require('./routes/adminRoutes');

app.use('/api', entryRoutes);
app.use('/api/admin', adminRoutes);

console.log('Starting server on port', PORT);
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});