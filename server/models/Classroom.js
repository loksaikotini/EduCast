const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  subject: { type: String, required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  materials: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Material' }],
}, { timestamps: true });

module.exports = mongoose.models.Classroom || mongoose.model('Classroom', classroomSchema);