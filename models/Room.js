const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    roomCode: { type: String, required: true, unique: true },
    players: [
        {   socketId: String, // Track players' WebSocket connections
            userName: String, // Display name or randomly assigned name 
        }],
    moves: [
        {   socketId: String, // Track players' WebSocket connections
            move: String, // Rock, paper, or scissors
        }],
    capacity: { type: Number, required: true, default: 2 },
    gameState: { type: String, required: true, default: 'waiting' },
    createdAt: { type: Date, default: Date.now },
    isGameActive: { type: Boolean, required: true, default: false },
});

const Room = mongoose.model('Room', roomSchema);
module.exports = Room;
