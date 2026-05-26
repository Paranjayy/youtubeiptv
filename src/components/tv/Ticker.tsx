import { CHANNELS } from "@/lib/channels";

export function Ticker() {
  const items = CHANNELS.map((c) => `${c.number} ${c.name}`);
  const line = items.join("  •  ");
  return (
    <div className="relative overflow-hidden border-y border-border/60 bg-black/40 py-1.5">
      <div className="flex w-max animate-ticker gap-12 font-mono-tv text-xs text-muted-foreground">
        <span>{line}</span>
        <span>{line}</span>
      </div>
    </div>
  );
}
