import { useApp } from "../lib/store";
import { getImage } from "../data/demo";
import { sev, cx } from "../lib/ui";

// Deterministic scatter positions for AR-style hazard markers (model returns
// text locations, not coordinates, so we place markers consistently per index).
const MARKERS = [
  { top: "26%", left: "32%" },
  { top: "54%", left: "62%" },
  { top: "38%", left: "76%" },
  { top: "68%", left: "28%" },
];

export function CameraView() {
  const selectedImageId = useApp((s) => s.selectedImageId);
  const analyzing = useApp((s) => s.analyzing);
  const findingsByImage = useApp((s) => s.findingsByImage);
  const overallRiskByImage = useApp((s) => s.overallRiskByImage);

  const img = getImage(selectedImageId);
  const findings = findingsByImage[selectedImageId] ?? [];
  const risk = overallRiskByImage[selectedImageId];
  const analyzed = selectedImageId in findingsByImage;

  return (
    <div className="relative overflow-hidden rounded-2xl ring-1 ring-white/10">
      <img src={img.src} alt={img.label} className="h-52 w-full object-cover" />

      {/* top overlay: live badge + risk */}
      <div className="absolute inset-x-0 top-0 flex items-start justify-between p-2.5">
        <span className="flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
          <span className="h-2 w-2 rounded-full bg-red-500" /> LIVE · {img.label}
        </span>
        {analyzed && risk && (
          <span
            className={cx(
              "rounded-full px-2.5 py-1 text-[11px] font-bold backdrop-blur ring-1",
              sev(risk).bg,
              sev(risk).text,
              sev(risk).border,
            )}
          >
            {sev(risk).label.toUpperCase()} RISK
          </span>
        )}
      </div>

      {/* scanning animation */}
      {analyzing && (
        <div className="absolute inset-0 bg-black/30">
          <div className="absolute inset-x-0 top-0 h-1 animate-[scan_1.4s_linear_infinite] bg-brand/80 shadow-[0_0_18px_4px_rgba(245,158,11,0.6)]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-brand backdrop-blur">
              Analyzing with Nebius vision…
            </span>
          </div>
          <style>{`@keyframes scan{0%{top:0}100%{top:100%}}`}</style>
        </div>
      )}

      {/* AR markers */}
      {!analyzing &&
        findings.slice(0, MARKERS.length).map((f, i) => (
          <div
            key={i}
            className={cx(
              "absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-[11px] font-bold text-black ring-2 ring-white/80",
              sev(f.severity).dot,
            )}
            style={MARKERS[i]}
            title={f.hazard}
          >
            {i + 1}
          </div>
        ))}

      {/* bottom hazard list */}
      {!analyzing && analyzed && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-2.5 pt-8">
          {findings.length === 0 ? (
            <div className="text-xs font-medium text-emerald-300">✓ No hazards detected — area looks compliant.</div>
          ) : (
            <ul className="space-y-1">
              {findings.slice(0, 3).map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-[11px] text-white">
                  <span className={cx("h-1.5 w-1.5 rounded-full", sev(f.severity).dot)} />
                  <span className="font-semibold">{f.hazard}</span>
                  <span className={cx("ml-auto shrink-0", sev(f.severity).text)}>{sev(f.severity).label}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
