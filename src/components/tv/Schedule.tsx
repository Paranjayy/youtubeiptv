import { CHANNELS, type Channel } from "@/lib/channels";
import { useEffect, useState } from "react";

type Props = {
  channel: Channel;
  order: string[];
  cursor: number;
  currentDuration: number; // seconds; 0 if unknown
  currentElapsed: number;
};

const AVG_LEN = 240; // seconds, used when actual duration unknown

function fmtClock(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function Schedule({ channel, order, cursor, currentDuration, currentElapsed }: Props) {
  // Avoid SSR mismatch (React #418): render only after mount on the client.
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);
  if (!now) return null;
  const currentLen = currentDuration > 0 ? currentDuration : AVG_LEN;
  const remaining = Math.max(0, currentLen - currentElapsed);

  const items: { id: string; start: Date; label: string }[] = [];
  let t = now.getTime() + remaining * 1000;
  for (let i = 1; i <= 5; i++) {
    const id = order[(cursor + i) % order.length];
    items.push({ id, start: new Date(t), label: `Up next +${i}` });
    t += AVG_LEN * 1000;
  }

  return (
    <div className="border-t border-border/60 bg-black/40 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="font-mono-tv text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          ▎ Schedule · {channel.name}
        </div>
        <div className="font-mono-tv text-[10px] uppercase tracking-widest text-muted-foreground">
          {CHANNELS.length} channels on air
        </div>
      </div>
      <ol className="mt-2 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-5">
        {items.map((it, i) => (
          <li
            key={`${it.id}-${i}`}
            className="flex items-center gap-2 rounded-md border border-border/50 bg-card/40 px-2.5 py-1.5"
          >
            <span
              className="font-mono-tv text-[11px] font-bold tabular-nums"
              style={{ color: channel.color }}
            >
              {fmtClock(it.start)}
            </span>
            <span className="truncate text-[11px] text-foreground/80">
              {it.label}
            </span>
            <span className="ml-auto font-mono-tv text-[10px] text-muted-foreground">
              {it.id.slice(0, 6)}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}