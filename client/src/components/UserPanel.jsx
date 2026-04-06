import { useState } from 'react';
import useGameStore from '../state/useGameStore';
import UserCard from './UserCard';
import t from '../theme';

export default function UserPanel() {
  const remotePlayers  = useGameStore((s) => s.remotePlayers);
  const playerStatuses = useGameStore((s) => s.playerStatuses);
  const localPlayer    = useGameStore((s) => s.localPlayer);
  const [selected, setSelected] = useState(null);

  return (
    <div className="fixed left-0 top-0 h-full w-48 flex flex-col"
      style={{ background: t.panelBg, borderRight: `1px solid ${t.border}`, fontFamily: t.font }}>
      <div className="px-3 py-2 flex items-center justify-between"
        style={{ borderBottom: `1px solid ${t.border}` }}>
        <span className="text-xs font-medium tracking-widest uppercase" style={{ color: t.textMuted }}>Players</span>
        <span className="text-xs font-bold px-1.5 py-0.5"
          style={{ background: t.border, color: t.textPrimary, borderRadius: 6 }}>
          {remotePlayers.size + (localPlayer ? 1 : 0)}
        </span>
      </div>

      {localPlayer && (
        <div className="flex items-center gap-2 px-3 py-2">
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: t.success, display: 'inline-block', flexShrink: 0 }} />
          <span className="text-xs font-medium truncate" style={{ color: t.textPrimary }}>{localPlayer.name}</span>
          <span className="text-xs" style={{ color: t.textMuted }}>(You)</span>
        </div>
      )}

      {[...remotePlayers.entries()].map(([uid, data]) => {
        const status = playerStatuses.get(uid) || 'online';
        const isAfk  = status === 'afk';
        return (
          <div key={uid}
            className="relative flex items-center gap-2 px-3 py-2 cursor-pointer mx-1 rounded"
            style={{ color: t.textPrimary }}
            onMouseEnter={e => e.currentTarget.style.background = t.surfaceHover}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            onClick={() => setSelected(selected === uid ? null : uid)}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: isAfk ? t.statusAfk : t.success, display: 'inline-block', flexShrink: 0 }} />
            <span className="text-xs truncate">{data.name}</span>
            {selected === uid && <UserCard userId={uid} onClose={() => setSelected(null)} />}
          </div>
        );
      })}
    </div>
  );
}
