const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    socketID: { type: String, required: true, unique: true },
    name: { type: String, required: true, unique: true },
    lastUpdated: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);
module.exports = User;
