import { useEffect, useRef } from 'react';
import { initRenderer } from '../core/Renderer';
import { initInput, getVelocity } from '../core/InputHandler';
import Player from '../entities/Player';
import useGameStore from '../state/useGameStore';
import {
  connect, emitJoin, emitMove,
  onWorldSnapshot, onWorldState, onPlayerJoined, onPlayerLeft,
} from '../network/SocketClient';
import { MAP_BOUNDS } from '../../../server/src/config/constants';

// clamp is a utility function that restricts a value v to be within the range defined by min and max.
const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

export default function GameCanvas({ playerName }) {
  const canvasRef = useRef(null);
  const stateRef = useRef({ localId: null, players: new Map(), localX: 0, localY: 0 });
  const { setLocalPlayer, addPlayer, removePlayer } = useGameStore.getState();

  useEffect(() => {
    const app = initRenderer(canvasRef.current);
    const stage = app.stage;
    initInput();
    connect();
    emitJoin(playerName);

    const createPlayer = (uid, name, x, y, isLocal) => {
      const p = new Player(uid, name, x, y, isLocal);
      stage.addChild(p.container);
      stateRef.current.players.set(uid, p);
      return p;
    };

    const unsubs = [];

    unsubs.push(onWorldSnapshot(({ userId, players }) => {
      stateRef.current.players.forEach((p) => p.destroy(stage));
      stateRef.current.players.clear();

      stateRef.current.localId = userId;
      for (const [uid, data] of Object.entries(players)) {
        const isLocal = uid === userId;
        createPlayer(uid, data.name, data.x, data.y, isLocal);
        if (isLocal) {
          stateRef.current.localX = data.x;
          stateRef.current.localY = data.y;
          setLocalPlayer({ userId, x: data.x, y: data.y, name: data.name });
        } else {
          addPlayer(uid, data);
        }
      }
    }));

    unsubs.push(onPlayerJoined(({ userId, x, y, name }) => {
      if (stateRef.current.players.has(userId)) return;
      createPlayer(userId, name, x, y, false);
      addPlayer(userId, { x, y, name });
    }));

    unsubs.push(onPlayerLeft(({ userId }) => {
      const p = stateRef.current.players.get(userId);
      if (p) { p.destroy(stage); stateRef.current.players.delete(userId); }
      removePlayer(userId);
    }));

    unsubs.push(onWorldState((snapshot) => {
      const { localId, players } = stateRef.current;
      for (const [uid, data] of Object.entries(snapshot)) {
        if (uid === localId) continue;
        let p = players.get(uid);
        if (!p) p = createPlayer(uid, data.name || 'Unknown', data.x, data.y, false);
        p.update(data.x, data.y);
      }
    }));

    app.ticker.add(() => {
      const { localId, players } = stateRef.current;
      if (localId) {
        const { vx, vy } = getVelocity();
        stateRef.current.localX = clamp(stateRef.current.localX + vx, 0, MAP_BOUNDS.width);
        stateRef.current.localY = clamp(stateRef.current.localY + vy, 0, MAP_BOUNDS.height);
        emitMove(stateRef.current.localX, stateRef.current.localY);
        const lp = players.get(localId);
        if (lp) lp.update(stateRef.current.localX, stateRef.current.localY);
      }
      players.forEach((p) => p.tick());
    });

    return () => {
      unsubs.forEach((u) => u());
      app.destroy(false, { children: true });
    };
  }, []);

  return <canvas ref={canvasRef} className="block w-screen h-screen" />;
}
