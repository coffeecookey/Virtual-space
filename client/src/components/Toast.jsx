import { useEffect } from 'react';
import useGameStore from '../state/useGameStore';
import t from '../theme';

function ToastItem({ id, message }) {
  const removeToast = useGameStore((s) => s.removeToast);

  useEffect(() => {
    const timer = setTimeout(() => removeToast(id), 3000);
    return () => clearTimeout(timer);
  }, [id]);

  return (
    <div className="px-3 py-2 rounded text-xs pointer-events-none"
      style={{ background: t.surface, border: `1px solid ${t.border}`, color: t.textPrimary }}>
      {message}
    </div>
  );
}

export default function Toast() {
  const toasts = useGameStore((s) => s.toasts);
  if (!toasts.length) return null;

  return (
    <div role="status" aria-live="polite"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 flex flex-col gap-2 items-center z-50">
      {toasts.map((t) => <ToastItem key={t.id} id={t.id} message={t.message} />)}
    </div>
  );
}
