import { useState } from 'react';
import useGameStore from '../state/useGameStore';
import UserCard from './UserCard';

export default function UserPanel() {
  const remotePlayers = useGameStore((s) => s.remotePlayers);
  const playerStatuses = useGameStore((s) => s.playerStatuses);
  const localPlayer = useGameStore((s) => s.localPlayer);
  const [selected, setSelected] = useState(null);

  const players = [...remotePlayers.entries()];

  return (
    <div className="fixed left-0 top-0 h-full w-48 flex flex-col text-xs"
      style={{ background: 'rgba(10,10,26,0.9)', borderRight: '1px solid #3344aa' }}>
      <div className="p-2" style={{ color: '#8899ff', borderBottom: '1px solid #3344aa' }}>Players Online</div>

      {localPlayer && (
        <div className="flex items-center gap-2 px-3 py-1" style={{ color: '#00d4ff' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#00d4ff', display: 'inline-block' }} />
          {localPlayer.name} (You)
        </div>
      )}

      {players.map(([uid, data]) => {
        const status = playerStatuses.get(uid) || 'online';
        return (
          <div key={uid} className="relative flex items-center gap-2 px-3 py-1 cursor-pointer hover:bg-white/5"
            style={{ color: '#ccc' }} onClick={() => setSelected(selected === uid ? null : uid)}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: status === 'afk' ? '#888' : '#ff6b6b', display: 'inline-block' }} />
            {data.name}
            {selected === uid && <UserCard userId={uid} onClose={() => setSelected(null)} />}
          </div>
        );
      })}
    </div>
  );
}
