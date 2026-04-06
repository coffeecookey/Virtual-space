const { addPlayer, removePlayer, getAll } = require('./WorldStateManager');
const { clearUser } = require('./RoomManager');
const User = require('../models/User');
const { registerMovementHandler } = require('../handlers/movementHandler');
const { registerChatHandler } = require('../handlers/chatHandler');
const { registerUserHandler } = require('../handlers/userHandler');
const { updateActivity } = require('./StatusManager');
const { SPAWN_POSITION } = require('../config/constants');

const socketToUser = new Map();

// handle socket connection and disconnection
const handleConnect = async (socket, io) => {
  registerMovementHandler(socket, socketToUser);
  registerChatHandler(socket, io, socketToUser);
  registerUserHandler(socket, socketToUser);
  // when a user joins, create a new user in the database and add them to the world state
  socket.on('user:join', async (data) => {
    console.log('[Join] received:', data);
    const { name, avatarId } = data;
    const safeAvatar = [1, 2, 3].includes(avatarId) ? avatarId : 1;
    const existing = socketToUser.get(socket.id);
    if (existing) { removePlayer(existing); clearUser(existing); socketToUser.delete(socket.id); }
    const user = await User.create({ name });
    const userId = user._id.toString();
    socketToUser.set(socket.id, userId);
    addPlayer(userId, { x: SPAWN_POSITION.x, y: SPAWN_POSITION.y, name, avatarId: safeAvatar, socketId: socket.id });
    updateActivity(userId);

    const allPlayers = getAll();
    console.log('[Snapshot] players:', JSON.stringify(Object.values(allPlayers).map(p => ({ name: p.name, avatarId: p.avatarId }))));
    socket.emit('world:snapshot', { userId, players: allPlayers });
    socket.broadcast.emit('player:joined', { userId, x: SPAWN_POSITION.x, y: SPAWN_POSITION.y, name, avatarId: safeAvatar });
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
