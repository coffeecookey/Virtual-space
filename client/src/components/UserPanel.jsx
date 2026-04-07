import { useState } from 'react';
import useGameStore from '../state/useGameStore';
import UserCard from './UserCard';
import { getMapRooms } from '../core/MapLoader';
import t from '../theme';

const getRoomForPos = (x, y) => {
  const rooms = getMapRooms();
  if (!rooms.length) return 'Hallway';
  const r = rooms.find(r => x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height);
  return r ? r.name : 'Hallway';
};

const CHAR_FOLDERS = { 1: 'pink', 2: 'owl', 3: 'dude' };

function StatusDot({ status }) {
  return (
    <span style={{
      width: 7, height: 7, borderRadius: '50%', flexShrink: 0, display: 'inline-block',
      background: status === 'afk' ? t.statusAfk : t.statusOnline,
    }} />
  );
}

function UserRow({ uid, name, avatarId, status, isLocal, selected, onSelect }) {
  return (
    <div className="relative flex items-center gap-2 px-3 py-1.5 cursor-pointer mx-1"
      style={{ borderRadius: 8 }}
      onMouseEnter={e => e.currentTarget.style.background = t.surfaceHover}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      onClick={() => !isLocal && onSelect(uid)}>
      <div style={{ width: 24, height: 24, flexShrink: 0, overflow: 'hidden', borderRadius: 3 }}>
        <img
          src={`/sprites/${CHAR_FOLDERS[avatarId] || 'pink'}/static.png`}
          alt=""
          style={{ width: 24, height: 24, imageRendering: 'pixelated', display: 'block', objectFit: 'cover' }}
        />
      </div>
      <span className="flex-1 truncate" style={{ fontSize: 13, color: t.textPrimary }}>
        {name}{isLocal && <span style={{ color: t.textMuted, fontSize: 11 }}> (You)</span>}
      </span>
      <StatusDot status={status} />
      {selected && <UserCard userId={uid} onClose={() => onSelect(null)} />}
    </div>
  );
}

export default function UserPanel() {
  const remotePlayers  = useGameStore((s) => s.remotePlayers);
  const playerStatuses = useGameStore((s) => s.playerStatuses);
  const currentRoom    = useGameStore((s) => s.currentRoom);
  const localPlayer    = useGameStore((s) => s.localPlayer);
  const [selected, setSelected] = useState(null);

  const total = remotePlayers.size + (localPlayer ? 1 : 0);

  // Build room groups
  const groups = {}; // roomName → [{ uid, name, avatarId, status, isLocal }]
  const addToGroup = (roomName, entry) => {
    if (!groups[roomName]) groups[roomName] = [];
    groups[roomName].push(entry);
  };

  if (localPlayer) {
    const room = currentRoom || 'Hallway';
    addToGroup(room, { uid: localPlayer.userId, name: localPlayer.name, avatarId: localPlayer.avatarId || 1, status: 'online', isLocal: true });
  }
  for (const [uid, data] of remotePlayers.entries()) {
    const room = playerRooms.get(uid) || 'Hallway';
    console.log('[UserPanel] user:', data.name, 'avatarId:', data.avatarId);
    addToGroup(room, { uid, name: data.name, avatarId: data.avatarId || 1, status: playerStatuses.get(uid) || 'online', isLocal: false });
  }

  const groupEntries = Object.entries(groups);

  return (
    <div className="fixed left-0 top-0 h-full w-48 flex flex-col"
      style={{ background: t.panelBg, borderRight: `1px solid ${t.border}`, fontFamily: t.font }}>

      {/* Panel header */}
      <div className="px-3 py-2" style={{ borderBottom: `1px solid ${t.border}` }}>
        <span style={{ fontSize: 11, color: t.textMuted, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>
          Online — {total}
        </span>
      </div>

      {/* Scrollable groups */}
      <div className="flex-1 overflow-y-auto py-1">
        {groupEntries.length === 0 && (
          <div className="px-3 py-4 text-xs" style={{ color: t.textMuted }}>No players online</div>
        )}
        {groupEntries.map(([roomName, users], gi) => (
          <div key={roomName}>
            {gi > 0 && <div style={{ height: 1, background: t.border, margin: '4px 12px' }} />}
            <div className="px-3 pt-3 pb-1"
              style={{ fontSize: 11, color: t.textMuted, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>
              {roomName} — {users.length}
            </div>
            {users.map(({ uid, name, avatarId, status, isLocal }) => (
              <UserRow
                key={uid}
                uid={uid}
                name={name}
                avatarId={avatarId}
                status={status}
                isLocal={isLocal}
                selected={selected === uid}
                onSelect={(id) => setSelected(selected === id ? null : id)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
