import t from '../theme';

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 z-50"
      style={{ background: t.bg, fontFamily: t.font }}>
      <div className="text-2xl font-bold" style={{ color: t.accent }}>Virtual Cosmos</div>
      <div className="flex gap-1">
        {[0, 1, 2].map(i => (
          <div key={i} className="w-2 h-2 rounded-full animate-pulse"
            style={{ background: t.accent, animationDelay: `${i * 150}ms` }} />
        ))}
      </div>
      <div className="text-sm" style={{ color: t.textSecondary }}>Entering Cosmos...</div>
    </div>
  );
}
