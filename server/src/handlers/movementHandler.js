const { updatePlayer, getPlayer } = require('../managers/WorldStateManager');
const { MAP_BOUNDS, MAX_SPEED } = require('../config/constants');
const { obstacles } = require('../world/mapData');

const PLAYER_RADIUS = 24;
const collidesWithObstacles = (x, y) => {
  for (const obs of obstacles) {
    const cx = Math.min(Math.max(x, obs.x), obs.x + obs.width);
    const cy = Math.min(Math.max(y, obs.y), obs.y + obs.height);
    const dx = x - cx, dy = y - cy;
    if (dx * dx + dy * dy < PLAYER_RADIUS * PLAYER_RADIUS) return true;
  }
  return false;
};

const lastMoveTime = new Map();
const SPEED_THRESHOLD_SQ = (MAX_SPEED * 6) ** 2;

const registerMovementHandler = (socket, socketToUser) => {
  socket.on('player:move', ({ x, y }) => {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;

    const now = Date.now();
    if (now - (lastMoveTime.get(socket.id) || 0) < 30) return;

    const userId = socketToUser.get(socket.id);
    if (!userId) return;

    const player = getPlayer(userId);
    if (!player) return;

    const dx = x - player.x;
    const dy = y - player.y;
    const distSq = dx * dx + dy * dy;

    if (distSq > SPEED_THRESHOLD_SQ) {
      console.warn(`[Teleport] ${userId} repositioned`);
      const cx = Math.min(Math.max(x, 0), MAP_BOUNDS.width);
      const cy = Math.min(Math.max(y, 0), MAP_BOUNDS.height);
      lastMoveTime.set(socket.id, now);
      updatePlayer(userId, cx, cy);
      return;
    }

    lastMoveTime.set(socket.id, now);
    const cx = Math.min(Math.max(x, 0), MAP_BOUNDS.width);
    const cy = Math.min(Math.max(y, 0), MAP_BOUNDS.height);
    if (collidesWithObstacles(cx, cy)) return;
    updatePlayer(userId, cx, cy);
  });

  socket.on('disconnect', () => lastMoveTime.delete(socket.id));
};

module.exports = { registerMovementHandler };
