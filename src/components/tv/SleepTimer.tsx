import { useCallback, useEffect, useRef, useState } from "react";
import { Moon, Timer, X } from "lucide-react";
import { cn } from "@/lib/utils";

type SleepTimerProps = {
  onExpire: () => void;
};

const PRESETS = [
  { label: "15m", minutes: 15 },
  { label: "30m", minutes: 30 },
  { label: "1h", minutes: 60 },
  { label: "1.5h", minutes: 90 },
  { label: "2h", minutes: 120 },
];

export function SleepTimer({ onExpire }: SleepTimerProps) {
  const [remaining, setRemaining] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setRemaining(null);
  }, []);

  const startTimer = useCallback(
    (minutes: number) => {
      clearTimer();
      setRemaining(minutes * 60);
      setOpen(false);
    },
    [clearTimer]
  );

  useEffect(() => {
    if (remaining === null || remaining <= 0) {
      if (remaining !== null && remaining <= 0) {
        onExpire();
        clearTimer();
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev === null || prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [remaining, onExpire, clearTimer]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const isActive = remaining !== null && remaining > 0;

  return (
    <div className="relative">
      <button
        onClick={() => {
          if (isActive) {
            clearTimer();
          } else {
            setOpen(!open);
          }
        }}
        className={cn(
          "flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[10px] font-mono-tv uppercase tracking-wider transition-all",
          isActive
            ? "border-amber-400/40 bg-amber-400/10 text-amber-300"
            : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
        )}
        title={isActive ? `Sleep in ${formatTime(remaining)} — click to cancel` : "Sleep Timer"}
      >
        {isActive ? (
          <Moon className="h-3 w-3 animate-pulse" />
        ) : (
          <Timer className="h-3 w-3" />
        )}
        <span className="hidden sm:inline">
          {isActive ? formatTime(remaining) : "Sleep"}
        </span>
        {isActive && (
          <X className="h-2.5 w-2.5 opacity-60" />
        )}
      </button>

      {open && !isActive && (
        <div className="absolute top-full right-0 mt-2 w-48 rounded-2xl border border-white/10 bg-[#0a0c10]/95 backdrop-blur-xl p-3 shadow-2xl shadow-black/50 z-50 animate-scale-in">
          <div className="font-mono-tv text-[9px] uppercase tracking-widest text-muted-foreground mb-2">
            Sleep Timer
          </div>
          <div className="space-y-1">
            {PRESETS.map((preset) => (
              <button
                key={preset.minutes}
                onClick={() => startTimer(preset.minutes)}
                className="w-full rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-left text-xs font-mono-tv text-foreground/80 transition-all hover:bg-white/[0.06] hover:border-white/10"
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t border-white/5 text-[9px] font-mono-tv text-muted-foreground text-center">
            Auto-pause when timer ends
          </div>
        </div>
      )}
    </div>
  );
}
