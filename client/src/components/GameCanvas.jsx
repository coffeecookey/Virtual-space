import { useEffect, useRef } from 'react';
import { initRenderer, destroyRenderer } from '../core/Renderer';
import { initInput, getVelocity, setMoveTarget, isDebugMode } from '../core/InputHandler';
import * as PIXI from 'pixi.js';
import { fetchMapData, loadMap, getObstacles } from '../core/MapLoader';
import { applyCamera, destroyCamera } from '../core/Camera';
import Player from '../entities/Player';
import { preloadAll } from '../core/SpriteLoader';
import useGameStore from '../state/useGameStore';
import {
  connect, emitJoin, emitMove, disconnect,
  onWorldSnapshot, onWorldState, onPlayerJoined, onPlayerLeft,
  onInteractStart, onInteractEnd, onChatMessage, onChatHistory,
  onLocationUpdate, onStatusBatch, onReconnect, onDisconnect,
} from '../network/SocketClient';
const MAP_BOUNDS = { width: 2000, height: 1500 };
const LABEL_FADE_START = 180;
const LABEL_FADE_END = 280;
const PLAYER_RADIUS = 24;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.0;
let zoom = 1.0;

const collidesWithObstacles = (x, y) => {
  for (const obs of getObstacles()) {
    const cx = Math.min(Math.max(x, obs.x), obs.x + obs.width);
    const cy = Math.min(Math.max(y, obs.y), obs.y + obs.height);
    const dx = x - cx, dy = y - cy;
    if (dx * dx + dy * dy < PLAYER_RADIUS * PLAYER_RADIUS) return true;
  }
  return false;
};

// clamp is a utility function that restricts a value v to be within the range defined by min and max.
// It uses Math.min and Math.max to ensure that v does not go below min or above max, effectively clamping it within the specified range.
const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

// GameCanvas is the main component responsible for rendering the game canvas and managing the game state for the local player and remote players.
export default function GameCanvas({ playerName, avatarId = 1, onReady, hidden }) {
  const canvasRef = useRef(null);

  // stateRef is a mutable reference that holds the current state of the game, 
  // including the local player's ID, a Map of all players, and the local player's current x and y coordinates.
  const stateRef = useRef({ localId: null, players: new Map(), localX: 0, localY: 0, lastTick: -1, rooms: [], spritesReady: false });

  // We extract the setLocalPlayer, addPlayer, and removePlayer functions from the game store 
  const { setLocalPlayer, addPlayer, removePlayer, addChatMessage, setActiveChatRoom, setConnectedUsers, setCurrentRoom, applyStatusBatch, addToast, setPlayerRooms } = useGameStore.getState();

  // useEffect is used to initialize the game when the component mounts, by: 
  // rendering stage, setup input handling, connecting to the server, and setting up socket event listeners for game state updates
  useEffect(() => {
    const app = initRenderer(canvasRef.current);
    const stage = app.stage;
    stage.eventMode = 'static';
    stage.hitArea = new PIXI.Rectangle(0, 0, MAP_BOUNDS.width, MAP_BOUNDS.height);
    stage.on('pointerdown', (e) => {
      const pos = e.getLocalPosition(stage);
      setMoveTarget(pos.x, pos.y);
    });

    const onWheel = (e) => {
      e.preventDefault();
      zoom = Math.min(Math.max(zoom * (e.deltaY < 0 ? 1.1 : 0.9), MIN_ZOOM), MAX_ZOOM);
    };
    canvasRef.current.addEventListener('wheel', onWheel, { passive: false });
    initInput();
    connect();
    preloadAll().then(() => {
      stateRef.current.spritesReady = true;
      emitJoin(playerName, avatarId);
    });
    const debugLayer = new PIXI.Container();
    debugLayer.visible = false;
    const dbgPlayerText = new PIXI.Text('', { fontSize: 12, fill: 0xffffff });
    dbgPlayerText.x = 10; dbgPlayerText.y = 10;
    const dbgMouseText  = new PIXI.Text('', { fontSize: 12, fill: 0xffffff });
    debugLayer.addChild(dbgPlayerText, dbgMouseText);

    const mouseWorld = { x: 0, y: 0 };
    stage.on('pointermove', (e) => {
      const p = e.getLocalPosition(stage);
      mouseWorld.x = p.x; mouseWorld.y = p.y;
    });

    fetchMapData().then((r) => loadMap(stage, r)).then((rooms) => {
      stateRef.current.rooms = rooms;

      const dbgGraphics = new PIXI.Graphics();
      getObstacles().forEach((obs) => {
        dbgGraphics.lineStyle(1, 0xff0000, 1);
        dbgGraphics.beginFill(0xff0000, 0.3);
        dbgGraphics.drawRect(obs.x, obs.y, obs.width, obs.height);
        dbgGraphics.endFill();
      });
      rooms.forEach((r) => {
        dbgGraphics.lineStyle(1, 0x00ff00, 1);
        dbgGraphics.beginFill(0x00ff00, 0.2);
        dbgGraphics.drawRect(r.x, r.y, r.width, r.height);
        dbgGraphics.endFill();
      });
      debugLayer.addChildAt(dbgGraphics, 0);
      stage.addChild(debugLayer);
    });
    const createPlayer = (uid, name, x, y, isLocal, aid = 1) => {
      console.log('[Create] player:', uid, 'avatarId:', aid);
      const p = new Player(uid, name, x, y, isLocal, aid);
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
      console.log('[Snapshot] received players:', Object.values(players).map(p => ({ name: p.name, avatarId: p.avatarId })));
      for (const [uid, data] of Object.entries(players)) {
        const isLocal = uid === userId;
        createPlayer(uid, data.name, data.x, data.y, isLocal, isLocal ? avatarId : (data.avatarId || 1));
        // If the player in the snapshot is the local player, we update the localX and localY in the stateRef and set the local player's state in the game store.
        if (isLocal) {
          stateRef.current.localX = data.x;
          stateRef.current.localY = data.y;
          setLocalPlayer({ userId, x: data.x, y: data.y, name: data.name, avatarId });
          onReady?.();
        } 
        // If the player is a remote player, we add them to the game store's remotePlayers Map using the addPlayer function.
        else {
          addPlayer(uid, data);
        }
      }
    }));

    // The onPlayerJoined event listener is called when a new player joins the game
    // it creates a new Player instance for the new player and adds them to the game store.
    unsubs.push(onPlayerJoined(({ userId, x, y, name, avatarId: aid }) => {
      if (stateRef.current.players.has(userId)) return;
      createPlayer(userId, name, x, y, false, aid || 1);
      addPlayer(userId, { x, y, name, avatarId: aid || 1 });
      console.log('[Join] stored avatarId:', aid, 'for', name);
      addToast({ message: `${name} joined the cosmos`, type: 'join' });
    }));

    // The onPlayerLeft event listener is called when a player leaves the game, 
    // it removes the player's instance from the PIXI stage and the stateRef's players Map
    //  also removes them from the game store.
    unsubs.push(onPlayerLeft(({ userId }) => {
      const p = stateRef.current.players.get(userId);
      const name = useGameStore.getState().remotePlayers.get(userId)?.name || 'Someone';
      if (p) { p.fadeOut(stage); stateRef.current.players.delete(userId); }
      removePlayer(userId);
      addToast({ message: `${name} left the cosmos`, type: 'leave' });
    }));

    // The onWorldState event listener is called when the server sends updated positions for all players in the game.
    unsubs.push(onWorldState(({ tick, players: snapshot }) => {
      if (tick <= stateRef.current.lastTick) return;
      stateRef.current.lastTick = tick;
      const { localId, players } = stateRef.current;
      for (const [uid, data] of Object.entries(snapshot)) {
        if (uid === localId) continue;
        let p = players.get(uid);
        if (!p) {
          if (!stateRef.current.spritesReady) continue;
          p = createPlayer(uid, data.name || 'Unknown', data.x, data.y, false, data.avatarId || 1);
        }
        p.update(data.x, data.y);
        useGameStore.getState().updatePlayerPosition(uid, data.x, data.y);
      }
    }));

    unsubs.push(onInteractStart(({ roomId, members }) => {
      setActiveChatRoom(roomId);
      setConnectedUsers(members);
      const others = members.filter(id => id !== stateRef.current.localId);
      const remotePlayers = useGameStore.getState().remotePlayers;
      const names = others.map(id => remotePlayers.get(id)?.name || 'Someone');
      const label = names.length === 1 ? names[0] : `${names[0]} +${names.length - 1}`;
      addToast({ message: `${label} is nearby`, type: 'join' });
    }));

    unsubs.push(onInteractEnd(() => {
      setActiveChatRoom(null);
      setConnectedUsers([]);
      addToast({ message: 'Moved out of range', type: 'leave' });
    }));

    unsubs.push(onChatMessage((msg) => addChatMessage(msg)));
    unsubs.push(onChatHistory((msgs) => useGameStore.getState().setChatMessages(msgs)));
    unsubs.push(onLocationUpdate(({ userId, room }) => {
      console.log('[Location]', userId, room);  // ← add here
      if (userId === stateRef.current.localId) setCurrentRoom(room);
      const prev = useGameStore.getState().playerRooms;
      const next = new Map(prev);
      next.set(userId, room);
      setPlayerRooms(next);
    }));
    unsubs.push(onStatusBatch((batch) => applyStatusBatch(batch)));

    unsubs.push(onDisconnect(() => addToast('Connection lost. Reconnecting…')));
    unsubs.push(onReconnect(() => {
      addToast('Reconnected');
      emitJoin(playerName, avatarId);
    }));

    app.ticker.add(() => {
      const debug = isDebugMode();
      debugLayer.visible = debug;
      if (debug) {
        dbgPlayerText.text = `Player: (${Math.round(stateRef.current.localX)}, ${Math.round(stateRef.current.localY)})`;
        dbgMouseText.text  = `Mouse: (${Math.round(mouseWorld.x)}, ${Math.round(mouseWorld.y)})`;
        dbgMouseText.x = mouseWorld.x + 12;
        dbgMouseText.y = mouseWorld.y - 16;
      }

      const { localId, players } = stateRef.current;

      if (localId) {
        const prevX = stateRef.current.localX;
        const prevY = stateRef.current.localY;
        const { vx, vy } = getVelocity(prevX, prevY);
        const nextX = clamp(prevX + vx, 0, MAP_BOUNDS.width);
        const nextY = clamp(prevY + vy, 0, MAP_BOUNDS.height);
        const blocked = collidesWithObstacles(nextX, nextY);
        stateRef.current.localX = blocked ? prevX : nextX;
        stateRef.current.localY = blocked ? prevY : nextY;
        if (stateRef.current.localX !== prevX || stateRef.current.localY !== prevY)
          emitMove(stateRef.current.localX, stateRef.current.localY);
        useGameStore.getState().setLocalCoords(stateRef.current.localX, stateRef.current.localY);
        const lp = players.get(localId);
        if (lp) {
          lp.update(stateRef.current.localX, stateRef.current.localY);
          const speed = Math.sqrt(vx * vx + vy * vy);
          lp.setState(speed < 0.5 ? 'idle' : speed < 4 ? 'walk' : 'run');
          lp.setDirection(vx);
        }
        applyCamera(stage, stateRef.current.localX, stateRef.current.localY, zoom);

        const lx = stateRef.current.localX;
        const ly = stateRef.current.localY;
        players.forEach((p) => {
          if (p.isLocal) return;
          const dx = p.container.x - lx;
          const dy = p.container.y - ly;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // label opacity: fade in as remote player approaches
          const labelAlpha = dist < LABEL_FADE_START ? 1
            : dist > LABEL_FADE_END ? 0
            : 1 - (dist - LABEL_FADE_START) / (LABEL_FADE_END - LABEL_FADE_START);
          p.setLabelOpacity(labelAlpha);

        });
      }

      players.forEach((p) => p.tick());
    });

    // The return function in useEffect is called when the component unmounts
    // it cleans up all the socket event listeners by calling the unsubscribe functions stored in the unsubs array
    // also destroys the PIXI application to free up resources.
    return () => {
      canvasRef.current?.removeEventListener('wheel', onWheel);
      unsubs.forEach((u) => u());
      disconnect();
      destroyCamera();
      destroyRenderer();
      app.destroy(false, { children: true });
    };
  }, []);

  return <canvas ref={canvasRef} className="block w-screen h-screen" style={hidden ? { visibility: 'hidden' } : {}} />;
}
