import { useCallback, useEffect, useRef, useState } from "react";
import { CHANNELS, type Channel } from "@/lib/channels";
import { getAmbientEngine, AMBIENT_PRESETS } from "@/components/tv/AmbientSounds";

// ─── Time-of-day definitions ──────────────────────────────────────────────────
export type TimeSlot = {
  id: string;
  label: string;
  hours: [number, number]; // [start, end) in 24h format
  greeting: string;
  channelIds: string[];
  ambientPresetId: string | null;
  // Visual mood
  dimLevel: number; // 0 = normal, 1 = fully dimmed
  saturation: number; // 0 = grayscale, 1 = normal
  warmShift: number; // 0 = none, 1 = warm orange
};

export const TIME_SLOTS: TimeSlot[] = [
  {
    id: "dawn",
    label: "Early Bird",
    hours: [5, 8],
    greeting: "early morning focus",
    channelIds: ["lofi", "focus", "nature", "math", "python"],
    ambientPresetId: "nature",
    dimLevel: 0.1,
    saturation: 0.9,
    warmShift: 0.3,
  },
  {
    id: "morning",
    label: "Morning",
    hours: [8, 12],
    greeting: "good morning — deep work time",
    channelIds: ["tech", "news", "focus", "python", "airadar"],
    ambientPresetId: "study",
    dimLevel: 0,
    saturation: 1,
    warmShift: 0.1,
  },
  {
    id: "afternoon",
    label: "Afternoon",
    hours: [12, 17],
    greeting: "afternoon energy",
    channelIds: ["hits", "workout", "food", "travel", "gaming", "sports"],
    ambientPresetId: "deep-work",
    dimLevel: 0,
    saturation: 1,
    warmShift: 0,
  },
  {
    id: "evening",
    label: "Evening",
    hours: [17, 21],
    greeting: "winding down",
    channelIds: ["comedy", "docs", "anime", "movies", "jazz", "classical"],
    ambientPresetId: "cozy",
    dimLevel: 0.15,
    saturation: 0.95,
    warmShift: 0.4,
  },
  {
    id: "night",
    label: "Night Owl",
    hours: [21, 1],
    greeting: "late night session",
    channelIds: ["synthwave", "jazz", "melancholy", "cyber", "edm"],
    ambientPresetId: "sleep",
    dimLevel: 0.3,
    saturation: 0.85,
    warmShift: 0.2,
  },
  {
    id: "late-night",
    label: "Dead Hours",
    hours: [1, 5],
    greeting: "3AM — time to rest",
    channelIds: ["asmr", "threeam", "melancholy", "lofi", "rainy"],
    ambientPresetId: "sleep",
    dimLevel: 0.5,
    saturation: 0.7,
    warmShift: 0.1,
  },
];

// ─── Auto-pilot engine ────────────────────────────────────────────────────────
type AutoPilotState = {
  enabled: boolean;
  autoSwitchChannel: boolean;
  autoApplyAmbient: boolean;
  autoDim: boolean;
  lastSlotId: string | null;
  lastChannelSwitch: number;
  channelSwitchInterval: number; // ms between auto-switches
};

type AutoPilotCallbacks = {
  onSwitchChannel: (channel: Channel) => void;
  onApplyAmbient: (presetId: string) => void;
  onDimChange: (dim: number, saturation: number, warm: number) => void;
};

const STORAGE_KEY = "tubetv:auto-pilot";

export function getCurrentTimeSlot(): TimeSlot {
  const hour = new Date().getHours();
  return (
    TIME_SLOTS.find((slot) => {
      const [start, end] = slot.hours;
      if (start < end) return hour >= start && hour < end;
      return hour >= start || hour < end;
    }) ?? TIME_SLOTS[TIME_SLOTS.length - 1]
  );
}

export function useAutoPilot(callbacks: AutoPilotCallbacks) {
  const [state, setState] = useState<AutoPilotState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      enabled: false,
      autoSwitchChannel: true,
      autoApplyAmbient: true,
      autoDim: true,
      lastSlotId: null,
      lastChannelSwitch: 0,
      channelSwitchInterval: 30 * 60 * 1000, // 30 minutes
    };
  });

  const currentSlot = useRef<TimeSlot>(getCurrentTimeSlot());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Persist state
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  // Main auto-pilot loop — checks every 60 seconds
  useEffect(() => {
    if (!state.enabled) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    const tick = () => {
      const slot = getCurrentTimeSlot();
      const now = Date.now();

      // Time slot changed — apply everything
      if (slot.id !== currentSlot.current.id) {
        currentSlot.current = slot;

        // Auto-switch ambient
        if (state.autoApplyAmbient && slot.ambientPresetId) {
          callbacks.onApplyAmbient(slot.ambientPresetId);
        }

        // Auto-dim
        if (state.autoDim) {
          callbacks.onDimChange(slot.dimLevel, slot.saturation, slot.warmShift);
        }
      }

      // Auto-switch channel on interval
      if (
        state.autoSwitchChannel &&
        now - state.lastChannelSwitch > state.channelSwitchInterval
      ) {
        const pool = slot.channelIds
          .map((id) => CHANNELS.find((ch) => ch.id === id))
          .filter(Boolean) as Channel[];
        if (pool.length > 0) {
          const random = pool[Math.floor(Math.random() * pool.length)];
          callbacks.onSwitchChannel(random);
          setState((prev) => ({ ...prev, lastChannelSwitch: now }));
        }
      }
    };

    // Run immediately
    tick();

    // Then every 60 seconds
    intervalRef.current = setInterval(tick, 60_000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state.enabled, state.autoSwitchChannel, state.autoApplyAmbient, state.autoDim, state.channelSwitchInterval, state.lastChannelSwitch, callbacks]);

  const toggle = useCallback(() => {
    setState((prev) => ({ ...prev, enabled: !prev.enabled }));
  }, []);

  const updateSetting = useCallback((key: keyof AutoPilotState, value: boolean | number) => {
    setState((prev) => ({ ...prev, [key]: value }));
  }, []);

  return {
    state,
    currentSlot: currentSlot.current,
    toggle,
    updateSetting,
  };
}

// ─── Auto-pilot settings UI component ─────────────────────────────────────────
type AutoPilotPanelProps = {
  enabled: boolean;
  onToggle: () => void;
  autoSwitchChannel: boolean;
  autoApplyAmbient: boolean;
  autoDim: boolean;
  onSettingChange: (key: string, value: boolean | number) => void;
  currentSlot: TimeSlot;
};

export function AutoPilotPanel({
  enabled,
  onToggle,
  autoSwitchChannel,
  autoApplyAmbient,
  autoDim,
  onSettingChange,
  currentSlot,
}: AutoPilotPanelProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn("h-2 w-2 rounded-full", enabled ? "bg-primary animate-pulse" : "bg-zinc-600")} />
          <span className="font-mono-tv text-[10px] uppercase tracking-widest text-muted-foreground">Auto-Pilot</span>
        </div>
        <button
          onClick={onToggle}
          className={cn(
            "rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-all",
            enabled
              ? "bg-primary/20 text-primary border border-primary/30"
              : "bg-white/5 text-muted-foreground border border-white/10 hover:bg-white/10"
          )}
        >
          {enabled ? "ON" : "OFF"}
        </button>
      </div>

      {/* Current slot info */}
      <div className="rounded-xl bg-black/20 border border-white/5 p-3 mb-3">
        <div className="text-[10px] font-mono-tv text-muted-foreground uppercase tracking-wider">Now</div>
        <div className="text-sm font-semibold text-foreground mt-0.5">{currentSlot.label}</div>
        <div className="text-[10px] text-muted-foreground">{currentSlot.greeting}</div>
      </div>

      {/* Settings */}
      <div className="space-y-2">
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-xs text-foreground/80">Auto-switch channels</span>
          <input
            type="checkbox"
            checked={autoSwitchChannel}
            onChange={(e) => onSettingChange("autoSwitchChannel", e.target.checked)}
            className="sr-only peer"
          />
          <div className="relative h-5 w-9 rounded-full bg-white/10 peer-checked:bg-primary/40 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-4" />
        </label>
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-xs text-foreground/80">Auto-apply ambient</span>
          <input
            type="checkbox"
            checked={autoApplyAmbient}
            onChange={(e) => onSettingChange("autoApplyAmbient", e.target.checked)}
            className="sr-only peer"
          />
          <div className="relative h-5 w-9 rounded-full bg-white/10 peer-checked:bg-primary/40 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-4" />
        </label>
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-xs text-foreground/80">Auto-dim at night</span>
          <input
            type="checkbox"
            checked={autoDim}
            onChange={(e) => onSettingChange("autoDim", e.target.checked)}
            className="sr-only peer"
          />
          <div className="relative h-5 w-9 rounded-full bg-white/10 peer-checked:bg-primary/40 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-4" />
        </label>
      </div>

      {enabled && (
        <div className="mt-3 pt-2 border-t border-white/5 text-[9px] font-mono-tv text-muted-foreground text-center">
          Switching channels every 30min · Ambient matches time of day
        </div>
      )}
    </div>
  );
}

// helper import
import { cn } from "@/lib/utils";
