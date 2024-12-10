// DiaryEntry.js
const mongoose = require('mongoose');

const DiaryEntrySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
});

const DiaryEntry = mongoose.model('DiaryEntry', DiaryEntrySchema);

module.exports = DiaryEntry;
