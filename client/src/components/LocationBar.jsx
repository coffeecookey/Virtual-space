import useGameStore from '../state/useGameStore';

export default function LocationBar() {
  const currentRoom = useGameStore((s) => s.currentRoom);
  return (
    <div className="fixed bottom-0 left-0 right-0 px-4 py-1 text-xs flex items-center gap-2"
      style={{ background: 'rgba(10,10,26,0.85)', borderTop: '1px solid #3344aa', color: '#8899ff' }}>
      📍 {currentRoom ? `Room: ${currentRoom}` : 'Outside'}
    </div>
  );
}
