const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, enum: ['teacher', 'student'], required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.models.User || mongoose.model('User', userSchema);