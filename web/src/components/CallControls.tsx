import { useApp } from "../lib/store";
import { stopCall, narrate } from "../lib/vapi";
import { generateReport, resetDemo } from "../voice/tools";

export function CallControls() {
  const callStatus = useApp((s) => s.callStatus);
  const speaking = useApp((s) => s.speaking);
  const volume = useApp((s) => s.volume);
  const active = callStatus === "active";

  async function makeReport() {
    if (active) narrate("The worker asked for the final report. Tell them you're compiling it now.");
    await generateReport();
  }

  return (
    <div className="flex items-center gap-2 border-t border-white/10 bg-black/40 px-4 py-3">
      <div className="flex flex-1 items-center gap-2">
        <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-brand/20">
          <span
            className="absolute inset-0 rounded-full bg-brand/30"
            style={{ transform: `scale(${active ? 1 + Math.min(volume, 1) * 0.6 : 1})`, transition: "transform 80ms" }}
          />
          <span className="relative text-brand">{speaking ? "🔊" : "🎙️"}</span>
        </div>
        <div className="text-xs">
          <div className="font-semibold text-white">{active ? "Live with SiteGuard" : "Reconnecting…"}</div>
          <div className="text-slate-400">{speaking ? "speaking" : "listening"}</div>
        </div>
      </div>

      <button
        onClick={makeReport}
        className="rounded-full bg-white/10 px-3 py-2 text-xs font-semibold text-white active:scale-95"
      >
        📋 Report
      </button>
      <button
        onClick={resetDemo}
        className="rounded-full bg-white/10 px-3 py-2 text-xs font-semibold text-white active:scale-95"
        title="Reset demo data"
      >
        ↺
      </button>
      <button
        onClick={stopCall}
        className="rounded-full bg-red-500 px-4 py-2 text-xs font-bold text-white active:scale-95"
      >
        End
      </button>
    </div>
  );
}
