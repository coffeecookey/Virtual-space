import { io } from 'socket.io-client';

let socket = null;
let lastEmit = 0;
let hasJoined = false;

// The connect function establishes a new socket connection to the server.
const connect = () => {
  // If a socket connection already exists and is connected, it returns the existing socket. 
  // If a socket exists but is not connected, it disconnects it before creating a new connection.
  if (socket?.connected) return socket;
  if (socket) socket.disconnect();

  socket = io();
  // Set up event listeners for the socket connection to handle connection, disconnection, and connection errors.
  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
  });
  // Log disconnection reasons and connection errors for debugging purposes.
  socket.on('disconnect', (reason) => { hasJoined = false; console.log('Socket disconnected:', reason); });
  socket.on('connect_error', (err) => console.error('Connection error:', err.message));

  return socket;
};

// emitJoin is called when the player submits their name to join the game. 
// It emits a 'user:join' event to the server with the player's name.
const emitJoin = (name) => {
  if (!socket) return console.warn('emitJoin: no socket');
  if (hasJoined) return;
  hasJoined = true;
  socket.emit('user:join', { name });
};

// emitMove is called when the local player moves. 
// It emits a 'player:move' event to the server with the player's new x and y coordinates.
const emitMove = (x, y) => {
  if (!socket) return console.warn('emitMove: no socket');
  const now = Date.now();
  // now - lastEmit < 50 checks if the last 'player:move' event was emitted less than 50 milliseconds ago. 
  // If it was, the function returns early without emitting a new event to prevent spamming the server with too many updates when the player is moving rapidly.
  if (now - lastEmit < 50) return;
  lastEmit = now;
  socket.emit('player:move', { x, y });
};

// The _on function is a helper function that sets up an event listener for a specific socket event and returns a function to remove that listener.
const _on = (event, cb) => {
  socket.on(event, cb);
  return () => socket.off(event, cb);
};

// The following functions are specific event listeners for different socket events such as 
// 'world:snapshot', 'world:state', 'player:joined', 'player:left', 'connect', and 'disconnect'.
const emitChatMessage  = (roomId, text) => socket?.emit('chat:message', { roomId, text });

const onWorldSnapshot  = (cb) => _on('world:snapshot', cb);
const onWorldState    = (cb) => _on('world:state', cb);
const onPlayerJoined  = (cb) => _on('player:joined', cb);
const onPlayerLeft    = (cb) => _on('player:left', cb);
const onConnect        = (cb) => _on('connect', cb);
const onDisconnect     = (cb) => _on('disconnect', cb);
const onInteractStart  = (cb) => _on('interact:start', cb);
const onChatHistory    = (cb) => _on('chat:history', cb);
const onStatusBatch    = (cb) => _on('status:batch', cb);
const onInteractEnd    = (cb) => _on('interact:end', cb);
const onChatMessage    = (cb) => _on('chat:message', cb);
const onLocationUpdate = (cb) => _on('location:update', cb);

const disconnect = () => { hasJoined = false; socket?.disconnect(); socket = null; };

export { connect, emitJoin, emitMove, emitChatMessage, onWorldSnapshot, onWorldState, onPlayerJoined, onPlayerLeft, onConnect, onDisconnect, onInteractStart, onInteractEnd, onChatMessage, onChatHistory, onLocationUpdate, onStatusBatch, disconnect };
