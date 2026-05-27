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

type AnswerMap = Record<string, number | null>;

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

function roundIcon(category: PlaygroundCategoryId) {
  if (category === "geo") return Globe2;
  if (category === "music") return Music4;
  if (category === "screen") return Clapperboard;
  if (category === "anime") return Sparkles;
  return BookOpen;
}

function PlaygroundPage() {
  const [dayKey] = useState(() => getPlaygroundDayKey());
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [hydrated, setHydrated] = useState(false);

  const dailyPack = useMemo(() => getDailyPack(dayKey), [dayKey]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PROGRESS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { dayKey?: string; answers?: AnswerMap };
        if (parsed?.dayKey === dayKey && parsed.answers) {
          setAnswers(parsed.answers);
        }
      }
    } catch {
      // Ignore storage and privacy mode failures.
    } finally {
      setHydrated(true);
    }
  }, [dayKey]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify({ dayKey, answers }));
    } catch {
      // Ignore storage and privacy mode failures.
    }
  }, [answers, dayKey, hydrated]);

  const completed = dailyPack.filter(({ round }) => answers[round.id] != null).length;
  const correct = dailyPack.filter(
    ({ round }) => answers[round.id] != null && answers[round.id] === round.answerIndex,
  ).length;
  const streakLabel =
    correct === dailyPack.length ? "clean sweep" : `${correct}/${dailyPack.length} hot`;

  const answerRound = (round: PlaygroundRound, index: number) => {
    setAnswers((current) => ({ ...current, [round.id]: index }));
  };

  const resetRound = (round: PlaygroundRound) => {
    setAnswers((current) => {
      const next = { ...current };
      delete next[round.id];
      return next;
    });
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f4ede0] text-zinc-950">
      <div className="absolute inset-0 opacity-70 [background-image:linear-gradient(rgba(17,17,17,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(17,17,17,0.04)_1px,transparent_1px)] [background-size:36px_36px]" />
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-amber-100/60 to-transparent" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-zinc-900/10 pb-4">
          <div>
            <div className="font-mono-tv text-[10px] uppercase tracking-[0.45em] text-zinc-600">
              Playground
            </div>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-zinc-950 sm:text-5xl">
              Daily guessers, built like a game cabinet.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-700 sm:text-base">
              Five quick rounds. One for geography, music, screen culture, anime, and books. We can
              keep adding more lanes without bloating the TV shell.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full border border-zinc-900/10 bg-white/70 px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-white"
            >
              <Tv className="h-4 w-4" /> TV
            </Link>
            <Link
              to="/discover"
              className="inline-flex items-center gap-2 rounded-full border border-zinc-900/10 bg-white/70 px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-white"
            >
              <Sparkles className="h-4 w-4" /> Discover
            </Link>
            <Link
              to="/focus"
              className="inline-flex items-center gap-2 rounded-full border border-zinc-900/10 bg-white/70 px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-white"
            >
              <Timer className="h-4 w-4" /> Focus
            </Link>
            <button
              onClick={() => setAnswers({})}
              className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-4 py-2 text-sm font-semibold text-zinc-50 transition-colors hover:bg-zinc-800"
            >
              <RotateCcw className="h-4 w-4" /> Reset
            </button>
          </div>
        </header>

        <section className="mt-4 grid gap-4 lg:grid-cols-[1.35fr_0.9fr]">
          <article className="rounded-[2rem] border border-zinc-900/10 bg-white/75 p-5 shadow-[0_24px_60px_rgba(60,45,25,0.08)] backdrop-blur-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 font-mono-tv text-[10px] uppercase tracking-[0.35em] text-zinc-500">
                  <Dice5 className="h-3.5 w-3.5" /> Daily pack
                </div>
                <div className="mt-2 text-xl font-bold tracking-tight text-zinc-950">
                  {dayKey} · {completed} solved · {streakLabel}
                </div>
              </div>
              <div className="rounded-full border border-zinc-900/10 bg-zinc-950 px-3 py-1 font-mono-tv text-[10px] uppercase tracking-widest text-zinc-50">
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
                    className="overflow-hidden rounded-[1.5rem] border border-zinc-900/10 bg-[#fffaf2] shadow-sm"
                    style={{ ["--accent" as string]: category.accent }}
                  >
                    <div className="flex items-start justify-between gap-3 border-b border-zinc-900/10 px-4 py-4">
                      <div className="flex min-w-0 items-start gap-3">
                        <div
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-950 text-zinc-50"
                          style={{ backgroundColor: category.accent }}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-bold uppercase tracking-[0.25em] text-zinc-500">
                              {category.label}
                            </div>
                            <div className="rounded-full border border-zinc-900/10 bg-white px-2 py-0.5 font-mono-tv text-[9px] uppercase tracking-widest text-zinc-500">
                              {round.sourceLabel}
                            </div>
                          </div>
                          <div className="mt-1 text-lg font-semibold tracking-tight text-zinc-950">
                            {round.title}
                          </div>
                        </div>
                      </div>
                      <div className="rounded-full border border-zinc-900/10 bg-white px-3 py-1 font-mono-tv text-[10px] uppercase tracking-widest text-zinc-500">
                        {solved ? (isCorrect ? "correct" : "missed") : "pending"}
                      </div>
                    </div>

                    <div className="space-y-4 px-4 py-4">
                      <div>
                        <div className="font-mono-tv text-[10px] uppercase tracking-[0.35em] text-zinc-500">
                          Clue
                        </div>
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-800">
                          {round.prompt}
                        </p>
                        <p className="mt-2 text-xs italic leading-5 text-zinc-500">{round.hint}</p>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2">
                        {round.choices.map((choice, index) => {
                          const active = selected === index;
                          const correctChoice = index === round.answerIndex;
                          return (
                            <button
                              key={choice.label}
                              onClick={() => answerRound(round, index)}
                              className={cn(
                                "group rounded-2xl border px-4 py-3 text-left transition-all hover:-translate-y-0.5",
                                active
                                  ? correctChoice
                                    ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-950"
                                    : "border-rose-500/50 bg-rose-500/10 text-rose-950"
                                  : "border-zinc-900/10 bg-white hover:border-zinc-900/20",
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
                                <div className="mt-1 text-xs text-zinc-500">{choice.detail}</div>
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
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-950"
                              : "border-rose-500/30 bg-rose-500/10 text-rose-950",
                          )}
                        >
                          <div className="font-semibold tracking-tight">
                            {isCorrect ? "Nice hit." : "Not quite."} {round.explanation}
                          </div>
                          <button
                            onClick={() => resetRound(round)}
                            className="mt-3 inline-flex items-center gap-2 rounded-full border border-current/20 bg-white/60 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] hover:bg-white"
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
            <article className="rounded-[2rem] border border-zinc-900/10 bg-zinc-950 p-5 text-zinc-50 shadow-[0_24px_60px_rgba(17,17,17,0.18)]">
              <div className="font-mono-tv text-[10px] uppercase tracking-[0.35em] text-zinc-400">
                Score
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

            <article className="rounded-[2rem] border border-zinc-900/10 bg-white/75 p-5 shadow-[0_24px_60px_rgba(60,45,25,0.08)] backdrop-blur-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-mono-tv text-[10px] uppercase tracking-[0.35em] text-zinc-500">
                    Next lanes
                  </div>
                  <div className="mt-2 text-xl font-bold tracking-tight text-zinc-950">
                    More game modes we can ship
                  </div>
                </div>
                <Gamepad2 className="h-5 w-5 text-zinc-500" />
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
                    className="rounded-2xl border border-zinc-900/10 bg-white p-4"
                  >
                    <div className="font-semibold tracking-tight text-zinc-950">{item.title}</div>
                    <p className="mt-1 text-sm leading-6 text-zinc-600">{item.body}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-[2rem] border border-zinc-900/10 bg-gradient-to-br from-amber-100 via-white to-cyan-100 p-5 shadow-[0_24px_60px_rgba(60,45,25,0.08)]">
              <div className="font-mono-tv text-[10px] uppercase tracking-[0.35em] text-zinc-500">
                Category deck
              </div>
              <div className="mt-3 space-y-2">
                {PLAYGROUND_CATEGORIES.map((category) => {
                  const Icon = roundIcon(category.id);
                  return (
                    <div
                      key={category.id}
                      className="flex items-center gap-3 rounded-2xl border border-zinc-900/10 bg-white/70 px-3 py-3"
                    >
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-2xl text-zinc-950"
                        style={{ backgroundColor: category.accent }}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold tracking-tight text-zinc-950">
                          {category.label}
                        </div>
                        <div className="truncate text-xs text-zinc-600">{category.blurb}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm text-zinc-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Roadmap lives in [feature-roadmap.md]
              </div>
            </article>
          </aside>
        </section>
      </div>
    </main>
  );
}
