import { CATEGORIES, CHANNELS, type Channel } from "@/lib/channels";
import { useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  currentId: string;
  onPick: (c: Channel) => void;
  onClose: () => void;
};

export function Guide({ open, currentId, onPick, onClose }: Props) {
  const [cat, setCat] = useState<string>("All");
  if (!open) return null;
  const cats = ["All", ...CATEGORIES];
  const list = cat === "All" ? CHANNELS : CHANNELS.filter((c) => c.category === cat);

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-background/85 backdrop-blur-md animate-flicker">
      <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
        <div>
          <div className="font-mono-tv text-xs uppercase tracking-[0.3em] text-primary text-glow">
            ▎ Channel Guide
          </div>
          <div className="mt-1 text-2xl font-bold tracking-tight">Pick a channel</div>
        </div>
        <button
          onClick={onClose}
          className="font-mono-tv text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          [ESC] close
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto border-b border-border/60 px-6 py-3">
        {cats.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={cn(
              "rounded-full border px-4 py-1.5 font-mono-tv text-xs uppercase tracking-widest transition-colors",
              cat === c
                ? "border-primary bg-primary/20 text-primary text-glow"
                : "border-border/60 text-muted-foreground hover:border-foreground/40 hover:text-foreground"
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid flex-1 gap-3 overflow-y-auto p-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {list.map((ch) => {
          const active = ch.id === currentId;
          return (
            <button
              key={ch.id}
              onClick={() => onPick(ch)}
              className={cn(
                "group relative overflow-hidden rounded-xl border bg-card/60 p-5 text-left transition-all hover:-translate-y-0.5 hover:bg-card",
                active ? "border-primary shadow-glow" : "border-border/60 hover:border-foreground/30"
              )}
              style={{ ["--ch-color" as string]: ch.color }}
            >
              <div className="bg-scanlines pointer-events-none absolute inset-0 opacity-30" />
              <div className="flex items-start justify-between">
                <div
                  className="font-mono-tv text-3xl font-bold leading-none text-glow"
                  style={{ color: ch.color }}
                >
                  {ch.number}
                </div>
                {active && (
                  <div className="flex items-center gap-1.5 font-mono-tv text-[10px] uppercase tracking-widest text-primary">
                    <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-primary shadow-glow" />
                    on air
                  </div>
                )}
              </div>
              <div className="mt-4 text-lg font-bold tracking-tight">{ch.name}</div>
              <div className="mt-1 text-sm text-muted-foreground">{ch.tagline}</div>
              <div className="mt-4 font-mono-tv text-[10px] uppercase tracking-widest text-muted-foreground">
                {ch.category} · {ch.videos.length} in rotation
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}