import { useState, useEffect, useRef } from 'react';
import useGameStore from '../state/useGameStore';
import { emitChatMessage } from '../network/SocketClient';
import t from '../theme';

const fmt = (ts) => new Date(ts).toTimeString().slice(0, 5);

export default function ChatPanel() {
  const { chatMessages, activeChatRoom, clearChatMessages } = useGameStore();
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => { if (!activeChatRoom) clearChatMessages(); }, [activeChatRoom]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 60)
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  if (!activeChatRoom) return null;

  const send = () => {
    const text = input.trim();
    if (!text) return;
    emitChatMessage(activeChatRoom, text);
    setInput('');
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  return (
    <div className="fixed right-0 top-0 h-full w-72 flex flex-col"
      style={{
        background: t.panelBg,
        borderLeft: `1px solid ${t.border}`,
        fontFamily: t.font,
        animation: 'slideIn 200ms ease-out',
      }}>
      <style>{`@keyframes slideIn { from { transform: translateX(100%) } to { transform: translateX(0) } }`}</style>
      <div className="px-3 py-2 text-xs font-medium tracking-widest uppercase"
        style={{ color: t.textMuted, borderBottom: `1px solid ${t.border}` }}>
        Nearby Chat
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        {chatMessages.length === 0 && (
          <div className="text-xs text-center mt-6" style={{ color: t.textMuted }}>No messages yet</div>
        )}
        {chatMessages.map((msg, i) => (
          <div key={`${msg.timestamp}-${msg.from}-${i}`} className="text-xs leading-relaxed">
            <span className="font-medium mr-1" style={{ color: t.accent }}>{msg.name || msg.from.slice(0, 6)}</span>
            <span style={{ color: t.textSecondary }}>{msg.text}</span>
            <span className="ml-1" style={{ color: t.textMuted, fontSize: 10 }}>{fmt(msg.timestamp)}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="flex flex-col p-2 gap-1" style={{ borderTop: `1px solid ${t.border}` }}>
        {input.length > 400 && (
          <div className="text-xs text-right" style={{ color: 500 - input.length < 50 ? t.error : t.textMuted }}>
            {500 - input.length}
          </div>
        )}
        <div className="flex gap-1">
          <input
            className="flex-1 text-xs px-2 py-1.5 outline-none"
            style={{ background: t.bg, color: t.textPrimary, border: `1px solid ${t.border}`, borderRadius: 8, fontFamily: t.font }}
            value={input}
            maxLength={500}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Say something..."
          />
          <button className="text-xs px-3 py-1.5 font-medium"
            style={{ background: input.trim() ? t.accent : t.border, color: t.textPrimary, borderRadius: 8, opacity: input.trim() ? 1 : 0.5 }}
            disabled={!input.trim()}
            onClick={send}>Send</button>
        </div>
      </div>
    </div>
  );
}
