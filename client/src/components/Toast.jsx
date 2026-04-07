import { useEffect } from 'react';
import useGameStore from '../state/useGameStore';
import t from '../theme';

const BORDER = { join: t.success, leave: t.error, info: t.accent };

function ToastItem({ id, message, type = 'info' }) {
  const removeToast = useGameStore((s) => s.removeToast);
  useEffect(() => {
    const timer = setTimeout(() => removeToast(id), 3000);
    return () => clearTimeout(timer);
  }, [id]);

  return (
    <div className="flex items-center pointer-events-none overflow-hidden"
      style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, boxShadow: t.shadow, color: t.textPrimary, fontSize: 13 }}>
      <div style={{ width: 3, alignSelf: 'stretch', background: BORDER[type] ?? t.accent, borderRadius: '12px 0 0 12px', flexShrink: 0 }} />
      <span className="px-3 py-2">{message}</span>
    </div>
  );
}

export default function Toast() {
  const toasts = useGameStore((s) => s.toasts);
  if (!toasts.length) return null;
  return (
    <div role="status" aria-live="polite"
      className="fixed bottom-10 left-1/2 -translate-x-1/2 flex flex-col gap-2 items-center z-50">
      {toasts.map((toast) => <ToastItem key={toast.id} id={toast.id} message={toast.message} type={toast.type} />)}
    </div>
  );
}
