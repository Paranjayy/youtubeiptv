import { useCallback, useEffect, useRef, useState } from "react";
import { Shuffle, Pause, Play, SkipForward, ChevronUp, ChevronDown } from "lucide-react";
import { CHANNELS, type Channel } from "@/lib/channels";
import { cn } from "@/lib/utils";

type AutoSurfProps = {
  currentChannel: Channel;
  onSwitchChannel: (channel: Channel) => void;
};

const SURF_INTERVALS = [
  { label: "10s", ms: 10_000 },
  { label: "30s", ms: 30_000 },
  { label: "1m", ms: 60_000 },
  { label: "5m", ms: 300_000 },
  { label: "15m", ms: 900_000 },
];

export function AutoSurf({ currentChannel, onSwitchChannel }: AutoSurfProps) {
  const [active, setActive] = useState(false);
  const [intervalIdx, setIntervalIdx] = useState(1); // default 30s
  const [remaining, setRemaining] = useState(0);
  const [category, setCategory] = useState<string | null>(null); // null = all channels
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const remainingRef = useRef(0);

  const interval = SURF_INTERVALS[intervalIdx].ms;

  const getPool = useCallback(() => {
    let pool = [...CHANNELS];
    if (category) {
      pool = pool.filter((ch) => ch.category === category);
    }
    return pool;
  }, [category]);

  const surf = useCallback(() => {
    const pool = getPool();
    // Pick a different channel than current
    const others = pool.filter((ch) => ch.id !== currentChannel.id);
    const next = others.length > 0
      ? others[Math.floor(Math.random() * others.length)]
      : pool[Math.floor(Math.random() * pool.length)];
    if (next) onSwitchChannel(next);
    remainingRef.current = Math.floor(interval / 1000);
    setRemaining(remainingRef.current);
  }, [getPool, currentChannel.id, onSwitchChannel, interval]);

  // Timer tick
  useEffect(() => {
    if (!active) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    remainingRef.current = Math.floor(interval / 1000);
    setRemaining(remainingRef.current);

    timerRef.current = setInterval(() => {
      remainingRef.current -= 1;
      if (remainingRef.current <= 0) {
        surf();
      } else {
        setRemaining(remainingRef.current);
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [active, interval, surf]);

  const categories = Array.from(new Set(CHANNELS.map((ch) => ch.category)));

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Shuffle className={cn("h-3.5 w-3.5", active ? "text-pink-400 animate-pulse" : "text-muted-foreground")} />
          <span className="font-mono-tv text-[10px] uppercase tracking-widest text-muted-foreground">Auto-Surf</span>
        </div>
        <button
          onClick={() => setActive(!active)}
          className={cn(
            "flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-all",
            active
              ? "bg-pink-500/20 text-pink-400 border border-pink-500/30"
              : "bg-white/5 text-muted-foreground border border-white/10 hover:bg-white/10"
          )}
        >
          {active ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          {active ? "Stop" : "Start"}
        </button>
      </div>

      {/* Timer display */}
      {active && (
        <div className="rounded-xl bg-black/20 border border-white/5 p-3 mb-3 text-center">
          <div className="font-mono-tv text-2xl font-bold tabular-nums text-pink-400">
            {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}
          </div>
          <div className="text-[9px] font-mono-tv text-muted-foreground uppercase tracking-wider mt-1">
            until next channel
          </div>
        </div>
      )}

      {/* Interval selector */}
      <div className="mb-3">
        <div className="text-[9px] font-mono-tv text-muted-foreground/60 uppercase tracking-wider mb-1.5">Switch Interval</div>
        <div className="flex gap-1">
          {SURF_INTERVALS.map((opt, idx) => (
            <button
              key={opt.label}
              onClick={() => setIntervalIdx(idx)}
              className={cn(
                "flex-1 rounded-lg py-1.5 text-[10px] font-mono-tv transition-all",
                intervalIdx === idx
                  ? "bg-pink-500/20 text-pink-400 border border-pink-500/30"
                  : "bg-white/5 text-muted-foreground border border-white/5 hover:bg-white/10"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category filter */}
      <div>
        <div className="text-[9px] font-mono-tv text-muted-foreground/60 uppercase tracking-wider mb-1.5">Channel Pool</div>
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setCategory(null)}
            className={cn(
              "rounded-full px-2 py-1 text-[10px] font-mono-tv transition-all",
              category === null
                ? "bg-primary/20 text-primary border border-primary/30"
                : "bg-white/5 text-muted-foreground border border-white/5 hover:bg-white/10"
            )}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={cn(
                "rounded-full px-2 py-1 text-[10px] font-mono-tv transition-all",
                category === cat
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "bg-white/5 text-muted-foreground border border-white/5 hover:bg-white/10"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Manual skip */}
      {active && (
        <button
          onClick={surf}
          className="mt-3 w-full flex items-center justify-center gap-1.5 rounded-xl bg-white/5 border border-white/10 py-2 text-[10px] font-mono-tv text-foreground/80 hover:bg-white/10 transition-all"
        >
          <SkipForward className="h-3 w-3" /> Skip Now
        </button>
      )}
    </div>
  );
}
