const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Serve static files
app.use(express.static(__dirname));

// Game rooms
const rooms = new Map();

// Generate room code
function generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);

    // Create room (host)
    socket.on('createRoom', (playerName) => {
        const roomCode = generateRoomCode();
        const room = {
            code: roomCode,
            host: socket.id,
            players: [{
                id: socket.id,
                name: playerName || 'Player 1',
                character: 'axel',
                ready: false
            }],
            gameState: null,
            started: false
        };
        rooms.set(roomCode, room);
        socket.join(roomCode);
        socket.roomCode = roomCode;

        console.log(`Room ${roomCode} created by ${playerName}`);
        socket.emit('roomCreated', { roomCode, playerId: 0 });
    });

    // Join room
    socket.on('joinRoom', ({ roomCode, playerName }) => {
        const room = rooms.get(roomCode);

        if (!room) {
            socket.emit('error', 'Room not found');
            return;
        }

        if (room.players.length >= 3) {
            socket.emit('error', 'Room is full');
            return;
        }

        if (room.started) {
            socket.emit('error', 'Game already started');
            return;
        }

        const characters = ['axel', 'shiva', 'rbear'];
        const playerId = room.players.length;

        room.players.push({
            id: socket.id,
            name: playerName || `Player ${playerId + 1}`,
            character: characters[playerId],
            ready: false
        });

        socket.join(roomCode);
        socket.roomCode = roomCode;

        console.log(`${playerName} joined room ${roomCode}`);

        socket.emit('joinedRoom', { roomCode, playerId, players: room.players });
        socket.to(roomCode).emit('playerJoined', { players: room.players });
    });

    // Player ready
    socket.on('playerReady', () => {
        const room = rooms.get(socket.roomCode);
        if (!room) return;

        const player = room.players.find(p => p.id === socket.id);
        if (player) {
            player.ready = true;
            io.to(socket.roomCode).emit('playerUpdate', { players: room.players });

            // Check if all ready
            if (room.players.every(p => p.ready) && room.players.length >= 1) {
                room.started = true;
                io.to(socket.roomCode).emit('gameStart', { players: room.players });
            }
        }
    });

    // Player input (movement, attacks)
    socket.on('playerInput', (input) => {
        const room = rooms.get(socket.roomCode);
        if (!room || !room.started) return;

        // Broadcast to other players
        socket.to(socket.roomCode).emit('remoteInput', {
            playerId: room.players.findIndex(p => p.id === socket.id),
            input
        });
    });

    // Player state update (position, animation, health)
    socket.on('playerState', (state) => {
        const room = rooms.get(socket.roomCode);
        if (!room || !room.started) return;

        socket.to(socket.roomCode).emit('remoteState', {
            playerId: room.players.findIndex(p => p.id === socket.id),
            state
        });
    });

    // Host syncs game state (enemies, objects, waves)
    socket.on('gameState', (state) => {
        const room = rooms.get(socket.roomCode);
        if (!room || socket.id !== room.host) return;

        room.gameState = state;
        socket.to(socket.roomCode).emit('gameStateUpdate', state);
    });

    // Wave transition
    socket.on('waveTransition', (data) => {
        const room = rooms.get(socket.roomCode);
        if (!room || socket.id !== room.host) return;

        io.to(socket.roomCode).emit('waveTransition', data);
    });

    // Disconnect
    socket.on('disconnect', () => {
        console.log('Player disconnected:', socket.id);

        const room = rooms.get(socket.roomCode);
        if (!room) return;

        const playerIndex = room.players.findIndex(p => p.id === socket.id);
        if (playerIndex !== -1) {
            room.players.splice(playerIndex, 1);

            if (room.players.length === 0) {
                rooms.delete(socket.roomCode);
                console.log(`Room ${socket.roomCode} deleted`);
            } else {
                // If host left, assign new host
                if (socket.id === room.host) {
                    room.host = room.players[0].id;
                }
                io.to(socket.roomCode).emit('playerLeft', {
                    players: room.players,
                    newHost: room.host
                });
            }
        }
    });

    // Get room list (for debugging)
    socket.on('getRooms', () => {
        const roomList = Array.from(rooms.entries()).map(([code, room]) => ({
            code,
            players: room.players.length,
            started: room.started
        }));
        socket.emit('roomList', roomList);
    });
});

const PORT = process.env.PORT || 3456;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`XSOR2 Online server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} to play`);
});
