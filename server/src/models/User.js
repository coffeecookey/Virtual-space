const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sessionStart: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);
