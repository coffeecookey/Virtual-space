import { create } from 'zustand';

const useGameStore = create((set) => ({
  localPlayer: null,
  remotePlayers: new Map(),

  setLocalPlayer: (player) => set({ localPlayer: player }),
  addPlayer: (userId, data) => set((s) => {
    const m = new Map(s.remotePlayers);
    m.set(userId, data);
    return { remotePlayers: m };
  }),
  removePlayer: (userId) => set((s) => {
    const m = new Map(s.remotePlayers);
    m.delete(userId);
    return { remotePlayers: m };
  }),
  updatePositions: (players) => set((s) => {
    const m = new Map(s.remotePlayers);
    for (const [uid, data] of Object.entries(players)) {
      if (m.has(uid)) m.set(uid, { ...m.get(uid), ...data });
    }
    return { remotePlayers: m };
  }),
  updatePlayerPosition: (uid, x, y) => set((s) => {
    if (!s.remotePlayers.has(uid)) return s;
    const m = new Map(s.remotePlayers);
    m.set(uid, { ...m.get(uid), x, y });
    return { remotePlayers: m };
  }),

  chatMessages: [],
  activeChatRoom: null,
  connectedUsers: [],

  addChatMessage: (msg) => set((s) => {
    if (s.chatMessages.some(m => m.id === msg.id)) return s;
    return { chatMessages: [...s.chatMessages, msg].slice(-100) };
  }),
  setChatMessages: (msgs) => set({ chatMessages: msgs }),
  clearChatMessages: () => set({ chatMessages: [] }),
  setActiveChatRoom: (roomId) => set({ activeChatRoom: roomId }),
  setConnectedUsers: (users) => set({ connectedUsers: users }),

  currentRoom: null,
  playerStatuses: new Map(),
  // map of userId → room name string (null = hallway/corridor)
  playerRooms: new Map(),

  setCurrentRoom: (room) => set({ currentRoom: room }),
  setPlayerStatus: (userId, status) => set((s) => {
    const m = new Map(s.playerStatuses);
    m.set(userId, status);
    return { playerStatuses: m };
  }),
  applyStatusBatch: (batch) => set((s) => {
    const m = new Map(s.playerStatuses);
    Object.entries(batch).forEach(([uid, status]) => m.set(uid, status));
    return { playerStatuses: m };
  }),
  setPlayerRooms: (map) => set({ playerRooms: map }),

  localCoords: { x: 0, y: 0 },
  setLocalCoords: (x, y) => set({ localCoords: { x, y } }),

  toasts: [],
  // accepts string or { message, type: 'info'|'join'|'leave' }
  addToast: (payload) => set((s) => {
    const id = Date.now() + Math.random();
    const toast = typeof payload === 'string'
      ? { id, message: payload, type: 'info' }
      : { id, message: payload.message, type: payload.type || 'info' };
    return { toasts: [...s.toasts, toast] };
  }),
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export default useGameStore;
