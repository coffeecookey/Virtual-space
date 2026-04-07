import { useState, useEffect, useRef } from 'react';
import useGameStore from '../state/useGameStore';
import { emitChatMessage } from '../network/SocketClient';
import t from '../theme';

const fmt = (ts) => new Date(ts).toTimeString().slice(0, 5);
const FIVE_MIN = 5 * 60 * 1000;

let _collapsed = false;

export default function ChatPanel() {
  const { chatMessages, activeChatRoom, clearChatMessages } = useGameStore();
  const connectedUsers = useGameStore((s) => s.connectedUsers);
  const [input, setInput] = useState('');
  const [collapsed, setCollapsed] = useState(_collapsed);
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

  const toggle = () => {
    const next = !collapsed;
    _collapsed = next;
    setCollapsed(next);
  };

  const send = () => {
    const text = input.trim();
    if (!text) return;
    emitChatMessage(activeChatRoom, text);
    setInput('');
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  const grouped = chatMessages.map((msg, i) => {
    const prev = chatMessages[i - 1];
    const isGrouped = prev && prev.from === msg.from && (msg.timestamp - prev.timestamp) < FIVE_MIN;
    return { ...msg, isGrouped };
  });

  return (
    <div style={{
      position: 'fixed', right: 0, top: 0, height: '100%',
      display: 'flex', alignItems: 'stretch',
      transform: collapsed ? 'translateX(288px)' : 'translateX(0)',
      transition: 'transform 200ms ease-out',
      fontFamily: t.font,
    }}>
      {/* Collapse tab */}
      <button
        onClick={toggle}
        aria-label={collapsed ? 'Expand chat' : 'Collapse chat'}
        style={{
          width: 24, height: 40, flexShrink: 0, alignSelf: 'center',
          background: t.surface, border: `1px solid ${t.border}`, borderRight: 'none',
          borderRadius: '6px 0 0 6px', color: t.textMuted, fontSize: 14,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
        {collapsed ? '‹' : '›'}
      </button>

      {/* Panel */}
      <div className="flex flex-col" style={{ width: 288, background: t.panelBg, borderLeft: `1px solid ${t.border}` }}>

        {/* Header — Discord channel style */}
        <div className="px-3 flex items-center gap-2"
          style={{ height: 48, borderBottom: `1px solid ${t.border}`, boxShadow: '0 1px 0 rgba(0,0,0,0.3)', flexShrink: 0 }}>
          <span style={{ fontSize: 18, color: t.textMuted, lineHeight: 1 }}>#</span>
          <span className="text-sm font-semibold" style={{ color: t.textPrimary }}>nearby</span>
          {connectedUsers.length > 0 && (
            <span className="ml-auto text-xs" style={{ color: t.textMuted }}>{connectedUsers.length} online</span>
          )}
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2">
          {grouped.length === 0 && (
            <div className="text-xs text-center mt-6" style={{ color: t.textMuted }}>No messages yet</div>
          )}
          {grouped.map((msg, i) => (
            <div key={`${msg.timestamp}-${msg.from}-${i}`} style={{ marginTop: msg.isGrouped ? 2 : 16 }}>
              {!msg.isGrouped && (
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className="text-sm font-semibold" style={{ color: t.accent }}>
                    {msg.name || msg.from.slice(0, 6)}
                  </span>
                  <span style={{ color: t.textMuted, fontSize: 10 }}>{fmt(msg.timestamp)}</span>
                </div>
              )}
              <div className="text-sm leading-relaxed" style={{ color: t.textSecondary }}>
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-3" style={{ borderTop: `1px solid ${t.border}` }}>
          {input.length > 400 && (
            <div className="text-xs text-right mb-1" style={{ color: 500 - input.length < 50 ? t.error : t.textMuted }}>
              {500 - input.length}
            </div>
          )}
          <input
            className="w-full text-sm px-3 py-2 outline-none"
            style={{
              background: t.bg, color: t.textPrimary,
              border: `1px solid ${t.border}`, borderRadius: 8,
              fontFamily: t.font,
            }}
            value={input}
            maxLength={500}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Message #proximity-chat"
          />
        </div>
      </div>
    </div>
  );
}
