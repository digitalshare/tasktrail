import type { ReactNode } from "react";

/** A fixed iPhone-sized device shell that hosts the app, for live demos on a laptop. */
export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-full w-full flex flex-col items-center justify-center gap-6 py-8 px-4">
      <div className="text-center">
        <div className="text-2xl font-bold tracking-tight text-white">
          Site<span className="text-brand">Guard</span> AI
        </div>
        <div className="text-xs text-slate-400 mt-1">
          Vapi voice · Nebius vision · InsForge backend
        </div>
      </div>

      <div
        className="relative shrink-0 rounded-[3rem] bg-black p-3 shadow-2xl ring-1 ring-white/10"
        style={{ width: 390, height: 844 }}
      >
        {/* side buttons */}
        <div className="absolute -left-1 top-32 h-16 w-1 rounded-l bg-zinc-700" />
        <div className="absolute -left-1 top-52 h-10 w-1 rounded-l bg-zinc-700" />
        <div className="absolute -right-1 top-44 h-20 w-1 rounded-r bg-zinc-700" />

        <div className="relative h-full w-full overflow-hidden rounded-[2.4rem] bg-[#0b0f14]">
          {children}
        </div>
      </div>
    </div>
  );
}

export function StatusBar() {
  return (
    <div className="relative z-20 flex items-center justify-between px-7 pt-3 pb-1 text-[13px] font-semibold text-white">
      <span>9:41</span>
      <div className="absolute left-1/2 top-2 h-6 w-28 -translate-x-1/2 rounded-b-2xl bg-black" />
      <div className="flex items-center gap-1.5">
        <span className="text-xs">●●●</span>
        <span>5G</span>
        <span className="ml-1 inline-block h-3 w-6 rounded-sm border border-white/70">
          <span className="block h-full w-4/5 rounded-sm bg-white/90" />
        </span>
      </div>
    </div>
  );
}
