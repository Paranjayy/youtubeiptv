import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  BookOpen,
  Clapperboard,
  Dice5,
  Gamepad2,
  Globe2,
  Loader2,
  Music4,
  RotateCcw,
  Sparkles,
  Timer,
  Tv,
} from "lucide-react";
import {
  getDailyPack,
  getPlaygroundDayKey,
  PLAYGROUND_CATEGORIES,
  type PlaygroundCategoryId,
  type PlaygroundRound,
} from "@/lib/playground";
import { cn } from "@/lib/utils";

// ─── Web Audio API Sound Effects ──────────────────────────────────────────────
function playSynthSound(type: "correct" | "incorrect") {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (type === "correct") {
      // Ascending happy chime (C5 then G5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      gain1.gain.setValueAtTime(0.08, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc1.start(ctx.currentTime);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(783.99, ctx.currentTime + 0.08); // G5
      gain2.gain.setValueAtTime(0.08, ctx.currentTime + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc2.start(ctx.currentTime + 0.08);

      osc1.stop(ctx.currentTime + 0.15);
      osc2.stop(ctx.currentTime + 0.25);
    } else {
      // Downward buzz (130Hz -> 80Hz)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(130, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch (err) {
    console.warn("Failed to play sound effect:", err);
  }
}

// Play synthesized theme song/rhythm melody using simple oscillators
function playMusicMelody(roundId: string, setPlayingState: (playing: boolean) => void) {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    setPlayingState(true);

    // Note frequencies
    const C3 = 130.81, E3 = 164.81, G3 = 196.00, A3 = 220.00, B3 = 246.94;
    const C4 = 261.63, D4 = 293.66, Eb4 = 311.13, E4 = 329.63, F4 = 349.23, G4 = 392.00, A4 = 440.00, Bb4 = 466.16, B4 = 493.88;
    const C5 = 523.25, D5 = 587.33, E5 = 659.25, F5 = 698.46, G5 = 783.99, A5 = 880.00;

    let notes: { note: number; duration: number }[] = [];

    if (roundId === "music-queen") {
      // Queen - Bohemian Rhapsody intro chord walk-up
      notes = [
        { note: Bb4, duration: 0.22 },
        { note: D4, duration: 0.16 },
        { note: F4, duration: 0.16 },
        { note: Bb4, duration: 0.22 },
        { note: C5, duration: 0.16 },
        { note: D5, duration: 0.22 },
        { note: E5, duration: 0.5 },
      ];
    } else if (roundId === "music-rahman") {
      // A. R. Rahman style happy melody
      notes = [
        { note: C5, duration: 0.2 },
        { note: D5, duration: 0.2 },
        { note: G5, duration: 0.4 },
        { note: F5, duration: 0.2 },
        { note: E5, duration: 0.2 },
        { note: D5, duration: 0.2 },
        { note: C5, duration: 0.4 },
      ];
    } else if (roundId === "music-daftpunk") {
      // Daft Punk style square arpeggiator
      notes = [
        { note: E3, duration: 0.12 },
        { note: E4, duration: 0.12 },
        { note: G3, duration: 0.12 },
        { note: G4, duration: 0.12 },
        { note: A3, duration: 0.12 },
        { note: A4, duration: 0.12 },
        { note: B3, duration: 0.12 },
        { note: B4, duration: 0.4 },
      ];
    } else if (roundId === "music-radiohead") {
      // Radiohead - No Surprises glockenspiel theme
      notes = [
        { note: A4, duration: 0.18 },
        { note: C5, duration: 0.18 },
        { note: E5, duration: 0.18 },
        { note: A5, duration: 0.18 },
        { note: G5, duration: 0.18 },
        { note: E5, duration: 0.18 },
        { note: C5, duration: 0.18 },
        { note: A4, duration: 0.35 },
      ];
    } else if (roundId === "music-beethoven") {
      // Beethoven's 5th motif
      notes = [
        { note: G4, duration: 0.15 },
        { note: G4, duration: 0.15 },
        { note: G4, duration: 0.15 },
        { note: Eb4, duration: 0.6 },
        { note: 0, duration: 0.15 }, // rest
        { note: F4, duration: 0.15 },
        { note: F4, duration: 0.15 },
        { note: F4, duration: 0.15 },
        { note: D4, duration: 0.7 },
      ];
    } else {
      // Generic chime
      notes = [
        { note: C4, duration: 0.15 },
        { note: E4, duration: 0.15 },
        { note: G4, duration: 0.15 },
        { note: C5, duration: 0.4 },
      ];
    }

    let timeOffset = ctx.currentTime;
    notes.forEach((item) => {
      if (item.note > 0) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = roundId === "music-daftpunk" ? "square" : "triangle";
        osc.frequency.setValueAtTime(item.note, timeOffset);

        gain.gain.setValueAtTime(0.0, timeOffset);
        gain.gain.linearRampToValueAtTime(0.06, timeOffset + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, timeOffset + item.duration - 0.02);

        osc.start(timeOffset);
        osc.stop(timeOffset + item.duration);
      }
      timeOffset += item.duration;
    });

    setTimeout(() => {
      setPlayingState(false);
    }, notes.reduce((acc, curr) => acc + curr.duration, 0) * 1000 + 100);
  } catch (err) {
    console.warn("Failed to play melody:", err);
    setPlayingState(false);
  }
}

// ─── Custom Interactive Component: Geography Radar ─────────────────────────────
const GeoRadar = ({
  roundId,
  solved,
  isCorrect,
}: {
  roundId: string;
  solved: boolean;
  isCorrect: boolean;
}) => {
  const seed = roundId.charCodeAt(roundId.length - 1) || 0;
  const cx = 50 + (seed % 30) - 15;
  const cy = 50 + ((seed * 7) % 30) - 15;

  return (
    <div className="relative mx-auto my-4 flex aspect-square w-full max-w-[260px] items-center justify-center rounded-full border border-cyan-500/20 bg-[#080d16] overflow-hidden">
      <svg viewBox="0 0 100 100" className="h-full w-full text-cyan-500/30">
        <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 2" />
        <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="0.5" />
        <circle cx="50" cy="50" r="15" fill="none" stroke="currentColor" strokeWidth="0.5" />
        <line x1="50" y1="5" x2="50" y2="95" stroke="currentColor" strokeWidth="0.3" />
        <line x1="5" y1="50" x2="95" y2="50" stroke="currentColor" strokeWidth="0.3" />
        
        {/* Animated Sweep */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="url(#radarSweep)"
          className="origin-center animate-spin"
          style={{ animationDuration: "5s" }}
        />

        <defs>
          <linearGradient id="radarSweep" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(34, 211, 238, 0.4)" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>

        {solved && (
          <g>
            <circle cx={cx} cy={cy} r="4" fill="none" stroke={isCorrect ? "#10b981" : "#ef4444"} strokeWidth="0.75" className="animate-ping" />
            <circle cx={cx} cy={cy} r="1.5" fill={isCorrect ? "#10b981" : "#ef4444"} />
            <line x1={cx - 6} y1={cy} x2={cx + 6} y2={cy} stroke={isCorrect ? "#10b981" : "#ef4444"} strokeWidth="0.4" />
            <line x1={cx} y1={cy - 6} x2={cx} y2={cy + 6} stroke={isCorrect ? "#10b981" : "#ef4444"} strokeWidth="0.4" />
            <text x={cx + 5} y={cy - 4} fontSize="3.5" fill={isCorrect ? "#10b981" : "#ef4444"} className="font-mono font-bold">
              {isCorrect ? "TARGET LOCK" : "LOCATION OFFSET"}
            </text>
          </g>
        )}
      </svg>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded bg-cyan-950/80 border border-cyan-500/30 px-2.5 py-0.5 font-mono text-[8px] uppercase tracking-widest text-cyan-400">
        {solved ? "Coordinates Lock" : "Radar Scan Active"}
      </div>
    </div>
  );
};

// ─── Custom Interactive Component: CRT Screen De-Fuzzer ──────────────────────
const ScreenCRT = ({
  prompt,
  hint,
  deFuzzed,
  onDeFuzz,
}: {
  prompt: string;
  hint: string;
  deFuzzed: boolean;
  onDeFuzz: () => void;
}) => {
  return (
    <div className="relative mx-auto my-4 w-full max-w-xl overflow-hidden rounded-3xl border-4 border-zinc-700 bg-zinc-950 shadow-[inset_0_0_20px_rgba(0,0,0,0.9),0_0_20px_rgba(245,158,11,0.1)]">
      {/* CRT Scanline Filter */}
      <div className="pointer-events-none absolute inset-0 z-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.04),rgba(0,255,0,0.01),rgba(0,0,255,0.04))] bg-[size:100%_4px,6px_100%]" />
      
      <div className="relative flex min-h-[140px] flex-col justify-between p-5">
        {!deFuzzed && (
          <div
            className="absolute inset-0 z-0 opacity-40 mix-blend-screen"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0%200%20200%20200'%20xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter%20id='noise'%3E%3CfeTurbulence%20type='fractalNoise'%20baseFrequency='0.85'%20numOctaves='3'/%3E%3C/filter%3E%3Crect%20width='100%25'%20height='100%25'%20filter='url(%23noise)'/%3E%3C/svg%3E")`,
            }}
          />
        )}

        <div
          className={cn(
            "relative z-10 font-mono text-amber-200 transition-all duration-700",
            deFuzzed ? "blur-none opacity-100 scale-100" : "blur-[5px] opacity-45 scale-[0.98]"
          )}
        >
          <div className="mb-2 text-[9px] font-bold uppercase tracking-[0.25em] text-amber-500">
            [Broadcast Feed Link]
          </div>
          <p className="text-sm font-semibold leading-relaxed text-amber-100/90">{prompt}</p>
          <p className="mt-2 text-xs italic text-zinc-400">Hint: {hint}</p>
        </div>

        {!deFuzzed ? (
          <div className="relative z-20 mt-4 flex justify-center">
            <button
              onClick={onDeFuzz}
              className="rounded-xl bg-amber-500 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-zinc-950 transition-all shadow-[0_0_15px_rgba(245,158,11,0.45)] hover:scale-105 hover:bg-amber-400 active:scale-95"
            >
              📺 Tune Signal (De-Fuzz)
            </button>
          </div>
        ) : (
          <div className="relative z-10 mt-3 text-right font-mono text-[8px] font-semibold uppercase tracking-widest text-amber-500/50">
            Decoder Lock · Signal Tuned
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Custom Interactive Component: Music Pulsing Visualizer ──────────────────
const MusicVisualizer = ({
  playing,
  onPlay,
}: {
  playing: boolean;
  onPlay: () => void;
}) => {
  return (
    <div className="relative mx-auto my-4 flex w-full max-w-[240px] flex-col items-center justify-center rounded-2xl border border-pink-500/20 bg-black/40 p-4 shadow-xl">
      <div className="relative flex h-20 w-20 items-center justify-center">
        <div
          className={cn(
            "absolute inset-0 rounded-full border border-pink-500/40 transition-all duration-300",
            playing ? "animate-ping opacity-60" : "scale-100 opacity-20"
          )}
        />
        <button
          onClick={onPlay}
          className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-pink-500 text-zinc-950 transition-all shadow-[0_0_15px_rgba(244,63,94,0.4)] hover:bg-pink-400 active:scale-90"
        >
          {playing ? (
            <span className="flex gap-1">
              <span className="h-3 w-1.5 animate-pulse rounded-full bg-zinc-950" />
              <span className="h-3 w-1.5 animate-pulse rounded-full bg-zinc-950" style={{ animationDelay: "0.15s" }} />
            </span>
          ) : (
            <svg viewBox="0 0 24 24" className="ml-1 h-6 w-6 fill-current">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
      </div>

      <div className="mt-4 flex h-6 items-end gap-1">
        {Array.from({ length: 12 }).map((_, i) => {
          const h = 4 + (i * 3) % 14;
          return (
            <div
              key={i}
              className="w-1 bg-pink-500 rounded-t transition-all duration-150"
              style={{
                height: playing ? `${h + Math.floor(Math.random() * 8)}px` : "4px",
                animation: playing ? "eqPulse 0.5s ease-in-out infinite alternate" : "none",
                animationDelay: `${i * 0.04}s`,
              }}
            />
          );
        })}
      </div>
      <span className="mt-3 font-mono text-[9px] uppercase tracking-widest text-pink-400/80">
        {playing ? "Synthesizing clue melody..." : "Listen Clue Melody"}
      </span>

      <style>{`
        @keyframes eqPulse {
          0% { transform: scaleY(0.5); }
          100% { transform: scaleY(1.4); }
        }
      `}</style>
    </div>
  );
};

// ─── Route Definition ──────────────────────────────────────────────────────────
export const Route = createFileRoute("/playground")({
  head: () => ({
    meta: [
      { title: "Playground - TubeTV" },
      {
        name: "description",
        content:
          "Daily Geo, Music, Screen, Anime, and Books guessers with a playful launchpad for future games.",
      },
      { property: "og:title", content: "Playground - TubeTV" },
      {
        property: "og:description",
        content:
          "A daily puzzle deck for geo, music, movies, anime, and books in one playful route.",
      },
    ],
  }),
  component: PlaygroundPage,
});

const PROGRESS_KEY = "tubetv:playground-progress";
const STATS_KEY = "tubetv:playground-lifetime-stats";

interface LifetimeStats {
  solvedCount: number;
  correctCount: number;
  sweepCount: number;
  lastDate: string | null;
}

const DEFAULT_STATS: LifetimeStats = {
  solvedCount: 0,
  correctCount: 0,
  sweepCount: 0,
  lastDate: null,
};

function roundIcon(category: PlaygroundCategoryId) {
  if (category === "geo") return Globe2;
  if (category === "music") return Music4;
  if (category === "screen") return Clapperboard;
  if (category === "anime") return Sparkles;
  return BookOpen;
}

function getRank(correctCount: number) {
  if (correctCount === 0) return "Arcade Cadet";
  if (correctCount < 5) return "Terminal Rookie";
  if (correctCount < 10) return "Byte Hacker";
  if (correctCount < 20) return "Console Specialist";
  return "Retro Legend";
}

function PlaygroundPage() {
  const [dayKey] = useState(() => getPlaygroundDayKey());
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [hydrated, setHydrated] = useState(false);
  const [playingMusicId, setPlayingMusicId] = useState<string | null>(null);
  const [deFuzzedMap, setDeFuzzedMap] = useState<Record<string, boolean>>({});

  // Lifetime Stats
  const [lifetimeStats, setLifetimeStats] = useState<LifetimeStats>(DEFAULT_STATS);

  const dailyPack = useMemo(() => getDailyPack(dayKey), [dayKey]);

  // Load state and stats
  useEffect(() => {
    try {
      const rawProgress = localStorage.getItem(PROGRESS_KEY);
      if (rawProgress) {
        const parsed = JSON.parse(rawProgress) as { dayKey?: string; answers?: AnswerMap };
        if (parsed?.dayKey === dayKey && parsed.answers) {
          setAnswers(parsed.answers);
        }
      }
      const rawStats = localStorage.getItem(STATS_KEY);
      if (rawStats) {
        setLifetimeStats(JSON.parse(rawStats));
      }
    } catch {
      // Ignore storage block
    } finally {
      setHydrated(true);
    }
  }, [dayKey]);

  // Save Progress
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify({ dayKey, answers }));
    } catch {
      // Ignore
    }
  }, [answers, dayKey, hydrated]);

  const completed = dailyPack.filter(({ round }) => answers[round.id] != null).length;
  const correct = dailyPack.filter(
    ({ round }) => answers[round.id] != null && answers[round.id] === round.answerIndex,
  ).length;

  const streakLabel =
    correct === dailyPack.length ? "clean sweep" : `${correct}/${dailyPack.length} hot`;

  const answerRound = (round: PlaygroundRound, index: number) => {
    if (answers[round.id] != null) return; // locked

    const isCorrect = index === round.answerIndex;
    playSynthSound(isCorrect ? "correct" : "incorrect");

    setAnswers((current) => {
      const updated = { ...current, [round.id]: index };
      
      // Update lifetime stats
      const newStats = { ...lifetimeStats };
      newStats.solvedCount += 1;
      if (isCorrect) newStats.correctCount += 1;

      // Check sweep
      const solvedRounds = dailyPack.filter(({ round: r }) => updated[r.id] != null);
      if (solvedRounds.length === dailyPack.length) {
        const correctRounds = dailyPack.filter(
          ({ round: r }) => updated[r.id] != null && updated[r.id] === r.answerIndex,
        );
        if (correctRounds.length === dailyPack.length && lifetimeStats.lastDate !== dayKey) {
          newStats.sweepCount += 1;
          newStats.lastDate = dayKey;
        }
      }
      setLifetimeStats(newStats);
      try {
        localStorage.setItem(STATS_KEY, JSON.stringify(newStats));
      } catch {
        // Ignore
      }
      return updated;
    });
  };

  const resetRound = (round: PlaygroundRound) => {
    setAnswers((current) => {
      const next = { ...current };
      delete next[round.id];
      return next;
    });
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050608] text-zinc-100">
      <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] [background-size:36px_36px]" />
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-amber-500/5 to-transparent" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="font-mono-tv text-[10px] uppercase tracking-[0.45em] text-amber-200/80">
              Playground
            </div>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-zinc-50 sm:text-5xl">
              Daily guessers, built like a game cabinet.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-300 sm:text-base">
              Five quick rounds. One for geography, music, screen culture, anime, and books. Play
              with interactive tools and chimes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-100 transition-colors hover:bg-white/10"
            >
              <Tv className="h-4 w-4" /> TV
            </Link>
            <Link
              to="/discover"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-100 transition-colors hover:bg-white/10"
            >
              <Sparkles className="h-4 w-4" /> Discover
            </Link>
            <Link
              to="/focus"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-100 transition-colors hover:bg-white/10"
            >
              <Timer className="h-4 w-4" /> Focus
            </Link>
            <button
              onClick={() => {
                setAnswers({});
                setDeFuzzedMap({});
              }}
              className="inline-flex items-center gap-2 rounded-full bg-amber-200 px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-amber-100"
            >
              <RotateCcw className="h-4 w-4" /> Reset Today
            </button>
          </div>
        </header>

        <section className="mt-4 grid gap-4 lg:grid-cols-[1.35fr_0.9fr]">
          <article className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/30 backdrop-blur-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 font-mono-tv text-[10px] uppercase tracking-[0.35em] text-zinc-400">
                  <Dice5 className="h-3.5 w-3.5" /> Daily pack
                </div>
                <div className="mt-2 text-xl font-bold tracking-tight text-zinc-100">
                  {dayKey} · {completed} solved · {streakLabel}
                </div>
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono-tv text-[10px] uppercase tracking-widest text-zinc-300">
                {hydrated ? "synced" : "loading"}
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              {dailyPack.map(({ category, round }) => {
                const Icon = roundIcon(category.id);
                const selected = answers[round.id];
                const solved = selected != null;
                const isCorrect = selected === round.answerIndex;

                return (
                  <section
                    key={round.id}
                    className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/25 shadow-sm"
                    style={{ ["--accent" as string]: category.accent }}
                  >
                    <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-4">
                      <div className="flex min-w-0 items-start gap-3">
                        <div
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-zinc-950 font-bold"
                          style={{ backgroundColor: category.accent }}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-bold uppercase tracking-[0.25em] text-zinc-400">
                              {category.label}
                            </div>
                            <div className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 font-mono-tv text-[9px] uppercase tracking-widest text-zinc-400">
                              {round.sourceLabel}
                            </div>
                          </div>
                          <div className="mt-1 text-lg font-semibold tracking-tight text-zinc-100">
                            {round.title}
                          </div>
                        </div>
                      </div>
                      <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono-tv text-[10px] uppercase tracking-widest text-zinc-400">
                        {solved ? (isCorrect ? "correct" : "missed") : "pending"}
                      </div>
                    </div>

                    <div className="space-y-4 px-4 py-4">
                      {/* Category-Specific Visual Clues */}
                      {category.id === "geo" && (
                        <GeoRadar roundId={round.id} solved={solved} isCorrect={isCorrect} />
                      )}

                      {category.id === "music" && (
                        <MusicVisualizer
                          playing={playingMusicId === round.id}
                          onPlay={() => {
                            playMusicMelody(round.id, (isPlaying) => {
                              setPlayingMusicId(isPlaying ? round.id : null);
                            });
                          }}
                        />
                      )}

                      {(category.id === "screen" || category.id === "anime") && (
                        <ScreenCRT
                          prompt={round.prompt}
                          hint={round.hint}
                          deFuzzed={!!deFuzzedMap[round.id] || solved}
                          onDeFuzz={() =>
                            setDeFuzzedMap((prev) => ({ ...prev, [round.id]: true }))
                          }
                        />
                      )}

                      {category.id === "books" && (
                        <div>
                          <div className="font-mono-tv text-[10px] uppercase tracking-[0.35em] text-zinc-400">
                            Clue
                          </div>
                          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-200">
                            {round.prompt}
                          </p>
                          <p className="mt-2 text-xs italic leading-5 text-zinc-400">{round.hint}</p>
                        </div>
                      )}

                      <div className="grid gap-2 sm:grid-cols-2">
                        {round.choices.map((choice, index) => {
                          const active = selected === index;
                          const correctChoice = index === round.answerIndex;
                          return (
                            <button
                              key={choice.label}
                              disabled={solved}
                              onClick={() => answerRound(round, index)}
                              className={cn(
                                "group rounded-2xl border px-4 py-3 text-left transition-all",
                                solved ? "cursor-default" : "hover:-translate-y-0.5",
                                active
                                  ? correctChoice
                                    ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
                                    : "border-rose-500/50 bg-rose-500/10 text-rose-300"
                                  : solved && correctChoice
                                  ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-400/80"
                                  : "border-white/10 bg-white/5 hover:border-white/20 text-zinc-100",
                              )}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="font-semibold tracking-tight">{choice.label}</div>
                                <ArrowUpRight
                                  className={cn(
                                    "h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5",
                                    active ? "opacity-100" : "opacity-30",
                                  )}
                                />
                              </div>
                              {choice.detail && (
                                <div className="mt-1 text-xs text-zinc-400">{choice.detail}</div>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {solved && (
                        <div
                          className={cn(
                            "rounded-2xl border p-4 text-sm leading-6",
                            isCorrect
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                              : "border-rose-500/30 bg-rose-500/10 text-rose-300",
                          )}
                        >
                          <div className="font-semibold tracking-tight">
                            {isCorrect ? "Nice hit." : "Not quite."} {round.explanation}
                          </div>
                          <button
                            onClick={() => resetRound(round)}
                            className="mt-3 inline-flex items-center gap-2 rounded-full border border-current/20 bg-white/10 hover:bg-white/20 text-zinc-100 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.25em]"
                          >
                            Try again
                          </button>
                        </div>
                      )}
                    </div>
                  </section>
                );
              })}
            </div>
          </article>

          <aside className="space-y-4">
            {/* High-Score Leaderboard Cabinet */}
            <article className="relative overflow-hidden rounded-[2rem] border border-cyan-500/30 bg-[#0a0f1d] p-5 text-zinc-50 shadow-[0_24px_60px_rgba(0,0,0,0.4)]">
              {/* Scanline overlay */}
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.15)_50%)] bg-[size:100%_4px]" />
              <div className="relative z-10">
                <div className="font-mono-tv text-[10px] uppercase tracking-[0.35em] text-cyan-400">
                  Stats Cabinet
                </div>
                <div className="mt-2 text-xl font-bold tracking-tight text-zinc-100">
                  {getRank(lifetimeStats.correctCount)}
                </div>
                <p className="text-[10px] font-mono uppercase text-zinc-500">Rank based on correct hits</p>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="rounded-2xl border border-white/5 bg-white/5 p-3">
                    <div className="text-2xl font-black text-cyan-400">{lifetimeStats.solvedCount}</div>
                    <div className="mt-1 text-[8px] uppercase tracking-widest text-zinc-400">
                      Solved
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/5 bg-white/5 p-3">
                    <div className="text-2xl font-black text-emerald-400">{lifetimeStats.correctCount}</div>
                    <div className="mt-1 text-[8px] uppercase tracking-widest text-zinc-400">
                      Correct
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/5 bg-white/5 p-3">
                    <div className="text-2xl font-black text-pink-400">{lifetimeStats.sweepCount}</div>
                    <div className="mt-1 text-[8px] uppercase tracking-widest text-zinc-400">
                      Sweeps
                    </div>
                  </div>
                </div>
              </div>
            </article>

            {/* Score */}
            <article className="rounded-[2rem] border border-white/10 bg-zinc-950 p-5 text-zinc-50 shadow-[0_24px_60px_rgba(17,17,17,0.18)]">
              <div className="font-mono-tv text-[10px] uppercase tracking-[0.35em] text-zinc-400">
                Today's score
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="text-2xl font-black">{completed}</div>
                  <div className="mt-1 text-[10px] uppercase tracking-widest text-zinc-400">
                    solved
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="text-2xl font-black">{correct}</div>
                  <div className="mt-1 text-[10px] uppercase tracking-widest text-zinc-400">
                    correct
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="text-2xl font-black">{dailyPack.length - completed}</div>
                  <div className="mt-1 text-[10px] uppercase tracking-widest text-zinc-400">
                    left
                  </div>
                </div>
              </div>
            </article>

            <article className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl backdrop-blur-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-mono-tv text-[10px] uppercase tracking-[0.35em] text-zinc-400">
                    Next lanes
                  </div>
                  <div className="mt-2 text-xl font-bold tracking-tight text-zinc-100">
                    More game modes we can ship
                  </div>
                </div>
                <Gamepad2 className="h-5 w-5 text-zinc-400" />
              </div>

              <div className="mt-4 space-y-3">
                {[
                  {
                    title: "Geo streaks",
                    body: "Daily map guesser with distance scoring and region mode.",
                  },
                  {
                    title: "Music clip rounds",
                    body: "Artist, album, or decade guesses with hints and streaks.",
                  },
                  {
                    title: "Screen vault",
                    body: "Movies, shows, and anime with clue ladders and spoiler-safe reveals.",
                  },
                  {
                    title: "Book shelf duel",
                    body: "Literature, authors, and quote-based rounds for reading-mode people.",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-white/10 bg-black/25 p-4"
                  >
                    <div className="font-semibold tracking-tight text-zinc-100">{item.title}</div>
                    <p className="mt-1 text-sm leading-6 text-zinc-400">{item.body}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-amber-500/10 via-transparent to-cyan-500/10 p-5 shadow-2xl">
              <div className="font-mono-tv text-[10px] uppercase tracking-[0.35em] text-zinc-400">
                Category deck
              </div>
              <div className="mt-3 space-y-2">
                {PLAYGROUND_CATEGORIES.map((category) => {
                  const Icon = roundIcon(category.id);
                  return (
                    <div
                      key={category.id}
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/25 px-3 py-3"
                    >
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-2xl text-zinc-950 font-bold"
                        style={{ backgroundColor: category.accent }}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold tracking-tight text-zinc-100">
                          {category.label}
                        </div>
                        <div className="truncate text-xs text-zinc-400">{category.blurb}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-zinc-500">
                <Loader2 className="h-3 w-3 animate-spin" />
                Roadmap lives in [roadmap.tsx]
              </div>
            </article>
          </aside>
        </section>
      </div>
    </main>
  );
}

type AnswerMap = Record<string, number | null>;
