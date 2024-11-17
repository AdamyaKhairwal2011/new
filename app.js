// server.js

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const crypto = require('crypto');

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Initialize Socket.io with the server
const io = socketIo(server);

// Serve the HTML, CSS, and JavaScript directly from the root route
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Real-Time Chat with Chatroom Code</title>
        <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #4CAF50; }
            ul { list-style-type: none; padding: 0; }
            li { padding: 8px; background: #f4f4f4; margin-bottom: 8px; border-radius: 4px; }
            input[type="text"] { width: 80%; padding: 8px; margin-right: 8px; }
            button { padding: 8px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; }
            button:hover { background: #45a049; }
        </style>
    </head>
    <body>
        <h1>Real-Time Chat Room</h1>
        
        <h2>Create or Join a Chatroom</h2>
        <input id="room-code" type="text" placeholder="Enter room code or create a new one" autocomplete="off">
        <button onclick="joinRoom()">Join Room / Create Room</button>

        <h3>Room Code: <span id="room-display">None</span></h3>

        <ul id="messages"></ul>

        <input id="message-input" type="text" placeholder="Type a message..." autocomplete="off">
        <button onclick="sendMessage()">Send</button>

        <script src="/socket.io/socket.io.js"></script>
        <script>
            const socket = io();
            let currentRoom = '';

            // Listen for 'chat message' events from the server
            socket.on('chat message', function(msg) {
                const item = document.createElement('li');
                item.textContent = msg;
                document.getElementById('messages').appendChild(item);
            });

            // Listen for room information
            socket.on('room info', function(roomCode) {
                document.getElementById('room-display').textContent = roomCode;
                currentRoom = roomCode;
            });

            // Send a message to the server
            function sendMessage() {
                const message = document.getElementById('message-input').value;
                if (message && currentRoom) {
                    socket.emit('chat message', { room: currentRoom, msg: message });
                    document.getElementById('message-input').value = ''; // Clear the input field
                }
            }

            // Join an existing room or create a new room
            function joinRoom() {
                const roomCode = document.getElementById('room-code').value.trim();

                if (roomCode) {
                    socket.emit('join room', roomCode);
                } else {
                    // If no room code is provided, generate a new one
                    const newRoomCode = generateRoomCode();
                    socket.emit('create room', newRoomCode);
                }
            }

            // Generate a unique room code
            function generateRoomCode() {
                return crypto.randomBytes(4).toString('hex'); // Generate a random 8-character hex code
            }
        </script>
    </body>
    </html>
  `);
});

// Handle socket connections
io.on('connection', (socket) => {
    console.log('A user connected');

    // Handle room creation
    socket.on('create room', (roomCode) => {
        socket.join(roomCode);
        socket.emit('room info', roomCode);
        console.log(`Room created: ${roomCode}`);
    });

    // Handle joining an existing room
    socket.on('join room', (roomCode) => {
        if (roomCode) {
            socket.join(roomCode);
            socket.emit('room info', roomCode);
            console.log(`User joined room: ${roomCode}`);
        }
    });

    // Handle incoming messages from clients
    socket.on('chat message', (data) => {
        const { room, msg } = data;
        io.to(room).emit('chat message', msg); // Broadcast the message to all clients in the room
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

// Start the server
server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
