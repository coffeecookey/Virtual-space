const { addPlayer, removePlayer, getAll } = require('./WorldStateManager');
const User = require('../models/User');

const socketToUser = new Map();

// handle socket connection and disconnection
const handleConnect = async (socket, io) => {
  // when a user joins, create a new user in the database and add them to the world state
  socket.on('user:join', async ({ name }) => {
    const user = await User.create({ name });
    const userId = user._id.toString();
    
    // Map the socket ID to the user ID for easy lookup on disconnect
    socketToUser.set(socket.id, userId);

    // Add the new player to the world state with initial position and name
    addPlayer(userId, { x: 100, y: 100, name, socketId: socket.id });

    // Send the current world state to the newly connected player
    socket.emit('world:snapshot', { userId, players: getAll() });

    // Notify all other players about the new player
    socket.broadcast.emit('player:joined', { userId, x: 100, y: 100, name });
  });

  // when a user disconnects, remove them from the world state 
  // and notify other players
  socket.on('disconnect', () => {
    const userId = socketToUser.get(socket.id);
    if (!userId) return;
    removePlayer(userId);
    socketToUser.delete(socket.id);
    io.emit('player:left', { userId });
  });
};

// Initialize the connection manager to handle socket connections
const initConnectionManager = (io) => {
  io.on('connection', (socket) => handleConnect(socket, io));
};

module.exports = { initConnectionManager, socketToUser };
