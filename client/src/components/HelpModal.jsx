import { useState, useEffect } from 'react';
import t from '../theme';

function Row({ k, v }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs px-2 py-0.5 font-mono"
        style={{ background: t.bg, border: `1px solid ${t.border}`, borderRadius: 6, color: t.textSecondary }}>{k}</span>
      <span className="text-xs" style={{ color: t.textSecondary }}>{v}</span>
    </div>
  );
}

export default function HelpModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  return (
    <>
      <button
        className="fixed top-3 right-3 w-7 h-7 rounded-full text-xs font-bold z-50 flex items-center justify-center"
        style={{ background: t.surface, color: t.textMuted, border: `1px solid ${t.border}` }}
        aria-label="Help"
        onClick={() => setOpen(true)}>?</button>

      {open && (
        <div className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: t.overlay }}
          role="dialog" aria-modal="true"
          onClick={() => setOpen(false)}>
          <div className="p-6 w-80 flex flex-col gap-4"
            style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 16, boxShadow: t.shadow, fontFamily: t.font }}
            onClick={(e) => e.stopPropagation()}>
            <div className="text-lg font-semibold" style={{ color: t.accent }}>Controls</div>
            <div className="flex flex-col gap-3">
              <Row k="W / ↑" v="Move up" />
              <Row k="S / ↓" v="Move down" />
              <Row k="A / ←" v="Move left" />
              <Row k="D / →" v="Move right" />
              <Row k="Click" v="Move to position" />
              <Row k="Scroll" v="Zoom in / out" />
              <Row k="L" v="Toggle debug overlay" />
              <Row k="Proximity" v="Walk near a player to chat" />
            </div>
            <button className="text-xs self-start mt-1" style={{ color: t.textMuted }} onClick={() => setOpen(false)}>Close</button>
          </div>
        </div>
      )}
    </>
  );
}
