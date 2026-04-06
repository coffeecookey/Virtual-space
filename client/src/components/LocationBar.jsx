import { useEffect, useRef } from 'react';
import useGameStore from '../state/useGameStore';
import t from '../theme';

export default function LocationBar() {
  const currentRoom = useGameStore((s) => s.currentRoom);
  const coordsRef   = useRef(null);

  useEffect(() => {
    return useGameStore.subscribe((s) => {
      const { x, y } = s.localCoords;
      if (coordsRef.current)
        coordsRef.current.textContent = `${Math.round(x)}, ${Math.round(y)}`;
    });
  }, []);

  return (
    <div className="fixed bottom-0 left-0 right-0 px-4 py-1.5 flex items-center gap-3 text-xs"
      style={{ background: t.surface, borderTop: `1px solid ${t.border}`, fontFamily: t.font }}>
      <span style={{ color: t.accent }}>⬡</span>
      <span style={{ color: t.textMuted }}>{currentRoom ? currentRoom.charAt(0).toUpperCase() + currentRoom.slice(1) : 'Outside'}</span>
      <span style={{ color: t.border }}>·</span>
      <span ref={coordsRef} style={{ color: t.textMuted, fontVariantNumeric: 'tabular-nums' }}>0, 0</span>
    </div>
  );
}
