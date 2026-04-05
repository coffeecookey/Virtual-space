const { getPlayer } = require('./WorldStateManager');

const lastActive  = new Map();
const prevStatus  = new Map();
const AFK_THRESHOLD  = 60000;
const CHECK_INTERVAL = 10000;
let intervalId = null;

const updateActivity = (userId) => {
  if (!getPlayer(userId)) return;
  lastActive.set(userId, Date.now());
};

const removeUser = (userId) => {
  lastActive.delete(userId);
  prevStatus.delete(userId);
};

const startStatusLoop = (io) => {
  if (intervalId) return;
  intervalId = setInterval(() => {
    const now = Date.now();
    const changes = {};
    lastActive.forEach((ts, userId) => {
      const status = now - ts > AFK_THRESHOLD ? 'afk' : 'online';
      if (prevStatus.get(userId) !== status) {
        changes[userId] = status;
        prevStatus.set(userId, status);
      }
    });
    if (Object.keys(changes).length > 0) io.emit('status:batch', changes);
  }, CHECK_INTERVAL);
};

const stopStatusLoop = () => { clearInterval(intervalId); intervalId = null; };

module.exports = { updateActivity, removeUser, startStatusLoop, stopStatusLoop };
