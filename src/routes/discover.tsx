import { createFileRoute, Link } from "@tanstack/react-router";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  BookOpenText,
  Clock3,
  Gamepad2,
  Loader2,
  Music2,
  Newspaper,
  RefreshCcw,
  Search,
  Sparkles,
  Timer,
  Tv,
} from "lucide-react";
import {
  fetchRandomWikiSummary,
  fetchWikiOnThisDay,
  searchArtists,
  searchWikiArticles,
  type ArtistSearchResult,
  type WikiOnThisDayEvent,
  type WikiSearchResult,
  type WikiSummary,
} from "@/lib/discovery";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/discover")({
  head: () => ({
    meta: [
      { title: "Discovery Desk - TubeTV" },
      {
        name: "description",
        content:
          "A timepass desk for news-ish Wikipedia feeds, random articles, and artist discovery.",
      },
      { property: "og:title", content: "Discovery Desk - TubeTV" },
      {
        property: "og:description",
        content: "Channel surf through Wikipedia, artist discovery, and playful mini-game ideas.",
      },
    ],
  }),
  component: DiscoveryPage,
});

const TOPICS = ["space", "india", "film", "jazz", "design", "history"];
const ARTISTS = [
  "Queen",
  "A. R. Rahman",
  "Radiohead",
  "Beyoncé",
  "Nusrat Fateh Ali Khan",
  "Daft Punk",
];

function DiscoveryPage() {
  const [onThisDay, setOnThisDay] = useState<WikiOnThisDayEvent[]>([]);
  const [onThisDayLoading, setOnThisDayLoading] = useState(true);
  const [onThisDayError, setOnThisDayError] = useState<string | null>(null);
  const [randomArticle, setRandomArticle] = useState<WikiSummary | null>(null);
  const [randomLoading, setRandomLoading] = useState(true);
  const [randomError, setRandomError] = useState<string | null>(null);
  const [wikiQuery, setWikiQuery] = useState("space");
  const [wikiResults, setWikiResults] = useState<WikiSearchResult[]>([]);
  const [wikiLoading, setWikiLoading] = useState(false);
  const [wikiError, setWikiError] = useState<string | null>(null);
  const [artistQuery, setArtistQuery] = useState("Queen");
  const [artistResults, setArtistResults] = useState<ArtistSearchResult[]>([]);
  const [artistLoading, setArtistLoading] = useState(false);
  const [artistError, setArtistError] = useState<string | null>(null);

  const deferredWikiQuery = useDeferredValue(wikiQuery.trim());
  const deferredArtistQuery = useDeferredValue(artistQuery.trim());

  const loadRandom = async () => {
    setRandomLoading(true);
    setRandomError(null);
    try {
      setRandomArticle(await fetchRandomWikiSummary());
    } catch (error) {
      setRandomError(error instanceof Error ? error.message : "Could not load random article");
    } finally {
      setRandomLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    setOnThisDayLoading(true);
    setOnThisDayError(null);
    fetchWikiOnThisDay()
      .then((items) => {
        if (!cancelled) setOnThisDay(items);
      })
      .catch((error) => {
        if (!cancelled) {
          setOnThisDayError(
            error instanceof Error ? error.message : "Could not load today's events",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setOnThisDayLoading(false);
      });

    void loadRandom();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const term = deferredWikiQuery;
    if (!term) {
      setWikiResults([]);
      setWikiError(null);
      return;
    }

    setWikiLoading(true);
    setWikiError(null);
    searchWikiArticles(term)
      .then((results) => {
        if (!cancelled) setWikiResults(results);
      })
      .catch((error) => {
        if (!cancelled) {
          setWikiError(error instanceof Error ? error.message : "Could not search Wikipedia");
        }
      })
      .finally(() => {
        if (!cancelled) setWikiLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [deferredWikiQuery]);

  useEffect(() => {
    let cancelled = false;
    const term = deferredArtistQuery;
    if (!term) {
      setArtistResults([]);
      setArtistError(null);
      return;
    }

    setArtistLoading(true);
    setArtistError(null);
    searchArtists(term)
      .then((results) => {
        if (!cancelled) setArtistResults(results);
      })
      .catch((error) => {
        if (!cancelled) {
          setArtistError(error instanceof Error ? error.message : "Could not search artists");
        }
      })
      .finally(() => {
        if (!cancelled) setArtistLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [deferredArtistQuery]);

  const currentReadout = useMemo(
    () => ({
      wikiCount: wikiResults.length,
      artistCount: artistResults.length,
      eventCount: onThisDay.length,
    }),
    [artistResults.length, onThisDay.length, wikiResults.length],
  );

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(255,180,120,0.16),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(80,120,255,0.12),_transparent_24%),linear-gradient(180deg,_#171310_0%,_#0f1114_55%,_#0a0b0d_100%)] text-zinc-100">
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] [background-size:42px_42px]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="font-mono-tv text-[10px] uppercase tracking-[0.45em] text-amber-200/80">
              Discovery Desk
            </div>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-zinc-50 sm:text-5xl">
              Channel surf the internet.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-300 sm:text-base">
              News-ish current events, Wikipedia rabbit holes, and artist trails in one place. Think
              late-night tab hopping, but curated.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-100 transition-colors hover:bg-white/10"
            >
              <Tv className="h-4 w-4" />
              Back to TV
            </Link>
            <Link
              to="/playground"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-100 transition-colors hover:bg-white/10"
            >
              <Gamepad2 className="h-4 w-4" />
              Playground
            </Link>
            <Link
              to="/focus"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-100 transition-colors hover:bg-white/10"
            >
              <Timer className="h-4 w-4" />
              Focus
            </Link>
            <button
              onClick={() => {
                void loadRandom();
              }}
              className="inline-flex items-center gap-2 rounded-full bg-amber-200 px-4 py-2 text-sm font-semibold text-zinc-900 transition-colors hover:bg-amber-100"
            >
              <Sparkles className="h-4 w-4" />
              Surprise me
            </button>
          </div>
        </header>

        <section className="mt-4 grid gap-4 lg:grid-cols-[1.25fr_1.1fr_0.95fr]">
          <article className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/30 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 font-mono-tv text-[10px] uppercase tracking-[0.35em] text-amber-200/80">
                  <Newspaper className="h-3.5 w-3.5" /> News wire
                </div>
                <div className="mt-2 text-xl font-bold tracking-tight">What the day is made of</div>
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono-tv text-[10px] uppercase tracking-widest text-zinc-300">
                {currentReadout.eventCount} events
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {onThisDayLoading && (
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading the wire...
                </div>
              )}
              {onThisDayError && (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                  {onThisDayError}
                </div>
              )}
              {!onThisDayLoading &&
                !onThisDayError &&
                onThisDay.map((event) => {
                  const mainPage = event.pages[0];
                  return (
                    <a
                      key={`${event.year}-${event.text}`}
                      href={mainPage?.url || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="group block rounded-2xl border border-white/10 bg-black/20 p-4 transition-colors hover:border-amber-200/40 hover:bg-black/30"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-3xl font-black tracking-tight text-amber-100">
                          {event.year}
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-zinc-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                      </div>
                      <p className="mt-3 text-sm leading-6 text-zinc-200">{event.text}</p>
                      {mainPage && (
                        <div className="mt-3 text-xs text-zinc-400">
                          {mainPage.title}
                          {mainPage.description ? ` · ${mainPage.description}` : ""}
                        </div>
                      )}
                    </a>
                  );
                })}
            </div>
          </article>

          <article className="rounded-[2rem] border border-white/10 bg-[#fbf2e6] p-5 text-zinc-950 shadow-2xl shadow-black/20">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 font-mono-tv text-[10px] uppercase tracking-[0.35em] text-zinc-500">
                  <BookOpenText className="h-3.5 w-3.5" /> Wiki drift
                </div>
                <div className="mt-2 text-xl font-bold tracking-tight">One good rabbit hole</div>
              </div>
              <button
                onClick={() => {
                  void loadRandom();
                }}
                className="inline-flex items-center gap-2 rounded-full border border-zinc-900/10 bg-zinc-950 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-zinc-50 transition-colors hover:bg-zinc-800"
              >
                <RefreshCcw className="h-3.5 w-3.5" /> New
              </button>
            </div>

            <div className="mt-4 rounded-[1.5rem] bg-white/60 p-4 shadow-[0_18px_40px_rgba(0,0,0,0.08)]">
              {randomLoading && (
                <div className="flex items-center gap-2 text-sm text-zinc-600">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading random article...
                </div>
              )}
              {randomError && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-700">
                  {randomError}
                </div>
              )}
              {randomArticle && (
                <>
                  <div className="text-xs font-mono-tv uppercase tracking-[0.35em] text-zinc-500">
                    Random article
                  </div>
                  <h2 className="mt-2 text-3xl font-black tracking-tight">{randomArticle.title}</h2>
                  {randomArticle.description && (
                    <p className="mt-2 text-sm font-medium text-zinc-700">
                      {randomArticle.description}
                    </p>
                  )}
                  <p className="mt-4 text-sm leading-6 text-zinc-700">{randomArticle.extract}</p>
                  <a
                    href={randomArticle.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-zinc-950 px-4 py-2 text-sm font-semibold text-zinc-50 transition-colors hover:bg-zinc-800"
                  >
                    Open article <ArrowUpRight className="h-4 w-4" />
                  </a>
                </>
              )}
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {TOPICS.map((topic) => (
                <button
                  key={topic}
                  onClick={() => setWikiQuery(topic)}
                  className={cn(
                    "rounded-full border px-3 py-2 text-left text-sm transition-colors",
                    wikiQuery === topic
                      ? "border-zinc-950 bg-zinc-950 text-zinc-50"
                      : "border-zinc-900/10 bg-white/70 text-zinc-700 hover:bg-white",
                  )}
                >
                  {topic}
                </button>
              ))}
            </div>

            <form
              className="mt-4"
              onSubmit={(event) => {
                event.preventDefault();
                setWikiQuery(wikiQuery.trim());
              }}
            >
              <label className="font-mono-tv text-[10px] uppercase tracking-[0.35em] text-zinc-500">
                Search Wikipedia
              </label>
              <div className="mt-2 flex gap-2">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <input
                    value={wikiQuery}
                    onChange={(e) => setWikiQuery(e.target.value)}
                    placeholder="Try art, AI, cricket, cities..."
                    className="w-full rounded-full border border-zinc-900/10 bg-white px-10 py-3 text-sm text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-950/20"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-full bg-amber-300 px-4 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-amber-200"
                >
                  Go
                </button>
              </div>
            </form>

            <div className="mt-4 space-y-2">
              {wikiLoading && (
                <div className="flex items-center gap-2 text-sm text-zinc-600">
                  <Loader2 className="h-4 w-4 animate-spin" /> Searching the archive...
                </div>
              )}
              {wikiError && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-700">
                  {wikiError}
                </div>
              )}
              {!wikiLoading &&
                !wikiError &&
                wikiResults.slice(0, 4).map((result) => (
                  <a
                    key={`${result.pageId}-${result.title}`}
                    href={result.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group block rounded-2xl border border-zinc-900/10 bg-white/80 p-4 transition-colors hover:border-zinc-900/20 hover:bg-white"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold tracking-tight">{result.title}</div>
                      <ArrowUpRight className="h-4 w-4 text-zinc-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </div>
                    <p className="mt-2 text-sm leading-6 text-zinc-700">{result.snippet}</p>
                  </a>
                ))}
            </div>
          </article>

          <aside className="space-y-4">
            <article className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5 shadow-2xl shadow-black/25 backdrop-blur-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 font-mono-tv text-[10px] uppercase tracking-[0.35em] text-cyan-200/80">
                    <Music2 className="h-3.5 w-3.5" /> Artist trail
                  </div>
                  <div className="mt-2 text-xl font-bold tracking-tight">Discoverography</div>
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono-tv text-[10px] uppercase tracking-widest text-zinc-300">
                  {currentReadout.artistCount} results
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {ARTISTS.map((artist) => (
                  <button
                    key={artist}
                    onClick={() => setArtistQuery(artist)}
                    className={cn(
                      "rounded-full border px-3 py-2 text-sm transition-colors",
                      artistQuery === artist
                        ? "border-cyan-200/50 bg-cyan-200/15 text-cyan-50"
                        : "border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10",
                    )}
                  >
                    {artist}
                  </button>
                ))}
              </div>

              <form
                className="mt-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  setArtistQuery(artistQuery.trim());
                }}
              >
                <label className="font-mono-tv text-[10px] uppercase tracking-[0.35em] text-zinc-400">
                  Search artists
                </label>
                <div className="mt-2 flex gap-2">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                    <input
                      value={artistQuery}
                      onChange={(e) => setArtistQuery(e.target.value)}
                      placeholder="Bands, singers, producers..."
                      className="w-full rounded-full border border-white/10 bg-black/20 px-10 py-3 text-sm text-zinc-50 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-200/20"
                    />
                  </div>
                  <button
                    type="submit"
                    className="rounded-full bg-cyan-200 px-4 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-cyan-100"
                  >
                    Go
                  </button>
                </div>
              </form>

              <div className="mt-4 space-y-2">
                {artistLoading && (
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <Loader2 className="h-4 w-4 animate-spin" /> Hunting the catalog...
                  </div>
                )}
                {artistError && (
                  <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                    {artistError}
                  </div>
                )}
                {!artistLoading &&
                  !artistError &&
                  artistResults.slice(0, 6).map((artist) => (
                    <a
                      key={artist.id}
                      href={artist.url}
                      target="_blank"
                      rel="noreferrer"
                      className="group block rounded-2xl border border-white/10 bg-black/20 p-4 transition-colors hover:border-cyan-200/40 hover:bg-black/30"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-semibold tracking-tight text-zinc-50">
                          {artist.name}
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-zinc-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                      </div>
                      <div className="mt-1 text-xs uppercase tracking-[0.24em] text-zinc-400">
                        {artist.type || "Artist"}
                        {artist.country ? ` · ${artist.country}` : ""}
                        {artist.area ? ` · ${artist.area}` : ""}
                      </div>
                      {artist.disambiguation && (
                        <p className="mt-2 text-sm leading-6 text-zinc-300">
                          {artist.disambiguation}
                        </p>
                      )}
                    </a>
                  ))}
              </div>
            </article>

            <article className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5 shadow-2xl shadow-black/25 backdrop-blur-sm">
              <div className="flex items-center gap-2 font-mono-tv text-[10px] uppercase tracking-[0.35em] text-zinc-300">
                <Gamepad2 className="h-3.5 w-3.5" /> Coming next
              </div>
              <div className="mt-3 space-y-3">
                {[
                  {
                    title: "GeoGuessr-style challenge",
                    body: "Drop into a place, trace the clues, and guess the country or city.",
                  },
                  {
                    title: "Wordle-style daily puzzle",
                    body: "Fast daily loop with streaks and a clean share sheet.",
                  },
                  {
                    title: "Music Guesser",
                    body: "Clip-first or clue-first rounds based on artist, decade, or genre.",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-white/10 bg-black/20 p-4"
                  >
                    <div className="font-semibold tracking-tight text-zinc-50">{item.title}</div>
                    <p className="mt-1 text-sm leading-6 text-zinc-300">{item.body}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm text-zinc-400">
                <Clock3 className="h-4 w-4" />
                Saved in [feature-roadmap.md]
              </div>
            </article>

            <article className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-amber-200/15 via-transparent to-cyan-200/10 p-5 shadow-2xl shadow-black/20">
              <div className="font-mono-tv text-[10px] uppercase tracking-[0.35em] text-zinc-300">
                Live status
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                  <div className="text-lg font-black">{currentReadout.eventCount}</div>
                  <div className="mt-1 text-[10px] uppercase tracking-widest text-zinc-400">
                    Wire
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                  <div className="text-lg font-black">{currentReadout.wikiCount}</div>
                  <div className="mt-1 text-[10px] uppercase tracking-widest text-zinc-400">
                    Wiki
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                  <div className="text-lg font-black">{currentReadout.artistCount}</div>
                  <div className="mt-1 text-[10px] uppercase tracking-widest text-zinc-400">
                    Music
                  </div>
                </div>
              </div>
            </article>
          </aside>
        </section>
      </div>
    </main>
  );
}
