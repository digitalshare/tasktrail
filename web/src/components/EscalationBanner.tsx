import { useApp } from "../lib/store";
import { dismissBanner } from "../voice/tools";

export function EscalationBanner() {
  const banner = useApp((s) => s.banner);
  if (!banner) return null;
  return (
    <div className="slide-down absolute inset-x-3 top-12 z-30">
      <div className="flex items-start gap-3 rounded-2xl bg-red-500/95 p-3 text-white shadow-xl ring-1 ring-red-300/50">
        <span className="text-lg">⚠️</span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold">Hazard escalated to supervisor</div>
          <div className="truncate text-xs text-red-50">{banner.hazard}</div>
        </div>
        <button onClick={dismissBanner} className="rounded-full px-2 text-white/80 hover:text-white">
          ✕
        </button>
      </div>
    </div>
  );
}
