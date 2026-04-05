// This file manages the world state
// which includes the positions of all players in the game.

// We use a Map to store player data in memory for fast access.
const players = new Map();

// Functions to manage the world state
const addPlayer = (userId, data) => players.set(userId, data);
const removePlayer = (userId) => players.delete(userId);
const updatePlayer = (userId, x, y) => {
  const player = players.get(userId);
  if (player) player.x = x, player.y = y;
};

// Function to get the entire world state, which will be sent to clients
const getAll = () => Object.fromEntries(players);

// Function to get a specific player's data by their user ID
const getPlayer = (userId) => players.get(userId);


module.exports = { addPlayer, removePlayer, updatePlayer, getAll, getPlayer };
