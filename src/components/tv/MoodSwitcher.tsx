import { useCallback, useEffect, useState } from "react";
import { Zap, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAmbientEngine, AMBIENT_PRESETS } from "@/components/tv/AmbientSounds";
import { CHANNELS, type Channel } from "@/lib/channels";

type MoodPreset = {
  id: string;
  label: string;
  emoji: string;
  description: string;
  channelId: string;
  ambientPresetId: string;
  shortcut: string;
};

const MOOD_PRESETS: MoodPreset[] = [
  {
    id: "study",
    label: "Study",
    emoji: "📚",
    description: "Focus mode with rain and keyboard",
    channelId: "focus",
    ambientPresetId: "study",
    shortcut: "1",
  },
  {
    id: "sleep",
    label: "Sleep",
    emoji: "🌙",
    description: "ASMR and gentle sounds",
    channelId: "asmr",
    ambientPresetId: "sleep",
    shortcut: "2",
  },
  {
    id: "work",
    label: "Deep Work",
    emoji: "🧠",
    description: "White noise, no distractions",
    channelId: "focus",
    ambientPresetId: "deep-work",
    shortcut: "3",
  },
  {
    id: "chill",
    label: "Chill",
    emoji: "🛋️",
    description: "Lofi beats and rain",
    channelId: "lofi",
    ambientPresetId: "cozy",
    shortcut: "4",
  },
  {
    id: "energy",
    label: "Energy",
    emoji: "⚡",
    description: "Workout vibes and EDM",
    channelId: "workout",
    ambientPresetId: undefined,
    shortcut: "5",
  },
  {
    id: "night",
    label: "Night Owl",
    emoji: "🦉",
    description: "Synthwave and neon",
    channelId: "synthwave",
    ambientPresetId: "cyberpunk",
    shortcut: "6",
  },
  {
    id: "nature",
    label: "Nature",
    emoji: "🌿",
    description: "Birds, wind, forest",
    channelId: "nature",
    ambientPresetId: "nature",
    shortcut: "7",
  },
  {
    id: "cozy",
    label: "Cozy",
    emoji: "🔥",
    description: "Fireplace and jazz",
    channelId: "jazz",
    ambientPresetId: "cozy",
    shortcut: "8",
  },
];

type MoodSwitcherProps = {
  onSwitchChannel: (channel: Channel) => void;
};

export function MoodSwitcher({ onSwitchChannel }: MoodSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [lastApplied, setLastApplied] = useState<string | null>(null);

  const applyPreset = useCallback(
    (preset: MoodPreset) => {
      // Switch channel
      const channel = CHANNELS.find((ch) => ch.id === preset.channelId);
      if (channel) onSwitchChannel(channel);

      // Apply ambient
      if (preset.ambientPresetId) {
        const engine = getAmbientEngine();
        engine.applyPreset(preset.ambientPresetId);
      }

      setLastApplied(preset.id);
      setTimeout(() => setLastApplied(null), 2000);
    },
    [onSwitchChannel],
  );

  // Keyboard shortcuts: Alt+1 through Alt+8
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      // Alt+Z to toggle mood panel
      if (e.altKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        setOpen((prev) => !prev);
        return;
      }

      // Alt+1-8 to apply presets
      if (e.altKey && e.key >= "1" && e.key <= "8") {
        e.preventDefault();
        const idx = parseInt(e.key) - 1;
        if (MOOD_PRESETS[idx]) {
          applyPreset(MOOD_PRESETS[idx]);
        }
        return;
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [applyPreset]);

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full border transition-all shadow-lg",
          open
            ? "bg-primary border-primary/50 shadow-[0_0_20px_rgba(79,174,123,0.3)]"
            : "bg-[#0a0c10]/90 border-white/10 hover:border-primary/30 hover:bg-[#0a0c10]",
        )}
        title="Mood Switcher (Alt+Z)"
      >
        {open ? <X className="h-5 w-5" /> : <Zap className="h-5 w-5 text-primary" />}
      </button>

      {/* Mood panel */}
      {open && (
        <div className="fixed bottom-20 right-6 z-50 w-72 rounded-3xl border border-white/10 bg-[#0a0c10]/95 backdrop-blur-xl p-4 shadow-2xl shadow-black/50 animate-scale-in">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-primary" />
              <span className="font-mono-tv text-[10px] uppercase tracking-widest text-muted-foreground">
                Quick Moods
              </span>
            </div>
            <span className="font-mono-tv text-[9px] text-muted-foreground/60">Alt+1-8</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {MOOD_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset)}
                className={cn(
                  "flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all",
                  lastApplied === preset.id
                    ? "border-primary/50 bg-primary/10 shadow-[0_0_10px_rgba(79,174,123,0.15)]"
                    : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10",
                )}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-base">{preset.emoji}</span>
                  <span className="text-[10px] font-bold text-foreground/90">{preset.label}</span>
                </div>
                <span className="text-[9px] text-muted-foreground leading-tight">
                  {preset.description}
                </span>
                <span className="font-mono-tv text-[8px] text-muted-foreground/40 mt-auto">
                  Alt+{preset.shortcut}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-3 pt-2 border-t border-white/5 text-[9px] font-mono-tv text-muted-foreground text-center">
            Press <kbd className="px-1 py-0.5 rounded bg-white/10 text-foreground/60">Alt+Z</kbd> to
            toggle ·{" "}
            <kbd className="px-1 py-0.5 rounded bg-white/10 text-foreground/60">Alt+1-8</kbd> quick
            apply
          </div>
        </div>
      )}
    </>
  );
}
