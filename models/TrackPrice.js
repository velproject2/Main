const mongoose = require('mongoose');
const trackPriceSchema = new mongoose.Schema({
    track: { type: String, required: true },
    subTrack: { type: String, required: true },
    price: { type: Number, required: true }
});
module.exports = mongoose.model('TrackPrice', trackPriceSchema);