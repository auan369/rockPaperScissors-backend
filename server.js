const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();
const User = require('./models/User');
const Room = require('./models/Room');


// Connect to MongoDB
const connectionString = process.env.MONGODB_URI;

// Create an Express app and HTTP server
const app = express();
app.use(cors()); // Allow requests from frontend
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000', // Default to localhost:3000 if env is not set
        methods: ['GET', 'POST'],
    },
});

var users = {}; // Track games in rooms
var rooms = {}; // Track rooms
// for (var key in users) {
//     console.log(users[key]);
// }
// Handle WebSocket connections
io.on('connection', async (socket) => {
    // Clear old users
    clearOldUsers();
    clearOldRooms();
    // console.log(randomRoom(4));
    // Get all current users
    users = await User.find();
    console.log(`User connected: ${socket.id}`);
    var tempName = randomName();
    var roomCodevalue;
    while (users.some(user => user.name === tempName)) {
        tempName = randomName();
    }
    // users[socket.id] = tempName;
    const newUser = new User({ socketID:socket.id, name: tempName});
    await newUser.save();
    
    users = await User.find();
    // console.log(users);

    //send tempName to frontend
    socket.emit('name', tempName);

    socket.on('make-new-room', async () => {
        var roomCodevalue = randomRoom(4);
        rooms = await Room.find();
        while (rooms.some(existingRoom => existingRoom.roomCode === roomCodevalue)) {
            roomCodevalue = randomRoom(4);
        }
        const newRoom = new Room({ roomCode: roomCodevalue, players: [{socketId: socket.id, userName: tempName}]});
        await newRoom.save();
        socket.join(roomCodevalue);
        console.log('Room created: ' + roomCodevalue);
        console.log(`User ${socket.id} joined room ${roomCodevalue}`);
        socket.emit('joined-room', roomCodevalue);
    });

    socket.on('join-room', async (roomCode) => {
        rooms = await Room.find();
        // check if room exists
        if (rooms.some(room => room.roomCode === roomCode)) {
            const room = await Room.findOne({ roomCode:roomCode });
            // check if room is full, if not add player to room
            if (room.players.length<room.capacity) {
                room.players.push({socketId: socket.id, userName: tempName});
                await room.save();
                socket.join(roomCode);
                console.log(`User ${socket.id} joined room ${roomCode}`);
                socket.emit('joined-room', room.roomCode);
            }
            else {
                socket.emit('failed-join', 'Room is full');
                console.log('Room is full');
                return; // stop execution so next block doesn't run
            }

            // check if room is full after player joins, if so start game
            if (room.players.length === room.capacity) {
                console.log('Room is full');
                room.gameState = 'waitingMove';
                room.isGameActive = true;
                await room.save();
                io.to(roomCode).emit('game-start', room);
                console.log('Game started');
            }
        } else {
            socket.emit('failed-join', 'Room does not exist');
            console.log('Room does not exist');
        }
            
    });

    socket.on('leave-room', async (roomCode) => {
        
        const room = await Room.findOne({ roomCode:roomCode });
        if (!room) {
            console.log('Room does not exist');
            return;
        }
        room.players = room.players.filter(player => player.socketId !== socket.id);
        room.isGameActive = room.players.length === room.capacity;
        await room.save();
        socket.leave(roomCode);
        console.log(`User ${socket.id} left room ${roomCode}`);
        if (room.players.length === 0) {
            await Room.deleteOne({ roomCode: roomCode });
            console.log(`Room ${roomCode} deleted`);
        }
        
        // socket.emit('left-room', roomCode);
    });

    socket.on('make-move', async (data) => {
        const room = await Room.findOne({ roomCode:data.roomCode });
        if (!room) {
            console.log(`Room ${data.roomCode} does not exist`);
            return;
        }
        //add to moves array if socketId is in players array but not in moves yet
        if (room.players.some(player => player.socketId === socket.id) && !room.moves.some(move => move.socketId === socket.id)) {
            room.moves.push({socketId: socket.id, move: data.move});
            await room.save();
            console.log(`User ${socket.id} made move ${data.move} in room ${data.roomCode}`);
        }

        //check if all players have made a move
        if (room.moves.length === room.capacity) {
            console.log('All players have made a move');
            //determine winner
            const moves = room.moves;
            const player1 = moves[0];
            const player2 = moves[1];
            let winner;
            if (player1.move === player2.move) {
                winner = '';
            } else if ((player1.move === 'rock' && player2.move === 'scissors') || (player1.move === 'scissors' && player2.move === 'paper') || (player1.move === 'paper' && player2.move === 'rock')) {
                winner = player1.socketId;
            } else {
                winner = player2.socketId;
            }


            room.gameState = 'gameResult';
            // room.isGameActive = false;
            await room.save();
            var winnerName = winner === "" ? "" : room.players.find(player => player.socketId === winner).userName;
            io.to(data.roomCode).emit('all-moves-made', {room: room, winnerID: winner, winnerName: winnerName});
        }
            
    });

    socket.on('play-again', async (roomCode) => {
        const room = await Room.findOne({ roomCode:roomCode });
        if (!room) {
            console.log(`Room ${data.roomCode} does not exist`);
            return;
        }
        room.moves = [];
        room.gameState = 'waitingMove';
        room.isGameActive = true;
        await room.save();
        io.to(roomCode).emit('game-start', room);
        console.log('Game started');
    });



        


    // Handle disconnect
    socket.on('disconnect', async () => {
        console.log(`User disconnected: ${socket.id}`);
        // Remove the player from db
        try {
            await User.deleteOne({socketID: socket.id});
            console.log('User deleted');
            await Room.updateMany({}, { $pull: { players: { socketId: socket.id } } });
            console.log('Player removed from rooms');
            await Room.deleteMany({ players: { $size: 0 } });
        }
        catch (err) {
            console.error(err);
        }
        //update users
        users = await User.find();
    });
});

//Misc functions
const adj = [
    "Famous",
    "Interesting",
    "Cold",
    "Swift",
    "Awesome",
    "Scrawny",
    "Festive",
    "Special",
    "Tearful",
    "Ritzy",
    "Puzzled",
    "Exultant",
    "Feeble",
    "Curly",
    "Squeamish",
    "Shrill",
    "Eminent",
    "Existing",
    "Agreeable",
    "Succinct"
]
const noun = [
    "Donkey",
    "Rhinoceros",
    "Hog",
    "Impala",
    "Jackal",
    "Finch",
    "Lemur",
    "Pig",
    "Salamander",
    "Lynx",
    "Bunny",
    "Llama",
    "Rooster",
    "Iguana",
    "Doe",
    "Ocelot",
    "Boar",
    "Rooster",
    "Bear",
    "Fox"
]

const randomName = () => {
    return adj[Math.floor(Math.random()*adj.length)] + " " + noun[Math.floor(Math.random()*noun.length)]
}

const randomRoom = (length) => {
    var result = '';
    const characters = 'ABCDEFGHJKLMNOPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz0123456789';
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}
// Handle API requests

// Start server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});


const connectToDatabase = async () => {
    try {
        await mongoose.connect(connectionString, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            dbName: 'rockPaperScissors',
        });
        console.log('MongoDB connected');
        return { status: 200, message: 'Connected to MongoDB database' };
    } catch (err) {
        console.error('Error connecting to the database:', err);
        return { status: 500, message: 'Error connecting to MongoDB database', error: err.message };
    }
};

const clearOldUsers = async () => {
    const dataNow = new Date();
    try {
        // Delete users that haven't been updated in the last 1 hour
        const dataOld = new Date(dataNow - 60 * 60 * 1000);
        await User.deleteMany({ lastUpdated: { $lt: dataOld } });
        console.log('Cleared old users');
    } catch (err) {
        console.error('Error clearing old users:', err);
    }
};

const clearOldRooms = async () => {
    const dataNow = new Date();
    try {
        // Delete rooms that haven't been updated in the last 1 hour
        const dataOld = new Date(dataNow - 60 * 60 * 1000);
        await Room.deleteMany({ lastUpdated: { $lt: dataOld } });
        console.log('Cleared old rooms');
    } catch (err) {
        console.error('Error clearing old rooms:', err);
    }
};

// Connect to MongoDB
const response = connectToDatabase();
