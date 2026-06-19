import { useApp } from "../lib/store";
import { startCall } from "../lib/vapi";
import { scoreColor } from "../lib/ui";

function ScoreRing({ score }: { score: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      <circle cx="70" cy="70" r={r} fill="none" stroke="#1f2937" strokeWidth="12" />
      <circle
        cx="70"
        cy="70"
        r={r}
        fill="none"
        stroke={scoreColor(score)}
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={`${c * pct} ${c}`}
        transform="rotate(-90 70 70)"
      />
      <text x="70" y="66" textAnchor="middle" className="fill-white" fontSize="30" fontWeight="700">
        {score}
      </text>
      <text x="70" y="88" textAnchor="middle" className="fill-slate-400" fontSize="11">
        safety score
      </text>
    </svg>
  );
}

export function HomeScreen() {
  const score = useApp((s) => s.score);
  const checklist = useApp((s) => s.checklist);
  const connecting = useApp((s) => s.callStatus === "connecting");

  return (
    <div className="flex h-full flex-col px-5 pb-6 pt-2">
      <div className="mt-2">
        <div className="text-xs uppercase tracking-widest text-brand">Today's site</div>
        <h1 className="text-xl font-bold text-white">Riverside Tower — Phase 2</h1>
        <p className="text-sm text-slate-400">Lot 14 · Inspector: you + SiteGuard AI</p>
      </div>

      <div className="mt-6 flex items-center justify-between rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
        <div>
          <div className="text-sm font-semibold text-white">Site readiness</div>
          <p className="mt-1 max-w-[10rem] text-xs text-slate-400">
            Run the safety walkthrough with your AI supervisor.
          </p>
          <div className="mt-3 text-xs text-slate-300">
            <span className="font-semibold text-white">{checklist.length}</span> checks queued
          </div>
        </div>
        <ScoreRing score={score} />
      </div>

      <div className="mt-5">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Safety checklist
        </div>
        <ul className="space-y-1.5">
          {checklist.slice(0, 4).map((c) => (
            <li key={c.id} className="flex items-center gap-2 text-sm text-slate-300">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
              {c.label}
              <span className="ml-auto text-[10px] uppercase text-slate-500">{c.category}</span>
            </li>
          ))}
          {checklist.length > 4 && (
            <li className="pl-3.5 text-xs text-slate-500">+ {checklist.length - 4} more</li>
          )}
        </ul>
      </div>

      <button
        onClick={startCall}
        disabled={connecting}
        className="mt-auto flex items-center justify-center gap-3 rounded-2xl bg-brand py-4 text-base font-bold text-black shadow-lg shadow-brand/20 transition active:scale-[0.98] disabled:opacity-60"
      >
        {connecting ? (
          "Connecting…"
        ) : (
          <>
            <MicIcon /> Start inspection with SiteGuard
          </>
        )}
      </button>
      <p className="mt-2 text-center text-[11px] text-slate-500">
        Talk hands-free. Point your camera. Get instant hazard analysis.
      </p>
    </div>
  );
}

function MicIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" strokeLinecap="round" />
    </svg>
  );
}
