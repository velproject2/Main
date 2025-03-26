const express = require('express');
const router = express.Router();
const Entry = require('../models/Entry');
const TrackPrice = require('../models/TrackPrice');
const GSTRate = require('../models/GSTRate');

console.log('entryRoutes loaded'); // Debug to confirm file is loaded

router.post('/checkin', async (req, res) => {
  try {
    const { apxNumber, modelName, track, trackNumber, userName, checkInTime } = req.body;
    const existingEntry = await Entry.findOne({ apxNumber, checkOutTime: null });
    if (existingEntry) {
      return res.status(400).json({ message: 'This APX Number has an active check-in!' });
    }

    const entry = new Entry({
      apxNumber,
      modelName,
      track,
      trackNumber,
      userName,
      checkInTime: checkInTime || new Date().toLocaleString()
    });
    const savedEntry = await entry.save();
    res.status(201).json(savedEntry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/checkout', async (req, res) => {
  try {
    const { apxNumber, modelName, track, trackNumber, userName, checkOutTime } = req.body;
    const entry = await Entry.findOne({ apxNumber, checkOutTime: null });
    if (!entry) {
      return res.status(400).json({ message: 'No matching Check-In found for this APX Number!' });
    }

    entry.modelName = modelName;
    entry.trackNumber = trackNumber;
    entry.userName = userName;
    entry.checkOutTime = checkOutTime || new Date().toLocaleString();

    const hoursUtilized = calculateHours(entry.checkInTime, entry.checkOutTime);
    const hoursBilled = Math.ceil(hoursUtilized);
    const trackPrice = await TrackPrice.findOne({ track: entry.track, subTrack: entry.trackNumber });
    const price = trackPrice ? trackPrice.price : 0;
    const gstRate = await getGSTRate();
    entry.totalPrice = hoursBilled * price * (1 + gstRate / 100);

    const updatedEntry = await entry.save();
    res.status(200).json(updatedEntry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/entries', async (req, res) => {
  try {
    const entries = await Entry.find();
    res.status(200).json(entries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/entries', async (req, res) => {
  try {
    await Entry.deleteMany({});
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

function calculateHours(checkInTime, checkOutTime) {
  const start = new Date(checkInTime);
  const end = new Date(checkOutTime);
  const diffMs = Math.abs(end - start);
  return diffMs / (1000 * 60 * 60);
}

async function getGSTRate() {
  const gst = await GSTRate.findOne();
  return gst ? gst.rate : 0;
}

module.exports = router; // Critical: Export the router