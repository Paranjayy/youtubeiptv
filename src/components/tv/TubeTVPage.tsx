import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CHANNELS, getChannelBySlug, getChannelPath, shuffle, type Channel } from "@/lib/channels";
import { YouTubePlayer } from "@/components/tv/YouTubePlayer";
import { HlsPlayer } from "@/components/tv/HlsPlayer";
import { RadioPlayer } from "@/components/tv/RadioPlayer";
import { Guide } from "@/components/tv/Guide";
import { Ticker } from "@/components/tv/Ticker";
import { Clock } from "@/components/tv/Clock";
import { Schedule } from "@/components/tv/Schedule";
import { IPTV_COUNTRIES, loadCountryChannels, type IptvChannel } from "@/lib/iptv";
import { RADIO_COUNTRIES, loadCountryRadio, type RadioStation } from "@/lib/radio";
import { getRandomChannel } from "@/lib/channels";
import { toast } from "sonner";
import {
  ChevronUp,
  ChevronDown,
  Grid3x3,
  SkipForward,
  Volume2,
  VolumeX,
  Tv,
  Globe2,
  Radio as RadioIcon,
  Sparkles,
  Link2,
} from "lucide-react";

type TubeTVPageProps = {
  initialChannelSlug?: string | null;
};

const FAVORITES_KEY = "tubetv:favs";
const CRT_KEY = "tubetv:crt";
const MODE_KEY = "tubetv:last-mode";
const CHANNEL_KEY = "tubetv:last-channel";
const IPTV_COUNTRY_KEY = "tubetv:iptv-country";
const RADIO_COUNTRY_KEY = "tubetv:radio-country";

export function TubeTVPage({ initialChannelSlug }: TubeTVPageProps) {
  const navigate = useNavigate();
  const initialChannel = initialChannelSlug ? getChannelBySlug(initialChannelSlug) : null;
  const initialChannelIdx = useMemo(() => {
    if (!initialChannel) return 0;
    const idx = CHANNELS.findIndex((channel) => channel.id === initialChannel.id);
    return idx >= 0 ? idx : 0;
  }, [initialChannel]);

  const [channelIdx, setChannelIdx] = useState(initialChannelIdx);
  const [guideOpen, setGuideOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [title, setTitle] = useState<string>("");
  const [mode, setMode] = useState<"yt" | "iptv" | "radio">("yt");
  const [iptvCountry, setIptvCountry] = useState<string>("us");
  const [iptvChannel, setIptvChannel] = useState<IptvChannel | null>(null);
  const [iptvCandidates, setIptvCandidates] = useState<IptvChannel[]>([]);
  const [iptvError, setIptvError] = useState<string | null>(null);
  const [radioCountry, setRadioCountry] = useState<string>("US");
  const [radioStation, setRadioStation] = useState<RadioStation | null>(null);
  const [radioError, setRadioError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [crt, setCrt] = useState(false);
  const [staticBurst, setStaticBurst] = useState(0);
  const [helpOpen, setHelpOpen] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const failedVideosRef = useRef<Record<string, Set<string>>>({});
  const hasHydratedRef = useRef(false);

  const channel: Channel = CHANNELS[channelIdx];

  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const requestedMode = urlParams.get("mode");
      const requestedCountry = urlParams.get("country");
      const savedChannel = initialChannelSlug ? null : localStorage.getItem(CHANNEL_KEY);
      const savedMode = localStorage.getItem(MODE_KEY);
      const savedIptvCountry = localStorage.getItem(IPTV_COUNTRY_KEY);
      const savedRadioCountry = localStorage.getItem(RADIO_COUNTRY_KEY);
      const savedFavs = JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
      if (Array.isArray(savedFavs)) setFavorites(savedFavs);
      if (localStorage.getItem(CRT_KEY) === "1") setCrt(true);
      if (!initialChannelSlug && savedChannel) {
        const idx = CHANNELS.findIndex((c) => c.id === savedChannel);
        if (idx >= 0) setChannelIdx(idx);
      }
      if (
        !initialChannelSlug &&
        (requestedMode === "yt" || requestedMode === "iptv" || requestedMode === "radio")
      ) {
        setMode(requestedMode);
      } else if (
        !initialChannelSlug &&
        (savedMode === "yt" || savedMode === "iptv" || savedMode === "radio")
      ) {
        setMode(savedMode);
      }
      if (requestedMode === "iptv" && requestedCountry) {
        setIptvCountry(requestedCountry.toLowerCase());
      } else if (savedIptvCountry) {
        setIptvCountry(savedIptvCountry);
      }
      if (requestedMode === "radio" && requestedCountry) {
        setRadioCountry(requestedCountry.toUpperCase());
      } else if (savedRadioCountry) {
        setRadioCountry(savedRadioCountry.toUpperCase());
      }
    } catch {
      // Ignore storage and parsing errors, then fall back to defaults.
    }
    hasHydratedRef.current = true;
  }, [initialChannelSlug]);

  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    } catch {
      // Ignore storage quota or privacy-mode failures.
    }
  }, [favorites]);

  useEffect(() => {
    try {
      localStorage.setItem(CRT_KEY, crt ? "1" : "0");
    } catch {
      // Ignore storage quota or privacy-mode failures.
    }
  }, [crt]);

  useEffect(() => {
    if (!hasHydratedRef.current) return;
    try {
      localStorage.setItem(MODE_KEY, mode);
      localStorage.setItem(CHANNEL_KEY, channel.id);
      localStorage.setItem(IPTV_COUNTRY_KEY, iptvCountry);
      localStorage.setItem(RADIO_COUNTRY_KEY, radioCountry);
    } catch {
      // Ignore storage quota or privacy-mode failures.
    }
  }, [channel.id, iptvCountry, mode, radioCountry]);

  useEffect(() => {
    if (!initialChannelSlug) return;
    const idx = CHANNELS.findIndex((c) => c.id === initialChannelSlug);
    if (idx >= 0 && idx !== channelIdx) {
      setChannelIdx(idx);
      setMode("yt");
      setTitle("");
      setElapsed(0);
      setDuration(0);
    }
  }, [channelIdx, initialChannelSlug]);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));
  }, []);

  const triggerStatic = useCallback(() => {
    setStaticBurst((n) => n + 1);
  }, []);

  const copyShareLink = useCallback(async () => {
    try {
      const url = new URL(mode === "yt" ? getChannelPath(channel) : "/", window.location.origin);
      if (mode !== "yt") {
        url.searchParams.set("mode", mode);
        url.searchParams.set("country", mode === "iptv" ? iptvCountry : radioCountry);
      }
      await navigator.clipboard.writeText(url.toString());
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy link");
    }
  }, [channel, iptvCountry, mode, radioCountry]);

  const openRandomChannel = useCallback(() => {
    const next = getRandomChannel(channel.id);
    openChannel(next);
    toast("Surprise channel loaded");
  }, [channel.id, openChannel]);

  // Per-channel persistent shuffled queues plus cursors.
  const queuesRef = useRef<Record<string, { order: string[]; cursor: number }>>({});
  const [, force] = useState(0);

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

    const failed = failedVideosRef.current[ch.id] ?? new Set<string>();
    if (failed.size >= ch.videos.length - 1) {
      failed.clear();
      failedVideosRef.current[ch.id] = failed;
      queue.order = shuffle(ch.videos);
      queue.cursor = 0;
    } else {
      do {
        queue.cursor = (queue.cursor + 1) % queue.order.length;
        if (queue.cursor === 0) queue.order = shuffle(ch.videos);
      } while (failed.has(queue.order[queue.cursor]) && failed.size < ch.videos.length - 1);
    }

    setTitle("");
    setElapsed(0);
    setDuration(0);
    force((n) => n + 1);
  }, [channelIdx]);

  const openChannel = useCallback(
    (ch: Channel) => {
      const idx = CHANNELS.findIndex((c) => c.id === ch.id);
      if (idx >= 0) {
        setChannelIdx(idx);
        setTitle("");
        setElapsed(0);
        setDuration(0);
        setMode("yt");
        setGuideOpen(false);
        triggerStatic();
        void navigate({
          to: getChannelPath(ch),
          replace: true,
        });
      }
    },
    [navigate, triggerStatic],
  );

  const changeChannel = useCallback(
    (delta: number) => {
      const next = CHANNELS[(channelIdx + delta + CHANNELS.length) % CHANNELS.length];
      openChannel(next);
    },
    [channelIdx, openChannel],
  );

  const pickIptv = useCallback((country: string, ch: IptvChannel) => {
    setIptvCountry(country);
    setIptvChannel(ch);
    setIptvError(null);
    setMode("iptv");
    setTitle(ch.name);
    setGuideOpen(false);
    loadCountryChannels(country)
      .then((list) => {
        const pool = list.filter((c) => c.url !== ch.url && (!ch.group || c.group === ch.group));
        for (let i = pool.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        setIptvCandidates(pool.slice(0, 12));
      })
      .catch(() => setIptvCandidates([]));
  }, []);

  const pickRadio = useCallback((country: string, st: RadioStation) => {
    setRadioCountry(country);
    setRadioStation(st);
    setRadioError(null);
    setMode("radio");
    setTitle(st.name);
    setGuideOpen(false);
  }, []);

  const handleIptvError = useCallback((msg: string) => {
    setIptvCandidates((rest) => {
      const [next, ...remaining] = rest;
      if (next) {
        setIptvChannel(next);
        setIptvError(null);
        setTitle(next.name);
        return remaining;
      }
      setIptvError(`${msg} - no working stream nearby`);
      return [];
    });
  }, []);

  const handleYouTubeError = useCallback(
    (videoId: string) => {
      const seen = failedVideosRef.current[channel.id] ?? new Set<string>();
      seen.add(videoId);
      failedVideosRef.current[channel.id] = seen;
      advance();
    },
    [advance, channel.id],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      if (mode === "yt" && e.key === "ArrowUp") {
        e.preventDefault();
        changeChannel(1);
      } else if (mode === "yt" && e.key === "ArrowDown") {
        e.preventDefault();
        changeChannel(-1);
      } else if (mode === "yt" && e.key === "ArrowRight") {
        e.preventDefault();
        advance();
      } else if (e.key.toLowerCase() === "g") {
        setGuideOpen((o) => !o);
      } else if (e.key === "Escape") {
        setGuideOpen(false);
        setHelpOpen(false);
      } else if (e.key.toLowerCase() === "m") {
        setMuted((m) => !m);
      } else if (e.key.toLowerCase() === "c") {
        setCrt((c) => !c);
      } else if (e.key === "?" || e.key === "/") {
        e.preventDefault();
        setHelpOpen((o) => !o);
      } else if (e.key.toLowerCase() === "f" && mode === "yt") {
        toggleFavorite(CHANNELS[channelIdx].id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance, channelIdx, changeChannel, mode, toggleFavorite]);

  const countryLabel = useMemo(
    () => IPTV_COUNTRIES.find((c) => c.code === iptvCountry),
    [iptvCountry],
  );
  const radioCountryLabel = useMemo(
    () => RADIO_COUNTRIES.find((c) => c.code === radioCountry),
    [radioCountry],
  );

  const currentMeta = mode === "yt" ? channel : null;

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden">
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
              YouTube - 24/7 broadcast
            </p>
          </div>
        </div>
        <Clock />
      </header>

      <Ticker />

      <section className="relative flex flex-1 flex-col lg:flex-row">
        <aside className="hidden w-64 shrink-0 border-r border-border/60 bg-black/30 lg:block">
          <div className="border-b border-border/60 px-4 py-3 font-mono-tv text-[10px] uppercase tracking-widest text-muted-foreground">
            Sources
          </div>
          <div className="h-[calc(100vh-180px)] overflow-y-auto py-2">
            <button
              onClick={() => {
                setMode("iptv");
                setGuideOpen(true);
              }}
              className={
                "flex w-full items-center gap-3 border-l-2 px-4 py-3 text-left transition-colors " +
                (mode === "iptv"
                  ? "border-accent bg-accent/10"
                  : "border-transparent hover:bg-card/60")
              }
            >
              <Globe2 className="h-5 w-5 text-accent" />
              <span className="flex-1">
                <span className="block text-sm font-semibold tracking-tight">LIVE TV - WORLD</span>
                <span className="block text-[11px] text-muted-foreground">
                  {countryLabel?.flag} {countryLabel?.name}
                </span>
              </span>
              {mode === "iptv" && (
                <span className="h-2 w-2 animate-pulse-dot rounded-full bg-accent shadow-glow" />
              )}
            </button>
            <button
              onClick={() => {
                setMode("radio");
                setGuideOpen(true);
              }}
              className={
                "flex w-full items-center gap-3 border-l-2 px-4 py-3 text-left transition-colors " +
                (mode === "radio"
                  ? "border-primary bg-primary/10"
                  : "border-transparent hover:bg-card/60")
              }
            >
              <RadioIcon className="h-5 w-5 text-primary" />
              <span className="flex-1">
                <span className="block text-sm font-semibold tracking-tight">RADIO - WORLD</span>
                <span className="block text-[11px] text-muted-foreground">
                  {radioCountryLabel?.flag} {radioCountryLabel?.name}
                </span>
              </span>
              {mode === "radio" && (
                <span className="h-2 w-2 animate-pulse-dot rounded-full bg-primary shadow-glow" />
              )}
            </button>
            <div className="mt-3 border-t border-border/60 px-4 pt-3 pb-1 font-mono-tv text-[10px] uppercase tracking-widest text-muted-foreground">
              YouTube channels - {CHANNELS.length}
            </div>
            {CHANNELS.map((ch, i) => {
              const active = mode === "yt" && i === channelIdx;
              return (
                <button
                  key={ch.id}
                  onClick={() => openChannel(ch)}
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
          </div>
        </aside>

        <div className="relative flex flex-1 flex-col">
          <div
            className={
              "relative aspect-video w-full bg-black lg:aspect-auto lg:flex-1 " +
              (crt ? "crt-screen" : "")
            }
          >
            {mode === "yt" ? (
              <YouTubePlayer
                videoId={currentVideo}
                onEnded={advance}
                onError={handleYouTubeError}
                onTitle={setTitle}
                onProgress={(e, d) => {
                  setElapsed(e);
                  setDuration(d);
                }}
                muted={muted}
              />
            ) : mode === "iptv" && iptvChannel ? (
              <HlsPlayer
                key={iptvChannel.url}
                src={iptvChannel.url}
                muted={muted}
                onError={handleIptvError}
              />
            ) : mode === "radio" && radioStation ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-black via-card to-black text-center">
                <RadioIcon className="h-16 w-16 animate-pulse-dot text-primary" />
                <div className="font-mono-tv text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  Radio - {radioCountryLabel?.name}
                </div>
                <div className="text-2xl font-bold tracking-tight">{radioStation.name}</div>
                <div className="text-sm text-muted-foreground">
                  {(radioStation.tags || "").split(",").slice(0, 3).join(" - ") || "live audio"}
                </div>
                <RadioPlayer
                  key={radioStation.url_resolved || radioStation.url}
                  src={radioStation.url_resolved || radioStation.url}
                  muted={muted}
                  onError={(m) => setRadioError(m)}
                />
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black text-center">
                {mode === "radio" ? (
                  <RadioIcon className="h-10 w-10 text-primary" />
                ) : (
                  <Globe2 className="h-10 w-10 text-accent" />
                )}
                <div className="font-mono-tv text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  {mode === "radio"
                    ? "Radio - pick a country & station"
                    : "Live TV - pick a country & channel"}
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
            {staticBurst > 0 && (
              <div
                key={staticBurst}
                className="tv-static pointer-events-none absolute inset-0 z-10"
                onAnimationEnd={() => setStaticBurst(0)}
              />
            )}

            <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-3 rounded-md border border-border/60 bg-background/70 px-3 py-2 backdrop-blur">
              <span className="flex items-center gap-1.5 font-mono-tv text-[10px] uppercase tracking-widest text-primary">
                <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-primary" />
                Live
              </span>
              {mode === "yt" && currentMeta && (
                <>
                  <span
                    className="font-mono-tv text-lg font-bold leading-none"
                    style={{ color: currentMeta.color }}
                  >
                    {currentMeta.number}
                  </span>
                  <span className="text-sm font-semibold tracking-tight">{currentMeta.name}</span>
                </>
              )}
              {mode === "iptv" && (
                <>
                  <span className="font-mono-tv text-lg leading-none">{countryLabel?.flag}</span>
                  <span className="text-sm font-semibold tracking-tight">
                    {iptvChannel?.name ?? "Live TV"}
                  </span>
                </>
              )}
              {mode === "radio" && (
                <>
                  <span className="font-mono-tv text-lg leading-none">
                    {radioCountryLabel?.flag}
                  </span>
                  <span className="text-sm font-semibold tracking-tight">
                    {radioStation?.name ?? "Radio"}
                  </span>
                </>
              )}
            </div>

            {iptvError && mode === "iptv" && (
              <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-md border border-destructive/60 bg-destructive/20 px-3 py-1.5 text-xs text-destructive backdrop-blur">
                {iptvError}
                <button
                  onClick={() => setGuideOpen(true)}
                  className="rounded bg-destructive/40 px-2 py-0.5 text-[10px] uppercase tracking-widest text-destructive-foreground hover:bg-destructive/60"
                >
                  Pick another
                </button>
              </div>
            )}
            {radioError && mode === "radio" && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-md border border-destructive/60 bg-destructive/20 px-3 py-1.5 text-xs text-destructive backdrop-blur">
                {radioError} - try another station
              </div>
            )}
          </div>

          <div className="border-t border-border/60 bg-black/60 px-6 py-4">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="font-mono-tv text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                  Now playing -{" "}
                  {mode === "yt"
                    ? channel.category
                    : mode === "iptv"
                      ? `Live TV - ${countryLabel?.name}`
                      : `Radio - ${radioCountryLabel?.name}`}
                </div>
                <div className="mt-1 truncate text-lg font-semibold tracking-tight">
                  {title || "Tuning in..."}
                </div>
                <div className="mt-0.5 truncate text-sm text-muted-foreground">
                  {mode === "yt"
                    ? channel.tagline
                    : mode === "iptv"
                      ? iptvChannel?.group || "free over-the-air streams"
                      : (radioStation?.tags || "").split(",").slice(0, 3).join(" - ") ||
                        "free radio worldwide"}
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
                <button
                  onClick={openRandomChannel}
                  className="flex items-center gap-1.5 rounded-md border border-border/60 bg-card/50 px-3 py-2 text-sm font-medium hover:border-accent/60 hover:text-accent"
                  aria-label="Surprise me"
                >
                  <Sparkles className="h-4 w-4" /> Surprise
                </button>
                <button
                  onClick={copyShareLink}
                  className="rounded-md border border-border/60 bg-card/50 p-2 hover:border-primary/60 hover:text-primary"
                  aria-label="Copy current link"
                >
                  <Link2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 font-mono-tv text-[10px] uppercase tracking-widest text-muted-foreground">
              {mode === "yt" && <span>↑/↓ change channel</span>}
              {mode === "yt" && <span>→ skip</span>}
              <span>G guide</span>
              <span>M mute</span>
              <span>C crt {crt ? "on" : "off"}</span>
              {mode === "yt" && <span>F fav</span>}
              <button
                onClick={() => setHelpOpen(true)}
                className="underline-offset-2 hover:text-foreground hover:underline"
              >
                ? help
              </button>
              <span className="text-foreground/60">
                mode -{" "}
                {mode === "yt"
                  ? "youtube channels"
                  : mode === "iptv"
                    ? "iptv worldwide"
                    : "radio worldwide"}
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
          onPick={openChannel}
          onPickIptv={pickIptv}
          iptvCountry={iptvCountry}
          onCountryChange={setIptvCountry}
          iptvCurrentUrl={iptvChannel?.url ?? null}
          onPickRadio={pickRadio}
          radioCountry={radioCountry}
          onRadioCountryChange={setRadioCountry}
          radioCurrentUrl={radioStation?.url_resolved || radioStation?.url || null}
          onClose={() => setGuideOpen(false)}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
        />
      </section>

      {helpOpen && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-border/60 bg-card p-6 shadow-2xl">
            <div className="text-lg font-bold tracking-tight">Keyboard shortcuts</div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>G open guide</div>
              <div>M mute</div>
              <div>C toggle CRT</div>
              <div>? open help</div>
              <div>Esc close overlays</div>
              <div>F favorite current channel</div>
              <div>Up / Down change channel</div>
              <div>Right skip video</div>
            </div>
            <button
              onClick={() => setHelpOpen(false)}
              className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
