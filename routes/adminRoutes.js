const express = require('express');
const TrackPrice = require('../models/TrackPrice');
const GSTRate = require('../models/GSTRate');

const router = express.Router();

router.post('/track-prices', async (req, res) => {
    try {
        console.log('POST /api/admin/track-prices received:', req.body);

        const { track, subTrack, price } = req.body;

        // Input validation
        if (!track || !subTrack || typeof price !== 'number' || isNaN(price)) {
            console.log('Invalid input:', { track, subTrack, price });
            return res.status(400).json({ message: 'Invalid input: track, subTrack, and price (number) are required' });
        }

        // Check MongoDB connection
        if (require('mongoose').connection.readyState !== 1) {
            console.log('MongoDB not connected');
            return res.status(500).json({ message: 'Database not connected' });
        }

        // Perform upsert
        const updatedPrice = await TrackPrice.findOneAndUpdate(
            { track, subTrack },
            { price },
            { upsert: true, new: true, runValidators: true }
        );
        console.log('Successfully updated price in DB:', updatedPrice);

        res.status(200).json(updatedPrice);
    } catch (error) {
        console.error('Detailed error updating track price:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        res.status(500).json({ message: `Failed to update price: ${error.message}` });
    }
});

router.get('/track-prices', async (req, res) => {
    try {
        console.log('GET /api/admin/track-prices called');
        const prices = await TrackPrice.find();
        console.log('Fetched prices:', prices);
        res.status(200).json(prices);
    } catch (error) {
        console.error('Error fetching track prices:', error);
        res.status(500).json({ message: error.message });
    }
});

router.post('/gst-rate', async (req, res) => {
    try {
        console.log('POST /api/admin/gst-rate received:', req.body);
        const { gstRate } = req.body;
        const updatedRate = await GSTRate.findOneAndUpdate(
            {},
            { rate: gstRate },
            { upsert: true, new: true }
        );
        console.log('Updated GST rate:', updatedRate);
        res.status(200).json(updatedRate.rate);
    } catch (error) {
        console.error('Error updating GST rate:', error);
        res.status(500).json({ message: error.message });
    }
});

router.get('/gst-rate', async (req, res) => {
    try {
        console.log('GET /api/admin/gst-rate called');
        const gst = await GSTRate.findOne();
        console.log('Fetched GST rate:', gst ? gst.rate : 0);
        res.status(200).json(gst ? gst.rate : 0);
    } catch (error) {
        console.error('Error fetching GST rate:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;