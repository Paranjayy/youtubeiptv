export type FocusPresetId = "deep" | "standard" | "reading" | "burst";

export type FocusPreset = {
  id: FocusPresetId;
  label: string;
  minutes: number;
  breakMinutes: number;
  accent: string;
  blurb: string;
};

export type FocusNote = {
  id: string;
  text: string;
  color: string;
};

export type FocusStroke = {
  color: string;
  width: number;
  points: Array<{ x: number; y: number }>;
};

export const FOCUS_PRESETS: FocusPreset[] = [
  {
    id: "deep",
    label: "Deep",
    minutes: 50,
    breakMinutes: 10,
    accent: "var(--neon-cyan)",
    blurb: "Long-form grind with fewer interruptions.",
  },
  {
    id: "standard",
    label: "Standard",
    minutes: 25,
    breakMinutes: 5,
    accent: "var(--neon-amber)",
    blurb: "Classic Pomodoro for regular study blocks.",
  },
  {
    id: "reading",
    label: "Reading",
    minutes: 45,
    breakMinutes: 10,
    accent: "var(--neon-green)",
    blurb: "Books, papers, and slower attention.",
  },
  {
    id: "burst",
    label: "Burst",
    minutes: 15,
    breakMinutes: 3,
    accent: "var(--neon-pink)",
    blurb: "Fast sprint for getting unstuck.",
  },
];

export const FOCUS_NOTE_COLORS = [
  "#fef3c7",
  "#dbeafe",
  "#dcfce7",
  "#fce7f3",
  "#ede9fe",
];

export function makeFocusNote(text = "", color = FOCUS_NOTE_COLORS[0]): FocusNote {
  return {
    id: globalThis.crypto?.randomUUID?.() || `note-${Math.random().toString(36).slice(2)}`,
    text,
    color,
  };
}

export function makeEmptyStroke(color = "#111827", width = 4): FocusStroke {
  return { color, width, points: [] };
}

export function formatFocusTime(seconds: number) {
  const total = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

