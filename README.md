# Rock Paper Scissors Backend

This repository contains the backend for the multiplayer Rock Paper Scissors game. It utilizes Node.js with `socket.io` to handle real-time communication, room management, game logic, and player interactions.

---

## Features

- **Real-time Communication**: Uses `socket.io` to handle player interactions.
- **Room Management**: Players can create and join rooms for multiplayer games.
- **Game Logic**: Implements Rock, Paper, Scissors game mechanics and determines winners.
- **CORS Configuration**: Supports cross-origin requests from the frontend.

---

## Tech Stack

- **Node.js**: JavaScript runtime used to build the backend server.
- **Express**: Web framework for handling HTTP requests and serving the application.
- **Socket.IO**: Library for real-time, bidirectional communication between the client and server.
- **dotenv**: Loads environment variables from a `.env` file to manage configurations.
- **CORS**: Middleware for enabling cross-origin requests from the frontend.

---

## Prerequisites

- **Node.js**: Make sure you have Node.js (version 14 or later).
- **npm**: Comes with Node.js for managing dependencies.

---

## Installation

1. **Clone the Repository**

   ```bash
   git clone https://github.com/auan369/rockPaperScissors-backend.git
   cd rps-backend
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the root directory and add the following:

   ```env
   PORT=4000
   FRONTEND_ORIGIN=http://localhost:3000
   ```

   - **PORT**: Specifies the port the server will run on (default is `4000`).
   - **FRONTEND_ORIGIN**: The URL of your frontend application (default is `http://localhost:3000` for local development).

---

## Running the Server

To start the server, run the following command:

```bash
npm start
```

The server will run on the port specified in the `.env` file (default: 4000).

---

## Key Events

This backend is built to handle communication through WebSocket events:

- **`make-new-room`**: Emits when a player creates a new game room.
- **`join-room`**: Emits when a player joins an existing game room.
- **`leave-room`**: Emits when a player leaves the game room.
- **`make-move`**: Sends the player's move (Rock, Paper, or Scissors).
- **`game-start`**: Triggered when the game is ready to begin.
- **`game-timeout`**: Triggered if the game times out due to inactivity.
- **`all-moves-made`**: Notifies when all players have made their moves, and the winner is determined.

---

## Deployment

For production, this backend is deployed to Vercel.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
