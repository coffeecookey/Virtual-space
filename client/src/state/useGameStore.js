import { create } from 'zustand';

// The game store manages the state of the local player and remote players in the game.
const useGameStore = create((set) => ({
  // The localPlayer holds the state of the player controlled by the user and is initialized to null until the player joins the game.
  localPlayer: null,

  // remotePlayers is a Map that holds the state of all other players in the game
  remotePlayers: new Map(),

  // setLocalPlayer is a function to update the local player's state in the store when they join the game or when their state changes.
  setLocalPlayer: (player) => set({ localPlayer: player }),

  // addPlayer adds a new player to the remotePlayers Map when a new player joins the game.
  addPlayer: (userId, data) => set((s) => {
    const m = new Map(s.remotePlayers);
    m.set(userId, data);
    return { remotePlayers: m };
  }),

  // removePlayer removes a player from the remotePlayers Map when a player leaves the game.
  removePlayer: (userId) => set((s) => {
    const m = new Map(s.remotePlayers);
    m.delete(userId);
    return { remotePlayers: m };
  }),

  // updatePositions is called when the server sends updated positions for all players.
  updatePositions: (players) => set((s) => {
    const m = new Map(s.remotePlayers);
    for (const [uid, data] of Object.entries(players)) {
      if (m.has(uid)) m.set(uid, { ...m.get(uid), ...data });
    }
    return { remotePlayers: m };
  }),
}));

export default useGameStore;
