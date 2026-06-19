import { useApp, appStore } from "../lib/store";
import { sev, scoreColor, cx } from "../lib/ui";

export function ReportView() {
  const report = useApp((s) => s.report);
  const findings = useApp((s) => s.findings);
  const escalations = useApp((s) => s.escalations);
  if (!report) return null;

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-[#0b0f14]">
      <div className="flex items-center justify-between px-5 pb-3 pt-12">
        <div>
          <div className="text-xs uppercase tracking-widest text-brand">Inspection report</div>
          <h2 className="text-lg font-bold text-white">{report.title}</h2>
        </div>
        <button
          onClick={() => appStore.set({ report: null })}
          className="rounded-full bg-white/10 px-3 py-1.5 text-sm text-white"
        >
          ✕
        </button>
      </div>

      <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto px-5 pb-6">
        <div className="flex items-center gap-4 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
          <div
            className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full text-2xl font-bold text-black"
            style={{ backgroundColor: scoreColor(report.score) }}
          >
            {report.score}
          </div>
          <div>
            <div
              className={cx(
                "inline-block rounded-full px-2 py-0.5 text-[11px] font-bold uppercase",
                report.status === "passed" ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300",
              )}
            >
              {report.status.replace("-", " ")}
            </div>
            <p className="mt-1.5 text-sm text-slate-300">{report.summary}</p>
          </div>
        </div>

        <Section title={`Hazards found (${findings.length})`}>
          {findings.length === 0 ? (
            <p className="text-sm text-emerald-300">No hazards logged.</p>
          ) : (
            findings.map((f, i) => (
              <div key={i} className="rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
                <div className="flex items-center gap-2">
                  <span className={cx("h-2 w-2 rounded-full", sev(f.severity).dot)} />
                  <span className="text-sm font-semibold text-white">{f.hazard}</span>
                  <span className={cx("ml-auto text-[11px] font-bold", sev(f.severity).text)}>
                    {sev(f.severity).label}
                  </span>
                </div>
                {f.recommendation && <p className="mt-1 text-xs text-slate-400">→ {f.recommendation}</p>}
                {f.sop_ref && <p className="mt-0.5 text-[10px] uppercase tracking-wide text-slate-500">{f.sop_ref}</p>}
              </div>
            ))
          )}
        </Section>

        {escalations.length > 0 && (
          <Section title={`Escalations (${escalations.length})`}>
            {escalations.map((e, i) => (
              <div key={i} className="rounded-xl bg-red-500/10 p-3 ring-1 ring-red-400/30">
                <div className="text-sm font-semibold text-red-200">⚠ {e.hazard}</div>
                {e.reason && <p className="text-xs text-red-100/70">{e.reason}</p>}
              </div>
            ))}
          </Section>
        )}

        <p className="pt-2 text-center text-[11px] text-slate-500">Saved to InsForge · reports table</p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
