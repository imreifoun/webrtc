const http = require('http');
const https = require('https');
const express = require('express');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');

const PORT = 4000;

const config = {
    cors: {
        origin: "*", // Allow all origins (you can restrict this for production)
        methods: ["GET", "POST"] // Specify allowed HTTP methods
    }
};

// Read the SSL certificates for HTTPS
const options = {
    key: fs.readFileSync(path.join(__dirname, 'server.key')),
    cert: fs.readFileSync(path.join(__dirname, 'server.cert')),
};

const app = express();

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Create an https server using the app and SSL options
const server = http.createServer(app);

// Initialize Socket.IO with the server and configuration
const io = new Server(server, config);

// In-memory list of connected users
const usersSQL = [];

io.on('connection', (socket) => {
    console.log('[new] socket id :', socket.id);

    // Add the new socket ID to the list of users
    usersSQL.push(socket.id);
    console.log('usersSQL :', usersSQL);

    // Handle 'get' event from the client
    socket.on('get', () => {
        let data = { local: socket.id, remote: null };

        if (usersSQL.length >= 2) {
            // Find a peer for the current socket
            data.remote = usersSQL[0] === socket.id ? usersSQL[1] : usersSQL[0];

            // Notify the local and remote peers that they are ready
            socket.emit('ready', data);
            socket.to(data.remote).emit('ready', { local: data.remote, remote: data.local });
        } else {
            socket.emit('ready', data); // Notify the client that no peer is available
        }
    });

    // Handle 'route' event for signaling
    socket.on('route', (data) => {
        socket.to(data.to).emit('ice', data.route);
    });

    socket.on('offer', (data) => {
        socket.to(data.to).emit('offer', data.offer);
    });

    socket.on('answer', (data) => {
        socket.to(data.to).emit('answer', data.answer);
    });

    // Handle socket disconnection
    socket.on('disconnect', () => {
        const index = usersSQL.indexOf(socket.id);
        if (index !== -1) {
            usersSQL.splice(index, 1);
        }
        console.log(`[disconnect] socket id : ${socket.id}`);
    });
});

// Start the server
server.listen(PORT, () => {
    console.log(`Server is running on https://localhost:${PORT}`);
});
