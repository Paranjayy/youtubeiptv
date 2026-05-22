import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CHANNELS, shuffle, type Channel } from "@/lib/channels";
import { YouTubePlayer } from "@/components/tv/YouTubePlayer";
import { HlsPlayer } from "@/components/tv/HlsPlayer";
import { Guide } from "@/components/tv/Guide";
import { Ticker } from "@/components/tv/Ticker";
import { Clock } from "@/components/tv/Clock";
import { Schedule } from "@/components/tv/Schedule";
import { IPTV_COUNTRIES, type IptvChannel } from "@/lib/iptv";
import { ChevronUp, ChevronDown, Grid3x3, SkipForward, Volume2, VolumeX, Tv, Globe2 } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TubeTV — YouTube as live channels" },
      {
        name: "description",
        content:
          "A retro IPTV-style guide for YouTube. Shuffled music, nature, comedy, gaming and more — playing 24/7.",
      },
      { property: "og:title", content: "TubeTV — YouTube as live channels" },
      {
        property: "og:description",
        content:
          "Channel-surf the best of YouTube. Lofi, synthwave, nature, gaming, docs — auto-shuffled.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [channelIdx, setChannelIdx] = useState(0);
  const [guideOpen, setGuideOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [title, setTitle] = useState<string>("");
  const [mode, setMode] = useState<"yt" | "iptv">("yt");
  const [iptvCountry, setIptvCountry] = useState<string>("us");
  const [iptvChannel, setIptvChannel] = useState<IptvChannel | null>(null);
  const [iptvError, setIptvError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);
  // Per-channel persistent shuffled queues + cursors
  const queuesRef = useRef<Record<string, { order: string[]; cursor: number }>>({});
  const [, force] = useState(0);

  const channel: Channel = CHANNELS[channelIdx];

  const ensureQueue = useCallback((ch: Channel) => {
    if (!queuesRef.current[ch.id]) {
      queuesRef.current[ch.id] = { order: shuffle(ch.videos), cursor: 0 };
    }
    return queuesRef.current[ch.id];
  }, []);

  const q = ensureQueue(channel);
  const currentVideo = q.order[q.cursor];

  const advance = useCallback(() => {
    const ch = CHANNELS[channelIdx];
    const queue = queuesRef.current[ch.id];
    if (!queue) return;
    queue.cursor = (queue.cursor + 1) % queue.order.length;
    if (queue.cursor === 0) queue.order = shuffle(ch.videos);
    setTitle("");
    setElapsed(0);
    setDuration(0);
    force((n) => n + 1);
  }, [channelIdx]);

  const changeChannel = useCallback((delta: number) => {
    setChannelIdx((i) => (i + delta + CHANNELS.length) % CHANNELS.length);
    setTitle("");
    setElapsed(0);
    setDuration(0);
  }, []);

  const pickChannel = useCallback((ch: Channel) => {
    const i = CHANNELS.findIndex((c) => c.id === ch.id);
    if (i >= 0) {
      setChannelIdx(i);
      setTitle("");
      setElapsed(0);
      setDuration(0);
      setMode("yt");
      setGuideOpen(false);
    }
  }, []);

  const pickIptv = useCallback((country: string, ch: IptvChannel) => {
    setIptvCountry(country);
    setIptvChannel(ch);
    setIptvError(null);
    setMode("iptv");
    setTitle(ch.name);
    setGuideOpen(false);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      if (mode === "yt" && e.key === "ArrowUp") { e.preventDefault(); changeChannel(1); }
      else if (mode === "yt" && e.key === "ArrowDown") { e.preventDefault(); changeChannel(-1); }
      else if (mode === "yt" && e.key === "ArrowRight") { e.preventDefault(); advance(); }
      else if (e.key.toLowerCase() === "g") setGuideOpen((o) => !o);
      else if (e.key === "Escape") setGuideOpen(false);
      else if (e.key.toLowerCase() === "m") setMuted((m) => !m);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [changeChannel, advance, mode]);

  const countryLabel = useMemo(
    () => IPTV_COUNTRIES.find((c) => c.code === iptvCountry),
    [iptvCountry]
  );

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between gap-4 border-b border-border/60 bg-black/40 px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/20 text-primary shadow-glow">
            <Tv className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-mono-tv text-lg font-bold tracking-[0.2em] text-glow text-primary">
              TUBE<span className="text-accent">TV</span>
            </h1>
            <p className="font-mono-tv text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              YouTube · 24/7 broadcast
            </p>
          </div>
        </div>
        <Clock />
      </header>

      <Ticker />

      {/* Main viewer */}
      <section className="relative flex flex-1 flex-col lg:flex-row">
        {/* Channel rail (desktop) */}
        <aside className="hidden w-64 shrink-0 border-r border-border/60 bg-black/30 lg:block">
          <div className="border-b border-border/60 px-4 py-3 font-mono-tv text-[10px] uppercase tracking-widest text-muted-foreground">
            Channels · {CHANNELS.length}
          </div>
          <div className="h-[calc(100vh-180px)] overflow-y-auto py-2">
            {CHANNELS.map((ch, i) => {
              const active = mode === "yt" && i === channelIdx;
              return (
                <button
                  key={ch.id}
                  onClick={() => { setChannelIdx(i); setTitle(""); setElapsed(0); setDuration(0); setMode("yt"); }}
                  className={
                    "flex w-full items-center gap-3 border-l-2 px-4 py-2.5 text-left transition-colors " +
                    (active
                      ? "border-primary bg-primary/10"
                      : "border-transparent hover:bg-card/60")
                  }
                >
                  <span
                    className="font-mono-tv text-lg font-bold"
                    style={{ color: active ? "var(--primary)" : ch.color }}
                  >
                    {ch.number}
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-semibold tracking-tight">{ch.name}</span>
                    <span className="block text-[11px] text-muted-foreground">{ch.category}</span>
                  </span>
                  {active && (
                    <span className="h-2 w-2 animate-pulse-dot rounded-full bg-primary shadow-glow" />
                  )}
                </button>
              );
            })}
            <button
              onClick={() => { setMode("iptv"); setGuideOpen(true); }}
              className={
                "mt-2 flex w-full items-center gap-3 border-l-2 px-4 py-3 text-left transition-colors " +
                (mode === "iptv"
                  ? "border-accent bg-accent/10"
                  : "border-transparent hover:bg-card/60")
              }
            >
              <Globe2 className="h-5 w-5 text-accent" />
              <span className="flex-1">
                <span className="block text-sm font-semibold tracking-tight">LIVE TV · WORLD</span>
                <span className="block text-[11px] text-muted-foreground">
                  {countryLabel?.flag} {countryLabel?.name}
                </span>
              </span>
              {mode === "iptv" && (
                <span className="h-2 w-2 animate-pulse-dot rounded-full bg-accent shadow-glow" />
              )}
            </button>
          </div>
        </aside>

        {/* Stage */}
        <div className="relative flex flex-1 flex-col">
          {/* Player */}
          <div className="relative aspect-video w-full bg-black lg:aspect-auto lg:flex-1">
            {mode === "yt" ? (
              <YouTubePlayer
                videoId={currentVideo}
                onEnded={advance}
                onTitle={setTitle}
                onProgress={(e, d) => { setElapsed(e); setDuration(d); }}
                muted={muted}
              />
            ) : iptvChannel ? (
              <HlsPlayer
                src={iptvChannel.url}
                muted={muted}
                onError={(m) => setIptvError(m)}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black text-center">
                <Globe2 className="h-10 w-10 text-accent" />
                <div className="font-mono-tv text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  Live TV · pick a country & channel
                </div>
                <button
                  onClick={() => setGuideOpen(true)}
                  className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground shadow-glow"
                >
                  Open guide
                </button>
              </div>
            )}
            <div className="bg-scanlines pointer-events-none absolute inset-0 opacity-20 mix-blend-overlay" />

            {/* Channel badge overlay */}
            <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-3 rounded-md border border-border/60 bg-background/70 px-3 py-2 backdrop-blur">
              <span className="flex items-center gap-1.5 font-mono-tv text-[10px] uppercase tracking-widest text-primary">
                <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-primary" />
                Live
              </span>
              {mode === "yt" ? (
                <>
                  <span
                    className="font-mono-tv text-lg font-bold leading-none"
                    style={{ color: channel.color }}
                  >
                    {channel.number}
                  </span>
                  <span className="text-sm font-semibold tracking-tight">{channel.name}</span>
                </>
              ) : (
                <>
                  <span className="font-mono-tv text-lg leading-none">{countryLabel?.flag}</span>
                  <span className="text-sm font-semibold tracking-tight">
                    {iptvChannel?.name ?? "Live TV"}
                  </span>
                </>
              )}
            </div>

            {iptvError && mode === "iptv" && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-md border border-destructive/60 bg-destructive/20 px-3 py-1.5 text-xs text-destructive backdrop-blur">
                {iptvError} — try another channel
              </div>
            )}
          </div>

          {/* Now playing strip */}
          <div className="border-t border-border/60 bg-black/60 px-6 py-4">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="font-mono-tv text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                  Now playing · {mode === "yt" ? channel.category : `Live TV · ${countryLabel?.name}`}
                </div>
                <div className="mt-1 truncate text-lg font-semibold tracking-tight">
                  {title || "Tuning in…"}
                </div>
                <div className="mt-0.5 truncate text-sm text-muted-foreground">
                  {mode === "yt" ? channel.tagline : (iptvChannel?.group || "free over-the-air streams")}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {mode === "yt" && (
                  <>
                    <button
                      onClick={() => changeChannel(-1)}
                      className="flex items-center gap-1.5 rounded-md border border-border/60 bg-card/50 px-3 py-2 text-sm font-medium hover:border-primary/60 hover:text-primary"
                      aria-label="Previous channel"
                    >
                      <ChevronDown className="h-4 w-4" /> CH-
                    </button>
                    <button
                      onClick={() => changeChannel(1)}
                      className="flex items-center gap-1.5 rounded-md border border-border/60 bg-card/50 px-3 py-2 text-sm font-medium hover:border-primary/60 hover:text-primary"
                      aria-label="Next channel"
                    >
                      <ChevronUp className="h-4 w-4" /> CH+
                    </button>
                    <button
                      onClick={advance}
                      className="flex items-center gap-1.5 rounded-md border border-border/60 bg-card/50 px-3 py-2 text-sm font-medium hover:border-accent/60 hover:text-accent"
                      aria-label="Skip to next video"
                    >
                      <SkipForward className="h-4 w-4" /> Skip
                    </button>
                  </>
                )}
                <button
                  onClick={() => setMuted((m) => !m)}
                  className="rounded-md border border-border/60 bg-card/50 p-2 hover:border-primary/60 hover:text-primary"
                  aria-label={muted ? "Unmute" : "Mute"}
                >
                  {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => setGuideOpen(true)}
                  className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90"
                >
                  <Grid3x3 className="h-4 w-4" /> Guide
                </button>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 font-mono-tv text-[10px] uppercase tracking-widest text-muted-foreground">
              {mode === "yt" && <span>↑/↓ change channel</span>}
              {mode === "yt" && <span>→ skip</span>}
              <span>G guide</span>
              <span>M mute</span>
              <span className="text-foreground/60">
                mode · {mode === "yt" ? "youtube channels" : "iptv worldwide"}
              </span>
            </div>
          </div>

          {mode === "yt" && (
            <Schedule
              channel={channel}
              order={q.order}
              cursor={q.cursor}
              currentDuration={duration}
              currentElapsed={elapsed}
            />
          )}
        </div>

        <Guide
          open={guideOpen}
          mode={mode}
          onModeChange={setMode}
          currentId={channel.id}
          onPick={pickChannel}
          onPickIptv={pickIptv}
          iptvCountry={iptvCountry}
          onCountryChange={setIptvCountry}
          iptvCurrentUrl={iptvChannel?.url ?? null}
          onClose={() => setGuideOpen(false)}
        />
      </section>
    </main>
  );
}
