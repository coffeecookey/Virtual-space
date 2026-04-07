import { useState, useEffect, useRef } from 'react';
import useGameStore from '../state/useGameStore';
import HelpModal from './HelpModal';
import t from '../theme';

const CHAR_FOLDERS = { 1: 'pink', 2: 'owl', 3: 'dude' };

export default function LocationBar() {
  const currentRoom = useGameStore((s) => s.currentRoom);
  const localPlayer = useGameStore((s) => s.localPlayer);
  const coordsRef = useRef(null);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    return useGameStore.subscribe((s) => {
      const { x, y } = s.localCoords;
      if (coordsRef.current)
        coordsRef.current.textContent = `${Math.round(x)}, ${Math.round(y)}`;
    });
  }, []);

  useEffect(() => {
    if (!helpOpen) return;
    const handler = (e) => { if (e.key === 'Escape') setHelpOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [helpOpen]);

  const roomDisplay = currentRoom
    ? currentRoom.charAt(0).toUpperCase() + currentRoom.slice(1)
    : 'Hallway';

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 flex items-center px-3"
        style={{ background: t.surface, borderTop: `1px solid ${t.border}`, fontFamily: t.font, height: 36 }}>

        {localPlayer && (
          <div className="flex items-center gap-2">
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <img
                src={`/sprites/${CHAR_FOLDERS[localPlayer.avatarId] || 'pink'}/static.png`}
                alt=""
                style={{ width: 20, height: 20, imageRendering: 'pixelated', borderRadius: 4, display: 'block' }}
              />
              <span style={{
                position: 'absolute', bottom: -1, right: -1,
                width: 7, height: 7, borderRadius: '50%',
                background: t.statusOnline, border: `1.5px solid ${t.surface}`,
              }} />
            </div>
            <span className="text-xs font-medium" style={{ color: t.textPrimary, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {localPlayer.name}
            </span>
          </div>
        )}

        <div className="flex-1" />

        <div className="flex items-center gap-3 text-xs">
          <span style={{ color: t.accent }}>⬡</span>
          <span style={{ color: t.textMuted }}>{roomDisplay}</span>
          <span style={{ color: t.border }}>·</span>
          <span ref={coordsRef} style={{ color: t.textMuted, fontVariantNumeric: 'tabular-nums' }}>0, 0</span>
          <button
            onClick={() => setHelpOpen(true)}
            aria-label="Help"
            style={{
              width: 18, height: 18, borderRadius: '50%', background: t.surfaceHover,
              color: t.textMuted, fontSize: 11, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `1px solid ${t.border}`, lineHeight: 1, flexShrink: 0,
            }}>?</button>
        </div>
      </div>
      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </>
  );
}
