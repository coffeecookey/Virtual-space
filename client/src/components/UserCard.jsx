import useGameStore from '../state/useGameStore';

export default function UserCard({ userId, onClose }) {
  const player = useGameStore((s) => s.remotePlayers.get(userId));
  const status = useGameStore((s) => s.playerStatuses.get(userId) || 'online');

  if (!player) return null;

  return (
    <div className="absolute left-56 top-0 w-44 rounded p-3 text-xs z-50"
      style={{ background: '#111133', border: '1px solid #3344aa', color: '#ccc' }}>
      <div className="font-bold mb-1" style={{ color: '#fff' }}>{player.name}</div>
      <div className="flex items-center gap-1">
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: status === 'afk' ? '#888' : '#00d4ff', display: 'inline-block' }} />
        {status}
      </div>
      <button className="mt-2 text-xs" style={{ color: '#8899ff' }} onClick={onClose}>close</button>
    </div>
  );
}
