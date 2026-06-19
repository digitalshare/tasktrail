import { CameraView } from "./CameraView";
import { ImageGallery } from "./ImageGallery";
import { SafetyChecklist } from "./SafetyChecklist";
import { TranscriptFeed } from "./TranscriptFeed";
import { CallControls } from "./CallControls";
import { useApp } from "../lib/store";

export function InspectionScreen() {
  const connecting = useApp((s) => s.callStatus === "connecting");

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 pb-2 pt-1">
        <div>
          <div className="text-sm font-bold text-white">Live inspection</div>
          <div className="text-[11px] text-slate-400">Riverside Tower — Phase 2</div>
        </div>
        {connecting && <span className="text-xs text-brand">connecting…</span>}
      </div>

      <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto px-4 pb-4">
        <CameraView />
        <ImageGallery />
        <SafetyChecklist />
        <TranscriptFeed />
      </div>

      <CallControls />
    </div>
  );
}
