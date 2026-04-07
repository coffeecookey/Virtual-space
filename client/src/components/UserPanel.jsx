import { useState } from 'react';
import useGameStore from '../state/useGameStore';
import UserCard from './UserCard';
import t from '../theme';

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
      style={{ borderRadius: 6 }}
      onMouseEnter={e => e.currentTarget.style.background = t.surfaceHover}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      onClick={() => !isLocal && onSelect(uid)}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{ width: 24, height: 24, overflow: 'hidden', borderRadius: 4 }}>
          <img
            src={`/sprites/${CHAR_FOLDERS[avatarId] || 'pink'}/static.png`}
            alt=""
            style={{ width: 24, height: 24, imageRendering: 'pixelated', display: 'block', objectFit: 'cover' }}
          />
        </div>
        <span style={{
          position: 'absolute', bottom: -1, right: -1,
          width: 7, height: 7, borderRadius: '50%',
          background: status === 'afk' ? t.statusAfk : t.statusOnline,
          border: `1.5px solid ${t.panelBg}`,
        }} />
      </div>
      <span className="flex-1 truncate" style={{ fontSize: 13, color: t.textPrimary }}>
        {name}{isLocal && <span style={{ color: t.textMuted, fontSize: 11 }}> (You)</span>}
      </span>
      {selected && <UserCard userId={uid} onClose={() => onSelect(null)} />}
    </div>
  );
}

export default function UserPanel() {
  const remotePlayers  = useGameStore((s) => s.remotePlayers);
  const playerStatuses = useGameStore((s) => s.playerStatuses);
  const currentRoom    = useGameStore((s) => s.currentRoom);
  const localPlayer    = useGameStore((s) => s.localPlayer);
  const playerRooms    = useGameStore((s) => s.playerRooms);
  const [selected, setSelected] = useState(null);

  const total = remotePlayers.size + (localPlayer ? 1 : 0);

  const groups = {};
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
    addToGroup(room, { uid, name: data.name, avatarId: data.avatarId || 1, status: playerStatuses.get(uid) || 'online', isLocal: false });
  }

  const groupEntries = Object.entries(groups);

  return (
    <div className="fixed left-0 top-0 h-full flex flex-col"
      style={{ width: 240, background: t.panelBg, borderRight: `1px solid ${t.border}`, fontFamily: t.font }}>

      {/* Server name header — Discord style */}
      <div className="px-4 flex items-center justify-between"
        style={{ height: 48, borderBottom: `1px solid ${t.border}`, boxShadow: '0 1px 0 rgba(0,0,0,0.3)', flexShrink: 0 }}>
        <span className="text-sm font-bold truncate" style={{ color: t.textPrimary }}>Virtual Cosmos</span>
        <span className="text-xs" style={{ color: t.textMuted }}>{total} online</span>
      </div>

      {/* Scrollable groups */}
      <div className="flex-1 overflow-y-auto py-2">
        {groupEntries.length === 0 && (
          <div className="px-3 py-4 text-xs" style={{ color: t.textMuted }}>No players online</div>
        )}
        {groupEntries.map(([roomName, users], gi) => (
          <div key={roomName} className={gi > 0 ? 'mt-4' : ''}>
            <div className="px-3 pt-1 pb-1 flex items-center justify-between"
              style={{ fontSize: 11, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
              <span>{roomName}</span>
              <span>{users.length}</span>
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
