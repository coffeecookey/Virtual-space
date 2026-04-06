import { useState } from 'react';
import t from '../theme';

const CHARS = [
  { id: 1, folder: 'pink',  label: 'Pink' },
  { id: 2, folder: 'owl',   label: 'Owl'  },
  { id: 3, folder: 'dude',  label: 'Dude' },
];

export default function NamePrompt({ onSubmit }) {
  const [name, setName] = useState('');
  const [avatarId, setAvatarId] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const submit = () => {
    if (submitting) return;
    const n = name.trim();
    if (!n) return;
    setSubmitting(true);
    console.log('[Name] submitting:', n, avatarId);
    onSubmit({ name: n, avatarId });
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center"
      style={{ background: t.bg, fontFamily: t.font }}>
      <div className="flex flex-col gap-5 p-8 w-80"
        style={{ background: t.surface, borderRadius: 16, border: `1px solid ${t.border}`, boxShadow: t.shadow }}>
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: t.accent }}>Virtual Cosmos</h1>
          <p className="text-xs" style={{ color: t.textMuted }}>Choose your character and name</p>
        </div>

        <div className="flex justify-between gap-2">
          {CHARS.map(({ id, folder, label }) => (
            <div key={id} className="flex flex-col items-center gap-1 cursor-pointer flex-1"
              onClick={() => setAvatarId(id)}>
              <div className="p-2 rounded-lg flex items-center justify-center"
                style={{
                  border: `2px solid ${avatarId === id ? t.accent : t.border}`,
                  background: avatarId === id ? t.surfaceHover : 'transparent',
                  imageRendering: 'pixelated',
                }}>
                <img
                  src={`/sprites/${folder}/static.png`}
                  alt={label}
                  style={{ width: 48, height: 48, imageRendering: 'pixelated' }}
                />
              </div>
              <span className="text-xs" style={{ color: avatarId === id ? t.accent : t.textMuted }}>{label}</span>
            </div>
          ))}
        </div>

        <input
          className="px-3 py-2 text-sm outline-none w-full"
          style={{ background: t.bg, color: t.textPrimary, border: `1px solid ${t.border}`, borderRadius: 8, fontFamily: t.font }}
          placeholder="Your name..."
          maxLength={20}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.isComposing) return; if (e.key === 'Enter') submit(); }}
          autoFocus
        />
        <button
          className="py-2 text-sm font-medium"
          style={{
            background: name.trim() && !submitting ? t.accent : t.border,
            color: t.bg,
            borderRadius: 8,
            opacity: name.trim() && !submitting ? 1 : 0.5,
            cursor: name.trim() && !submitting ? 'pointer' : 'default',
            fontFamily: t.font,
          }}
          disabled={!name.trim() || submitting}
          onClick={submit}
        >{submitting ? 'Joining...' : 'Enter'}</button>
      </div>
    </div>
  );
}
