// Main entry point
// setting up express, mongodb, socket.io etc

require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { connectDB } = require('./config/db');
const { initConnectionManager } = require('./managers/ConnectionManager');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(express.json());

connectDB();

initConnectionManager(io);

// if port is set in environment variables then use it
// otherwise default use 3001
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
