import { useEffect, useState, useMemo } from "react";
import { CHANNELS, type Channel } from "@/lib/channels";
import { cn } from "@/lib/utils";

type Props = {
  currentChannelId: string;
  onPickChannel: (channel: Channel) => void;
};

// Time-slot programming definitions per category.
// Maps a 2-hour block (0–23) to a "show" name and sub-playlist hint.
type TimeSlot = {
  hours: [number, number]; // [start, end) in 24h format
  label: string;
};

const CATEGORY_SCHEDULES: Record<string, TimeSlot[]> = {
  Music: [
    { hours: [0, 6], label: "Late Night Loops" },
    { hours: [6, 9], label: "Morning Beats" },
    { hours: [9, 12], label: "Study Focus" },
    { hours: [12, 15], label: "Lunchtime Grooves" },
    { hours: [15, 18], label: "Afternoon Chill" },
    { hours: [18, 21], label: "Prime Time Hits" },
    { hours: [21, 24], label: "Night Session" },
  ],
  Mood: [
    { hours: [0, 6], label: "3AM Drift" },
    { hours: [6, 9], label: "Dawn Ambience" },
    { hours: [9, 12], label: "Deep Focus" },
    { hours: [12, 15], label: "Relaxed Vibes" },
    { hours: [15, 18], label: "Afternoon Glow" },
    { hours: [18, 21], label: "Evening Unwind" },
    { hours: [21, 24], label: "Night Ambience" },
  ],
  Screensaver: [
    { hours: [0, 6], label: "Night Earth" },
    { hours: [6, 9], label: "Morning Views" },
    { hours: [9, 12], label: "Daytime Pass" },
    { hours: [12, 15], label: "Midday Drift" },
    { hours: [15, 18], label: "Golden Hour" },
    { hours: [18, 21], label: "Sunset Feed" },
    { hours: [21, 24], label: "Night Orbit" },
  ],
  Sports: [
    { hours: [0, 6], label: "Replay Zone" },
    { hours: [6, 9], label: "Morning Scores" },
    { hours: [9, 12], label: "Live Coverage" },
    { hours: [12, 15], label: "Afternoon Games" },
    { hours: [15, 18], label: "Prime Sports" },
    { hours: [18, 21], label: "Night Highlights" },
    { hours: [21, 24], label: "Top Moments" },
  ],
  Learn: [
    { hours: [0, 6], label: "Late Night Study" },
    { hours: [6, 9], label: "Morning Lecture" },
    { hours: [9, 12], label: "Deep Dive" },
    { hours: [12, 15], label: "Lunch & Learn" },
    { hours: [15, 18], label: "Afternoon Tutorial" },
    { hours: [18, 21], label: "Evening Workshop" },
    { hours: [21, 24], label: "Night Reading" },
  ],
  News: [
    { hours: [0, 6], label: "Night Brief" },
    { hours: [6, 9], label: "Morning Headlines" },
    { hours: [9, 12], label: "Midday Report" },
    { hours: [12, 15], label: "Afternoon Update" },
    { hours: [15, 18], label: "Evening News" },
    { hours: [18, 21], label: "Prime Time News" },
    { hours: [21, 24], label: "Late Night Digest" },
  ],
  Comedy: [
    { hours: [0, 6], label: "Late Night Laughs" },
    { hours: [6, 9], label: "Morning Smile" },
    { hours: [9, 12], label: "Stand-Up Showcase" },
    { hours: [12, 15], label: "Lunchtime Comedy" },
    { hours: [15, 18], label: "Afternoon Sketches" },
    { hours: [18, 21], label: "Prime Time Comedy" },
    { hours: [21, 24], label: "Night Comedy Hour" },
  ],
};

// Default schedule for categories not explicitly defined
const DEFAULT_SCHEDULE: TimeSlot[] = [
  { hours: [0, 6], label: "Off Air" },
  { hours: [6, 9], label: "Morning Block" },
  { hours: [9, 12], label: "Daytime Block" },
  { hours: [12, 15], label: "Afternoon Block" },
  { hours: [15, 18], label: "Evening Block" },
  { hours: [18, 21], label: "Prime Time" },
  { hours: [21, 24], label: "Night Block" },
];

function getScheduleForCategory(category: string): TimeSlot[] {
  return CATEGORY_SCHEDULES[category] || DEFAULT_SCHEDULE;
}

function getCurrentShow(channel: Channel): { label: string; next: string; remaining: number } {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const secondsInHour = hour * 3600 + minute * 60 + now.getSeconds();

  const schedule = getScheduleForCategory(channel.category);
  let currentIdx = 0;

  for (let i = 0; i < schedule.length; i++) {
    const slot = schedule[i];
    if (hour >= slot.hours[0] && hour < slot.hours[1]) {
      currentIdx = i;
      break;
    }
  }

  const current = schedule[currentIdx];
  const nextIdx = (currentIdx + 1) % schedule.length;
  const next = schedule[nextIdx];

  // Calculate remaining seconds in current slot
  const slotStartSeconds = current.hours[0] * 3600;
  const slotEndSeconds = current.hours[1] * 3600;
  const remaining = Math.max(0, slotEndSeconds - secondsInHour);

  return {
    label: current.label,
    next: next.label,
    remaining,
  };
}

function fmtClock(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function fmtRemaining(seconds: number) {
  if (seconds <= 0) return "now";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function ScheduleGrid({ currentChannelId, onPickChannel }: Props) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  if (!now) return null;

  // Group channels by category
  const channelsByCategory = useMemo(() => {
    const map = new Map<string, Channel[]>();
    for (const ch of CHANNELS) {
      if (!map.has(ch.category)) map.set(ch.category, []);
      map.get(ch.category)!.push(ch);
    }
    return map;
  }, []);

  const hour = now.getHours();

  return (
    <div className="border-t border-border/60 bg-black/40 px-3 py-3 sm:px-6 sm:py-4">
      <div className="flex items-center justify-between mb-3">
        <div className="font-mono-tv text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          ▎Schedule Grid · {fmtClock(now)}
        </div>
        <div className="font-mono-tv text-[10px] text-muted-foreground/60">
          {CHANNELS.length} channels · {channelsByCategory.size} categories
        </div>
      </div>

      {/* Time header row */}
      <div className="mb-2 flex gap-0 overflow-x-auto pb-1">
        <div className="w-24 shrink-0 text-[9px] font-mono-tv text-muted-foreground/60 uppercase tracking-wider">
          Channel
        </div>
        <div className="flex flex-1 gap-0">
          {Array.from({ length: 6 }, (_, i) => {
            const h = (hour - 2 + i + 24) % 24;
            const isNow = i === 2;
            return (
              <div
                key={h}
                className={cn(
                  "flex-1 text-center font-mono-tv text-[9px] uppercase tracking-wider",
                  isNow ? "text-primary font-bold" : "text-muted-foreground/60"
                )}
              >
                {isNow ? "● NOW" : `${String(h).padStart(2, "0")}:00`}
              </div>
            );
          })}
        </div>
      </div>

      {/* Channel rows */}
      <div className="max-h-64 overflow-y-auto pr-1 space-y-0.5">
        {Array.from(channelsByCategory.entries()).map(([category, channels]) => (
          <div key={category} className="mb-2">
            <div className="font-mono-tv text-[8px] uppercase tracking-[0.2em] text-muted-foreground/40 px-1 mb-1">
              {category}
            </div>
            <div className="space-y-0.5">
              {channels.map((ch) => {
                const show = getCurrentShow(ch);
                const isActive = ch.id === currentChannelId;
                const schedule = getScheduleForCategory(ch.category);

                // Build 6 time-slot cells
                const slots = Array.from({ length: 6 }, (_, i) => {
                  const slotHour = (hour - 2 + i + 24) % 24;
                  const slot = schedule.find((s) => slotHour >= s.hours[0] && slotHour < s.hours[1]);
                  return slot || schedule[0];
                });

                return (
                  <button
                    key={ch.id}
                    onClick={() => onPickChannel(ch)}
                    className={cn(
                      "group flex w-full items-center gap-0 rounded-md border transition-all",
                      isActive
                        ? "border-primary/50 bg-primary/10"
                        : "border-transparent hover:border-border/40 hover:bg-white/[0.02]"
                    )}
                  >
                    {/* Channel name */}
                    <div className="w-24 shrink-0 px-2 py-1.5 text-left">
                      <div className={cn(
                        "truncate font-mono-tv text-[10px] font-bold uppercase tracking-wider",
                        isActive ? "text-primary" : "text-foreground/80 group-hover:text-foreground"
                      )}>
                        {ch.name}
                      </div>
                    </div>

                    {/* Time slots */}
                    <div className="flex flex-1 gap-px">
                      {slots.map((slot, i) => {
                        const isNow = i === 2;
                        return (
                          <div
                            key={`${ch.id}-${i}`}
                            className={cn(
                              "flex-1 px-1 py-1.5 text-center border-l border-border/20",
                              isNow && "bg-primary/5"
                            )}
                          >
                            <div className={cn(
                              "truncate text-[8px] font-mono-tv",
                              isNow ? "text-primary font-bold" : "text-muted-foreground/50"
                            )}>
                              {slot.label}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Now playing indicator */}
                    {isActive && (
                      <div className="shrink-0 px-2 py-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom summary */}
      <div className="mt-3 flex items-center justify-between border-t border-border/30 pt-2">
        <div className="font-mono-tv text-[9px] text-muted-foreground/60">
          Schedule is time-based · Programming changes every 3 hours
        </div>
        <div className="font-mono-tv text-[9px] text-muted-foreground/60">
          {fmtClock(now)} · {new Date().toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}
        </div>
      </div>
    </div>
  );
}
