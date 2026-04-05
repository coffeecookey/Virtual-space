const { updateActivity, removeUser } = require('../managers/StatusManager');

const registerUserHandler = (socket, socketToUser) => {
  socket.on('player:move', () => {
    const userId = socketToUser.get(socket.id);
    if (userId) updateActivity(userId);
  });

  socket.on('disconnect', () => {
    const userId = socketToUser.get(socket.id);
    if (userId) removeUser(userId);
  });
};

module.exports = { registerUserHandler };
