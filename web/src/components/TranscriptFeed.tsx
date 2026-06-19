import { useEffect, useRef } from "react";
import { useApp } from "../lib/store";
import { cx } from "../lib/ui";

export function TranscriptFeed() {
  const transcript = useApp((s) => s.transcript);
  const speaking = useApp((s) => s.speaking);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript.length, speaking]);

  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
        Conversation
        {speaking && (
          <span className="flex items-center gap-1 text-brand">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" /> SiteGuard speaking
          </span>
        )}
      </div>
      <div className="no-scrollbar max-h-40 space-y-2 overflow-y-auto rounded-xl bg-black/30 p-3 ring-1 ring-white/10">
        {transcript.length === 0 ? (
          <p className="text-xs text-slate-500">Say "run the checklist" or "check the scaffold for hazards"…</p>
        ) : (
          transcript.map((t) => (
            <div key={t.id} className={cx("flex", t.role === "user" ? "justify-end" : "justify-start")}>
              <span
                className={cx(
                  "max-w-[85%] rounded-2xl px-3 py-1.5 text-[13px] leading-snug",
                  t.role === "user" ? "bg-brand/90 text-black" : "bg-white/10 text-slate-100",
                )}
              >
                {t.text}
              </span>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}
