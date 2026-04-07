const { getAll } = require('./WorldStateManager');
const { joinRoom, leaveRoom, getRoomForUser, stableRoomId } = require('./RoomManager');
const { getHistory, copyHistory } = require('./ChatManager');
const { rooms: mapData } = require('../world/mapData');

const CONNECT_DIST_SQ    = 150 ** 2;
const DISCONNECT_DIST_SQ = 195 ** 2;

const prevPairs  = new Set();
let   prevGroups = {}; // memberKey → Set<userId>

const pairKey  = (a, b)   => (a < b ? `${a}:${b}` : `${b}:${a}`);
const groupKey = (members) => [...members].sort().join(',');

const find = (parent, x) => {
  if (parent[x] !== x) parent[x] = find(parent, parent[x]);
  return parent[x];
};

const union = (parent, rank, a, b) => {
  const ra = find(parent, a), rb = find(parent, b);
  if (ra === rb) return;
  if (rank[ra] < rank[rb]) parent[ra] = rb;
  else if (rank[ra] > rank[rb]) parent[rb] = ra;
  else { parent[rb] = ra; rank[ra]++; }
};

const getLocationRoomId = (x, y) => {
  const room = mapData.find(r => x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height);
  return room ? room.id : null;
};

const runProximity = (io) => {
  const allPlayers = getAll();

  const ids = Object.keys(allPlayers).filter(id => {
    const p = allPlayers[id];
    return p && Number.isFinite(p.x) && Number.isFinite(p.y) && p.socketId;
  });

  if (ids.length < 2) return;

  const parent = {}, rank = {};
  ids.forEach(id => { parent[id] = id; rank[id] = 0; });

  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const a = ids[i], b = ids[j];
      const pa = allPlayers[a], pb = allPlayers[b];
      if (!pa || !pb) continue;
      const key = pairKey(a, b);
      const dx = pa.x - pb.x, dy = pa.y - pb.y;
      const distSq = dx * dx + dy * dy;
      const wasConnected = prevPairs.has(key);
      const threshold = wasConnected ? DISCONNECT_DIST_SQ : CONNECT_DIST_SQ;
      if (distSq < threshold) {
        union(parent, rank, a, b);
        if (!wasConnected) prevPairs.add(key);
      } else if (wasConnected) {
        prevPairs.delete(key);
      }
    }
  }

  const rootGroups = {};
  ids.forEach(id => {
    const root = find(parent, id);
    if (!rootGroups[root]) rootGroups[root] = new Set();
    rootGroups[root].add(id);
  });

  const currentGroups = {};
  for (const members of Object.values(rootGroups)) {
    if (members.size < 2) continue;
    const key = groupKey(members);
    currentGroups[key] = members;
  }

  // players no longer in any group → emit interact:end only to them
  for (const [gKey, members] of Object.entries(prevGroups)) {
    if (currentGroups[gKey]) continue; // group still exists unchanged
    members.forEach(uid => {
      // only emit interact:end if this uid is not in ANY current group
      const stillGrouped = Object.values(currentGroups).some(m => m.has(uid));
      if (!stillGrouped) {
        const roomId = getRoomForUser(uid);
        if (roomId) leaveRoom(io, uid, roomId);
        const s = allPlayers[uid]?.socketId;
        if (s) io.to(s).emit('interact:end');
      }
    });
  }

  // new/changed groups
  for (const [gKey, members] of Object.entries(currentGroups)) {
    const memberArr = [...members];
    const newRoomId = stableRoomId(memberArr);

    // copy history from any previous smaller/larger group any member was in
    if (!prevGroups[gKey]) {
      const seenRooms = new Set();
      memberArr.forEach(uid => {
        const oldRoom = getRoomForUser(uid);
        if (oldRoom && oldRoom !== newRoomId && !seenRooms.has(oldRoom)) {
          copyHistory(oldRoom, newRoomId);
          seenRooms.add(oldRoom);
        }
      });
    }

    const roomId = joinRoom(io, memberArr);
    const prev = prevGroups[gKey];
    memberArr.forEach(uid => {
      if (!prev || !prev.has(uid)) {
        const s = allPlayers[uid]?.socketId;
        if (s) {
          io.to(s).emit('interact:start', { roomId, members: memberArr });
          io.to(s).emit('chat:history', getHistory(roomId));
        }
      }
    });
  }

  prevGroups = currentGroups;

  ids.forEach(uid => {
    const p = allPlayers[uid];
    if (p) io.emit('location:update', { userId: uid, room: getLocationRoomId(p.x, p.y) });
  });
};

module.exports = { runProximity };
