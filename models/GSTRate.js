const mongoose = require('mongoose');

const gstRateSchema = new mongoose.Schema({
  rate: { type: Number, required: true }
}, { collection: 'gst_rate' });

module.exports = mongoose.model('GSTRate', gstRateSchema);