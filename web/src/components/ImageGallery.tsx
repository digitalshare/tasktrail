import { useApp } from "../lib/store";
import { DEMO_IMAGES } from "../data/demo";
import { selectImage, analyzeView } from "../voice/tools";
import { narrate } from "../lib/vapi";
import { cx } from "../lib/ui";

export function ImageGallery() {
  const selectedImageId = useApp((s) => s.selectedImageId);
  const analyzing = useApp((s) => s.analyzing);
  const findingsByImage = useApp((s) => s.findingsByImage);
  const callActive = useApp((s) => s.callStatus === "active");

  async function scan() {
    const result = await analyzeView();
    if (callActive) {
      narrate(
        `The worker scanned the ${result.area}. Vision result: ${JSON.stringify(result)}. Brief them in 1-2 short sentences and flag the most serious hazard.`,
      );
    }
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Camera views</span>
        <button
          onClick={scan}
          disabled={analyzing}
          className="rounded-full bg-brand px-3 py-1 text-xs font-bold text-black active:scale-95 disabled:opacity-50"
        >
          {analyzing ? "Scanning…" : "⚡ Scan this view"}
        </button>
      </div>
      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        {DEMO_IMAGES.map((img) => {
          const analyzed = img.id in findingsByImage;
          const count = findingsByImage[img.id]?.length ?? 0;
          return (
            <button
              key={img.id}
              onClick={() => selectImage(img.id)}
              className={cx(
                "relative h-16 w-24 shrink-0 overflow-hidden rounded-lg ring-2 transition",
                selectedImageId === img.id ? "ring-brand" : "ring-transparent opacity-80",
              )}
            >
              <img src={img.src} alt={img.label} className="h-full w-full object-cover" />
              {analyzed && (
                <span className="absolute right-1 top-1 rounded-full bg-black/70 px-1.5 text-[10px] font-bold text-white">
                  {count > 0 ? `⚠ ${count}` : "✓"}
                </span>
              )}
              <span className="absolute inset-x-0 bottom-0 truncate bg-black/60 px-1 py-0.5 text-[9px] text-white">
                {img.area}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
