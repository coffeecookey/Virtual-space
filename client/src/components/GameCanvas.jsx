import { useEffect, useRef } from 'react';
import { initRenderer } from '../core/Renderer';
import { initInput, getVelocity } from '../core/InputHandler';
import { fetchMapData, loadMap } from '../core/MapLoader';
import { applyCamera } from '../core/Camera';
import Player from '../entities/Player';
import useGameStore from '../state/useGameStore';
import {
  connect, emitJoin, emitMove, disconnect,
  onWorldSnapshot, onWorldState, onPlayerJoined, onPlayerLeft,
  onInteractStart, onInteractEnd, onChatMessage, onChatHistory,
  onLocationUpdate, onStatusBatch,
} from '../network/SocketClient';
const MAP_BOUNDS = { width: 2000, height: 2000 };

// clamp is a utility function that restricts a value v to be within the range defined by min and max.
// It uses Math.min and Math.max to ensure that v does not go below min or above max, effectively clamping it within the specified range.
const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

// GameCanvas is the main component responsible for rendering the game canvas and managing the game state for the local player and remote players.
export default function GameCanvas({ playerName }) {
  const canvasRef = useRef(null);

  // stateRef is a mutable reference that holds the current state of the game, 
  // including the local player's ID, a Map of all players, and the local player's current x and y coordinates.
  const stateRef = useRef({ localId: null, players: new Map(), localX: 0, localY: 0, lastTick: -1, rooms: [] });

  // We extract the setLocalPlayer, addPlayer, and removePlayer functions from the game store 
  const { setLocalPlayer, addPlayer, removePlayer, addChatMessage, setActiveChatRoom, setConnectedUsers, setCurrentRoom, applyStatusBatch } = useGameStore.getState();

  // useEffect is used to initialize the game when the component mounts, by: 
  // rendering stage, setup input handling, connecting to the server, and setting up socket event listeners for game state updates
  useEffect(() => {
    const app = initRenderer(canvasRef.current);
    const stage = app.stage;
    initInput();
    fetchMapData().then((roomsData) => {
      stateRef.current.rooms = loadMap(stage, roomsData);
    });
    connect();
    emitJoin(playerName);

    // createPlayer is a helper function that creates a new Player instance, 
    // adds it to the PIXI stage, and stores it in the stateRef's players Map.
    const createPlayer = (uid, name, x, y, isLocal) => {
      const p = new Player(uid, name, x, y, isLocal);
      stage.addChild(p.container);
      stateRef.current.players.set(uid, p);
      return p;
    };

    //array that holds the unsubscribe functions for each socket event listener, so that we can clean them up when the component unmounts
    const unsubs = [];

    // The onWorldSnapshot event listener is called when the server sends a snapshot of the current world state, 
    // which includes the local player's ID and the positions of all players in the game.
    unsubs.push(onWorldSnapshot(({ userId, players }) => {
      // When a world snapshot is received, we first clear the existing players from the stage and the stateRef's players Map to ensure we have a clean slate before rendering the new state.
      stateRef.current.players.forEach((p) => p.destroy(stage));
      // clear the players Map to remove all existing player references, as we will be repopulating it with the new snapshot data from the server.
      stateRef.current.players.clear();


      // We then set the local player's ID in the stateRef and iterate through the players in the snapshot to create Player instances for each one.
      stateRef.current.localId = userId;
      for (const [uid, data] of Object.entries(players)) {
        const isLocal = uid === userId;
        createPlayer(uid, data.name, data.x, data.y, isLocal);
        // If the player in the snapshot is the local player, we update the localX and localY in the stateRef and set the local player's state in the game store.
        if (isLocal) {
          stateRef.current.localX = data.x;
          stateRef.current.localY = data.y;
          console.log('[Snapshot] localX:', data.x, 'localY:', data.y);
          setLocalPlayer({ userId, x: data.x, y: data.y, name: data.name });
        } 
        // If the player is a remote player, we add them to the game store's remotePlayers Map using the addPlayer function.
        else {
          addPlayer(uid, data);
        }
      }
    }));

    // The onPlayerJoined event listener is called when a new player joins the game
    // it creates a new Player instance for the new player and adds them to the game store.
    unsubs.push(onPlayerJoined(({ userId, x, y, name }) => {
      if (stateRef.current.players.has(userId)) return;
      createPlayer(userId, name, x, y, false);
      addPlayer(userId, { x, y, name });
    }));

    // The onPlayerLeft event listener is called when a player leaves the game, 
    // it removes the player's instance from the PIXI stage and the stateRef's players Map
    //  also removes them from the game store.
    unsubs.push(onPlayerLeft(({ userId }) => {
      const p = stateRef.current.players.get(userId);
      if (p) { p.destroy(stage); stateRef.current.players.delete(userId); }
      removePlayer(userId);
    }));

    // The onWorldState event listener is called when the server sends updated positions for all players in the game.
    unsubs.push(onWorldState(({ tick, players: snapshot }) => {
      if (tick <= stateRef.current.lastTick) return;
      stateRef.current.lastTick = tick;
      const { localId, players } = stateRef.current;
      for (const [uid, data] of Object.entries(snapshot)) {
        if (uid === localId) continue;
        let p = players.get(uid);
        if (!p) p = createPlayer(uid, data.name || 'Unknown', data.x, data.y, false);
        p.update(data.x, data.y);
      }
    }));

    unsubs.push(onInteractStart(({ roomId, members }) => {
      console.log('[Client] interact:start received', roomId, members);
      setActiveChatRoom(roomId);
      setConnectedUsers(members);
    }));

    unsubs.push(onInteractEnd(() => {
      setActiveChatRoom(null);
      setConnectedUsers([]);
    }));

    unsubs.push(onChatMessage((msg) => addChatMessage(msg)));
    unsubs.push(onChatHistory((msgs) => useGameStore.getState().setChatMessages(msgs)));
    unsubs.push(onLocationUpdate(({ userId, room }) => {
      if (userId === stateRef.current.localId) setCurrentRoom(room);
    }));
    unsubs.push(onStatusBatch((batch) => applyStatusBatch(batch)));

    // The app.ticker.add function is called on every frame of the game loop
    app.ticker.add(() => {
      const { localId, players } = stateRef.current;
      if (localId) {
        const { vx, vy } = getVelocity();
        const prevX = stateRef.current.localX;
        const prevY = stateRef.current.localY;
        stateRef.current.localX = clamp(prevX + vx, 0, MAP_BOUNDS.width);
        stateRef.current.localY = clamp(prevY + vy, 0, MAP_BOUNDS.height);
        if (stateRef.current.localX !== prevX || stateRef.current.localY !== prevY)
          emitMove(stateRef.current.localX, stateRef.current.localY);
        const lp = players.get(localId);
        if (lp) lp.update(stateRef.current.localX, stateRef.current.localY);
        applyCamera(stage, stateRef.current.localX, stateRef.current.localY);
      }
      players.forEach((p) => p.tick());
    });

    // The return function in useEffect is called when the component unmounts
    // it cleans up all the socket event listeners by calling the unsubscribe functions stored in the unsubs array
    // also destroys the PIXI application to free up resources.
    return () => {
      unsubs.forEach((u) => u());
      disconnect();
      app.destroy(false, { children: true });
    };
  }, []);

  return <canvas ref={canvasRef} className="block w-screen h-screen" />;
}
