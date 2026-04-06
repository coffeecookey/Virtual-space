// Main entry point
// setting up express, mongodb, socket.io etc

require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { connectDB } = require('./config/db');
const { initConnectionManager } = require('./managers/ConnectionManager');
const { startGameLoop } = require('./GameLoop');
const { startStatusLoop } = require('./managers/StatusManager');
const { rooms, obstacles } = require('./world/mapData');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
const cors = require('cors');
app.use(cors({ origin: 'https://virtual-office-nmfs.onrender.com' }));

app.use(express.json());
app.get('/api/map', (_req, res) => res.json({ rooms, obstacles }));

connectDB();

initConnectionManager(io);
startGameLoop(io);
startStatusLoop(io);

// if port is set in environment variables then use it
// otherwise default use 3001
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
