import { useMemo } from "react";
import { Sun, Sunrise, Moon, CloudMoon, Sparkles } from "lucide-react";
import { CHANNELS, type Channel } from "@/lib/channels";
import { cn } from "@/lib/utils";

type TimeSlot = {
  label: string;
  icon: typeof Sun;
  hours: [number, number]; // [start, end) in 24h
  channelIds: string[];
  greeting: string;
};

const TIME_SLOTS: TimeSlot[] = [
  {
    label: "Early Bird",
    icon: Sunrise,
    hours: [5, 9],
    channelIds: ["lofi", "focus", "nature", "math", "python"],
    greeting: "rise & grind",
  },
  {
    label: "Morning",
    icon: Sun,
    hours: [9, 12],
    channelIds: ["tech", "news", "focus", "python", "airadar"],
    greeting: "good morning",
  },
  {
    label: "Afternoon",
    icon: Sun,
    hours: [12, 17],
    channelIds: ["hits", "workout", "food", "travel", "gaming"],
    greeting: "afternoon vibes",
  },
  {
    label: "Evening",
    icon: CloudMoon,
    hours: [17, 21],
    channelIds: ["comedy", "docs", "anime", "movies", "sports"],
    greeting: "winding down",
  },
  {
    label: "Night Owl",
    icon: Moon,
    hours: [21, 5],
    channelIds: ["synthwave", "jazz", "melancholy", "cyber", "threeam", "asmr"],
    greeting: "late night session",
  },
];

type TimeBasedSuggestionsProps = {
  onSelectChannel: (channel: Channel) => void;
};

export function TimeBasedSuggestions({ onSelectChannel }: TimeBasedSuggestionsProps) {
  const currentSlot = useMemo(() => {
    const hour = new Date().getHours();
    return (
      TIME_SLOTS.find((slot) => {
        const [start, end] = slot.hours;
        if (start < end) return hour >= start && hour < end;
        return hour >= start || hour < end;
      }) ?? TIME_SLOTS[TIME_SLOTS.length - 1]
    );
  }, []);

  const suggestedChannels = useMemo(() => {
    return currentSlot.channelIds
      .map((id) => CHANNELS.find((ch) => ch.id === id))
      .filter(Boolean) as Channel[];
  }, [currentSlot]);

  const Icon = currentSlot.icon;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-2.5">
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-3.5 w-3.5 text-primary" />
        </div>
        <div>
          <div className="font-mono-tv text-[9px] uppercase tracking-widest text-muted-foreground">
            {currentSlot.label}
          </div>
          <div className="text-[10px] text-foreground/70 font-mono-tv">
            {currentSlot.greeting}
          </div>
        </div>
        <Sparkles className="h-3 w-3 text-primary/50 ml-auto" />
      </div>

      <div className="space-y-0.5">
        {suggestedChannels.map((ch) => (
          <button
            key={ch.id}
            onClick={() => onSelectChannel(ch)}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-all hover:bg-white/[0.05] group"
          >
            <span
              className="font-mono-tv text-sm font-bold tabular-nums w-6 text-center"
              style={{ color: ch.color }}
            >
              {ch.number}
            </span>
            <span className="flex-1 min-w-0">
              <span className="block truncate text-[10px] font-semibold text-foreground/80 group-hover:text-foreground transition-colors">
                {ch.name}
              </span>
              <span className="block truncate text-[9px] text-muted-foreground">
                {ch.tagline}
              </span>
            </span>
            <span
              className="h-1 w-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: ch.color }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
