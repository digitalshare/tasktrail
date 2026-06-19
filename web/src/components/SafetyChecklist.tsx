import { useApp } from "../lib/store";
import { completeItem } from "../voice/tools";
import { narrate } from "../lib/vapi";
import { cx } from "../lib/ui";

export function SafetyChecklist() {
  const checklist = useApp((s) => s.checklist);
  const callActive = useApp((s) => s.callStatus === "active");
  const done = checklist.filter((c) => c.status === "done").length;
  const pct = checklist.length ? Math.round((done / checklist.length) * 100) : 0;

  async function toggle(label: string, alreadyDone: boolean) {
    if (alreadyDone) return;
    await completeItem(label);
    if (callActive) narrate(`The worker verified "${label}". Acknowledge briefly and suggest the next check.`);
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Safety checklist</span>
        <span className="text-xs text-slate-400">
          {done}/{checklist.length}
        </span>
      </div>
      <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${pct}%` }} />
      </div>
      <ul className="space-y-1.5">
        {checklist.map((c) => {
          const isDone = c.status === "done";
          return (
            <li key={c.id}>
              <button
                onClick={() => toggle(c.label, isDone)}
                className={cx(
                  "flex w-full items-start gap-2.5 rounded-xl p-2.5 text-left ring-1 transition",
                  isDone ? "bg-emerald-500/10 ring-emerald-400/30" : "bg-white/5 ring-white/10 active:bg-white/10",
                )}
              >
                <span
                  className={cx(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    isDone ? "bg-emerald-400 text-black" : "border border-slate-500 text-transparent",
                  )}
                >
                  ✓
                </span>
                <span className="min-w-0">
                  <span className={cx("block text-sm font-medium", isDone ? "text-emerald-200 line-through" : "text-white")}>
                    {c.label}
                  </span>
                  <span className="block text-[11px] leading-snug text-slate-400">{c.sop_text}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
