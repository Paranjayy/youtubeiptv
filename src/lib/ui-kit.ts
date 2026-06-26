/**
 * UI Kit — centralized color/styling tokens for TubeTV.
 * Maps modes, categories, and content types to neon palette CSS vars.
 */

/** Mode-level accent colors (CSS variable names from styles.css) */
export const MODE_COLORS = {
  yt: {
    css: "var(--neon-green)",
    bgClass: "bg-[color:oklch(0.82_0.18_152_/_0.12)]",
    borderClass: "border-l-[color:oklch(0.82_0.18_152)]",
    textClass: "text-[color:oklch(0.82_0.18_152)]",
    dotClass: "bg-[color:oklch(0.82_0.18_152)]",
    hoverClass: "hover:bg-[color:oklch(0.82_0.18_152_/_0.08)]",
    glowStyle: "0 0 8px oklch(0.82 0.18 152 / 0.5), 0 0 16px oklch(0.82 0.18 152 / 0.2)",
    label: "YouTube",
    emoji: "📺",
  },
  iptv: {
    css: "var(--neon-cyan)",
    bgClass: "bg-[color:oklch(0.84_0.14_205_/_0.12)]",
    borderClass: "border-l-[color:oklch(0.84_0.14_205)]",
    textClass: "text-[color:oklch(0.84_0.14_205)]",
    dotClass: "bg-[color:oklch(0.84_0.14_205)]",
    hoverClass: "hover:bg-[color:oklch(0.84_0.14_205_/_0.08)]",
    glowStyle: "0 0 8px oklch(0.84 0.14 205 / 0.5), 0 0 16px oklch(0.84 0.14 205 / 0.2)",
    label: "Live TV",
    emoji: "🌐",
  },
  radio: {
    css: "var(--neon-amber)",
    bgClass: "bg-[color:oklch(0.86_0.16_72_/_0.12)]",
    borderClass: "border-l-[color:oklch(0.86_0.16_72)]",
    textClass: "text-[color:oklch(0.86_0.16_72)]",
    dotClass: "bg-[color:oklch(0.86_0.16_72)]",
    hoverClass: "hover:bg-[color:oklch(0.86_0.16_72_/_0.08)]",
    glowStyle: "0 0 8px oklch(0.86 0.16 72 / 0.5), 0 0 16px oklch(0.86 0.16 72 / 0.2)",
    label: "Radio",
    emoji: "📻",
  },
} as const;

export type TvMode = keyof typeof MODE_COLORS;

/** Category-level accent colors for channel sidebar groupings */
export const CATEGORY_COLORS: Record<
  string,
  { text: string; bg: string; border: string; label: string }
> = {
  Music: {
    text: "text-[color:oklch(0.84_0.14_205)]",
    bg: "bg-[color:oklch(0.84_0.14_205_/_0.08)]",
    border: "border-[color:oklch(0.84_0.14_205_/_0.3)]",
    label: "🎵 Music",
  },
  Mood: {
    text: "text-[color:oklch(0.72_0.16_305)]",
    bg: "bg-[color:oklch(0.72_0.16_305_/_0.08)]",
    border: "border-[color:oklch(0.72_0.16_305_/_0.3)]",
    label: "✨ Mood",
  },
  Science: {
    text: "text-[color:oklch(0.84_0.14_205)]",
    bg: "bg-[color:oklch(0.84_0.14_205_/_0.08)]",
    border: "border-[color:oklch(0.84_0.14_205_/_0.3)]",
    label: "🔬 Science",
  },
  Tech: {
    text: "text-[color:oklch(0.84_0.14_205)]",
    bg: "bg-[color:oklch(0.84_0.14_205_/_0.08)]",
    border: "border-[color:oklch(0.84_0.14_205_/_0.3)]",
    label: "💻 Tech",
  },
  Nature: {
    text: "text-[color:oklch(0.82_0.18_152)]",
    bg: "bg-[color:oklch(0.82_0.18_152_/_0.08)]",
    border: "border-[color:oklch(0.82_0.18_152_/_0.3)]",
    label: "🌿 Nature",
  },
  Comedy: {
    text: "text-[color:oklch(0.86_0.16_72)]",
    bg: "bg-[color:oklch(0.86_0.16_72_/_0.08)]",
    border: "border-[color:oklch(0.86_0.16_72_/_0.3)]",
    label: "😄 Comedy",
  },
  Gaming: {
    text: "text-[color:oklch(0.74_0.18_335)]",
    bg: "bg-[color:oklch(0.74_0.18_335_/_0.08)]",
    border: "border-[color:oklch(0.74_0.18_335_/_0.3)]",
    label: "🎮 Gaming",
  },
  Docs: {
    text: "text-[color:oklch(0.86_0.16_72)]",
    bg: "bg-[color:oklch(0.86_0.16_72_/_0.08)]",
    border: "border-[color:oklch(0.86_0.16_72_/_0.3)]",
    label: "🎞️ Docs",
  },
  Anime: {
    text: "text-[color:oklch(0.72_0.16_305)]",
    bg: "bg-[color:oklch(0.72_0.16_305_/_0.08)]",
    border: "border-[color:oklch(0.72_0.16_305_/_0.3)]",
    label: "🎌 Anime",
  },
  Sports: {
    text: "text-[color:oklch(0.82_0.18_152)]",
    bg: "bg-[color:oklch(0.82_0.18_152_/_0.08)]",
    border: "border-[color:oklch(0.82_0.18_152_/_0.3)]",
    label: "⚽ Sports",
  },
  Food: {
    text: "text-[color:oklch(0.86_0.16_72)]",
    bg: "bg-[color:oklch(0.86_0.16_72_/_0.08)]",
    border: "border-[color:oklch(0.86_0.16_72_/_0.3)]",
    label: "🍜 Food",
  },
  Travel: {
    text: "text-[color:oklch(0.84_0.14_205)]",
    bg: "bg-[color:oklch(0.84_0.14_205_/_0.08)]",
    border: "border-[color:oklch(0.84_0.14_205_/_0.3)]",
    label: "✈️ Travel",
  },
  Kids: {
    text: "text-[color:oklch(0.88_0.22_128)]",
    bg: "bg-[color:oklch(0.88_0.22_128_/_0.08)]",
    border: "border-[color:oklch(0.88_0.22_128_/_0.3)]",
    label: "🧸 Kids",
  },
  Art: {
    text: "text-[color:oklch(0.72_0.16_305)]",
    bg: "bg-[color:oklch(0.72_0.16_305_/_0.08)]",
    border: "border-[color:oklch(0.72_0.16_305_/_0.3)]",
    label: "🎨 Art",
  },
  Movies: {
    text: "text-[color:oklch(0.74_0.18_335)]",
    bg: "bg-[color:oklch(0.74_0.18_335_/_0.08)]",
    border: "border-[color:oklch(0.74_0.18_335_/_0.3)]",
    label: "🎬 Movies",
  },
  News: {
    text: "text-[color:oklch(0.84_0.14_205)]",
    bg: "bg-[color:oklch(0.84_0.14_205_/_0.08)]",
    border: "border-[color:oklch(0.84_0.14_205_/_0.3)]",
    label: "📰 News",
  },
  Wellness: {
    text: "text-[color:oklch(0.82_0.18_152)]",
    bg: "bg-[color:oklch(0.82_0.18_152_/_0.08)]",
    border: "border-[color:oklch(0.82_0.18_152_/_0.3)]",
    label: "💆 Wellness",
  },
  Auto: {
    text: "text-[color:oklch(0.74_0.18_335)]",
    bg: "bg-[color:oklch(0.74_0.18_335_/_0.08)]",
    border: "border-[color:oklch(0.74_0.18_335_/_0.3)]",
    label: "🚗 Auto",
  },
  Screensaver: {
    text: "text-[color:oklch(0.84_0.14_205)]",
    bg: "bg-[color:oklch(0.84_0.14_205_/_0.08)]",
    border: "border-[color:oklch(0.84_0.14_205_/_0.3)]",
    label: "🌍 Screensaver",
  },
  Learn: {
    text: "text-[color:oklch(0.82_0.18_152)]",
    bg: "bg-[color:oklch(0.82_0.18_152_/_0.08)]",
    border: "border-[color:oklch(0.82_0.18_152_/_0.3)]",
    label: "📚 Learn",
  },
};

export function getCategoryColor(category: string) {
  return (
    CATEGORY_COLORS[category] ?? {
      text: "text-muted-foreground",
      bg: "bg-muted/10",
      border: "border-muted/30",
      label: category,
    }
  );
}

/** Route-level accent colors used in jump palette badges and nav */
export const ROUTE_COLORS = {
  "/discover": { label: "Discover", emoji: "🧭", neon: "oklch(0.84 0.14 205)" },
  "/playground": { label: "Playground", emoji: "🎮", neon: "oklch(0.74 0.18 335)" },
  "/focus": { label: "Focus", emoji: "⏱️", neon: "oklch(0.86 0.16 72)" },
  "/wordle": { label: "Wordle", emoji: "🟩", neon: "oklch(0.82 0.18 152)" },
  "/vibes": { label: "Vibes", emoji: "🎵", neon: "oklch(0.8 0.14 180)" },
  "/news": { label: "News", emoji: "📰", neon: "oklch(0.84 0.14 205)" },
  "/roadmap": { label: "Roadmap", emoji: "🗺️", neon: "oklch(0.72 0.16 305)" },
  "/reader": { label: "Reader", emoji: "📖", neon: "oklch(0.86 0.16 72)" },
  "/": { label: "TV", emoji: "📺", neon: "oklch(0.82 0.18 152)" },
  "/sports": { label: "Sports", emoji: "🏆", neon: "oklch(0.82 0.18 152)" },
} as const;
