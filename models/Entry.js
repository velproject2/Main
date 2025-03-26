const mongoose = require('mongoose');

const entrySchema = new mongoose.Schema({
  apxNumber: { type: String, required: true },
  modelName: { type: String, required: true },
  track: { type: String, required: true },
  trackNumber: { type: String, required: true },
  userName: { type: String, required: true },
  checkInTime: { type: String, required: true },
  checkOutTime: { type: String, default: null },
  totalPrice: { type: Number, default: null }
});

module.exports = mongoose.model('Entry', entrySchema);