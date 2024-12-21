const http = require('http');
const https = require('https');
const express = require('express');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');

const HTTP_PORT = 3000;
const HTTPS_PORT = 4000;

const config = {
    cors: {
        origin: "*", // Allow all origins (you can restrict this for production)
        methods: ["GET", "POST"], // Specify allowed HTTP methods
    },
};

// Read the SSL certificates for HTTPS
const options = {
    key: fs.readFileSync(path.join(__dirname, 'server.key')),
    cert: fs.readFileSync(path.join(__dirname, 'server.cert')),
};

const app = express();

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Create HTTPS and HTTP servers
const httpsServer = https.createServer(options, app);
const httpServer = http.createServer(app);

// Initialize Socket.IO with both servers
const ioHttps = new Server(httpsServer, config);
const ioHttp = new Server(httpServer, config);

// In-memory list of connected users
const usersSQL = [];

// Shared emit function for HTTP and HTTPS
const shared = (id, event, method, data) => {
    const instance = method === 'https' ? ioHttp : ioHttps;
    instance.to(id).emit(event, data);
};

// Handle connection for a given Socket.IO instance
const handleConnection = (ioInstance, method) => {
    ioInstance.on('connection', (socket) => {
        console.log(`[${method}] New connection: ${socket.id}`);

        // Add the new socket ID to the list of users
        usersSQL.push(socket.id);
        console.log('Connected users:', usersSQL);

        // Handle 'get' event from the client
        socket.on('get', () => {
            const data = { local: socket.id, remote: null };

            if (usersSQL.length >= 2) {
                // Find a peer for the current socket
                data.remote = usersSQL[0] === socket.id ? usersSQL[1] : usersSQL[0];

                // Notify the local and remote peers that they are ready
                socket.emit('ready', data);
                shared(data.remote, 'ready', method, { local: data.remote, remote: data.local });
            } else {
                socket.emit('ready', data); // Notify the client that no peer is available
            }
        });

        // Handle signaling events
        socket.on('route', (data) => shared(data.to, 'ice', method, data.route));
        socket.on('offer', (data) => shared(data.to, 'offer', method, data.offer));
        socket.on('answer', (data) => shared(data.to, 'answer', method, data.answer));

        // Handle socket disconnection
        socket.on('disconnect', () => {
            const index = usersSQL.indexOf(socket.id);
            if (index !== -1) {
                usersSQL.splice(index, 1);
            }
            console.log(`[${method}] Disconnected: ${socket.id}`);
        });
    });
};

// Attach connection handlers for both servers
handleConnection(ioHttps, 'https');
handleConnection(ioHttp, 'http');

// Start the HTTPS server
httpsServer.listen(HTTPS_PORT, () => {
    console.log(`HTTPS Server is running on https://localhost:${HTTPS_PORT}`);
});

// Start the HTTP server
httpServer.listen(HTTP_PORT, () => {
    console.log(`HTTP Server is running on http://localhost:${HTTP_PORT}`);
});
