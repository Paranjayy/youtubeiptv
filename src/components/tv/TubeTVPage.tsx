import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CHANNELS, getChannelBySlug, getChannelPath, shuffle, type Channel } from "@/lib/channels";
import {
  getIptvPath,
  getIptvItemPath,
  getIptvItemSlug,
  dedupeHistory,
  getRadioPath,
  getRadioItemPath,
  getRadioItemSlug,
  getTvPath,
  findIptvChannelBySlug,
  findRadioStationBySlug,
  makeIptvHistoryEntry,
  makeRadioHistoryEntry,
  makeYtHistoryEntry,
  normalizeIptvCountryCode,
  normalizeRadioCountryCode,
  type TvHistoryEntry,
} from "@/lib/tv-routes";
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
import { cn } from "@/lib/utils";
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
  Compass,
  Gamepad2,
  Timer,
} from "lucide-react";

type TubeTVPageProps = {
  initialChannelSlug?: string | null;
  initialMode?: "yt" | "iptv" | "radio";
  initialIptvCountry?: string | null;
  initialIptvItemSlug?: string | null;
  initialRadioCountry?: string | null;
  initialRadioItemSlug?: string | null;
};

const FAVORITES_KEY = "tubetv:favs";
const CRT_KEY = "tubetv:crt";
const MODE_KEY = "tubetv:last-mode";
const CHANNEL_KEY = "tubetv:last-channel";
const IPTV_COUNTRY_KEY = "tubetv:iptv-country";
const RADIO_COUNTRY_KEY = "tubetv:radio-country";
const HISTORY_KEY = "tubetv:history";

export function TubeTVPage({
  initialChannelSlug,
  initialMode,
  initialIptvCountry,
  initialIptvItemSlug,
  initialRadioCountry,
  initialRadioItemSlug,
}: TubeTVPageProps) {
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
  const [mode, setMode] = useState<"yt" | "iptv" | "radio">(initialMode ?? "yt");
  const [iptvCountry, setIptvCountry] = useState<string>(
    normalizeIptvCountryCode(initialIptvCountry ?? "us"),
  );
  const [iptvChannel, setIptvChannel] = useState<IptvChannel | null>(null);
  const [iptvCandidates, setIptvCandidates] = useState<IptvChannel[]>([]);
  const [iptvError, setIptvError] = useState<string | null>(null);
  const [radioCountry, setRadioCountry] = useState<string>(
    normalizeRadioCountryCode(initialRadioCountry ?? "us"),
  );
  const [radioStation, setRadioStation] = useState<RadioStation | null>(null);
  const [radioError, setRadioError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [crt, setCrt] = useState(false);
  const [staticBurst, setStaticBurst] = useState(0);
  const [helpOpen, setHelpOpen] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [history, setHistory] = useState<TvHistoryEntry[]>([]);
  const failedVideosRef = useRef<Record<string, Set<string>>>({});
  const hasHydratedRef = useRef(false);
  const initialIptvItemSlugRef = useRef(initialIptvItemSlug);
  const initialRadioItemSlugRef = useRef(initialRadioItemSlug);

  const channel: Channel = CHANNELS[channelIdx];

  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const requestedMode = urlParams.get("mode");
      const requestedCountry = urlParams.get("country");
      const requestedItem =
        urlParams.get("item") || urlParams.get("stream") || urlParams.get("station");
      const savedChannel = initialChannelSlug ? null : localStorage.getItem(CHANNEL_KEY);
      const savedMode = localStorage.getItem(MODE_KEY);
      const savedIptvCountry = localStorage.getItem(IPTV_COUNTRY_KEY);
      const savedRadioCountry = localStorage.getItem(RADIO_COUNTRY_KEY);
      const savedHistory = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
      const savedFavs = JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
      if (Array.isArray(savedHistory)) setHistory(savedHistory);
      if (Array.isArray(savedFavs)) setFavorites(savedFavs);
      if (localStorage.getItem(CRT_KEY) === "1") setCrt(true);
      if (!initialChannelSlug && savedChannel) {
        const idx = CHANNELS.findIndex((c) => c.id === savedChannel);
        if (idx >= 0) setChannelIdx(idx);
      }
      if (!initialMode) {
        if (requestedMode === "yt" || requestedMode === "iptv" || requestedMode === "radio") {
          setMode(requestedMode);
        } else if (savedMode === "yt" || savedMode === "iptv" || savedMode === "radio") {
          setMode(savedMode);
        }
      }
      if (!initialIptvCountry) {
        if (requestedMode === "iptv" && requestedCountry) {
          setIptvCountry(normalizeIptvCountryCode(requestedCountry));
        } else if (savedIptvCountry) {
          setIptvCountry(normalizeIptvCountryCode(savedIptvCountry));
        }
      }
      if (!initialRadioCountry) {
        if (requestedMode === "radio" && requestedCountry) {
          setRadioCountry(normalizeRadioCountryCode(requestedCountry));
        } else if (savedRadioCountry) {
          setRadioCountry(normalizeRadioCountryCode(savedRadioCountry));
        }
      }
      if (!initialMode && requestedMode === "iptv" && requestedCountry) {
        void navigate({
          to: requestedItem
            ? `${getIptvPath(requestedCountry)}/${requestedItem}`
            : getIptvPath(requestedCountry),
          replace: true,
        });
      }
      if (!initialMode && requestedMode === "radio" && requestedCountry) {
        void navigate({
          to: requestedItem
            ? `${getRadioPath(requestedCountry)}/${requestedItem}`
            : getRadioPath(requestedCountry),
          replace: true,
        });
      }
    } catch {
      // Ignore storage and parsing errors, then fall back to defaults.
    }
    hasHydratedRef.current = true;
  }, [initialIptvCountry, initialMode, initialRadioCountry, initialChannelSlug, navigate]);

  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    } catch {
      // Ignore storage quota or privacy-mode failures.
    }
  }, [favorites]);

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch {
      // Ignore storage quota or privacy-mode failures.
    }
  }, [history]);

  const pushHistory = useCallback((entry: TvHistoryEntry) => {
    setHistory((entries) => dedupeHistory(entries, entry));
  }, []);

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

  useEffect(() => {
    let cancelled = false;

    if (initialIptvItemSlugRef.current && mode === "iptv" && !iptvChannel) {
      loadCountryChannels(iptvCountry)
        .then((list) => {
          if (cancelled) return;
          const found = findIptvChannelBySlug(list, initialIptvItemSlugRef.current!);
          initialIptvItemSlugRef.current = null;
          if (found) {
            setIptvChannel(found);
            setTitle(found.name);
            setIptvError(null);
            pushHistory(makeIptvHistoryEntry(iptvCountry, found));
            void navigate({
              to: getIptvItemPath(iptvCountry, found),
              replace: true,
            });
          } else {
            void navigate({ to: getIptvPath(iptvCountry), replace: true });
          }
        })
        .catch(() => {
          if (!cancelled) initialIptvItemSlugRef.current = null;
        });
    }

    if (initialRadioItemSlugRef.current && mode === "radio" && !radioStation) {
      loadCountryRadio(radioCountry)
        .then((list) => {
          if (cancelled) return;
          const found = findRadioStationBySlug(list, initialRadioItemSlugRef.current!);
          initialRadioItemSlugRef.current = null;
          if (found) {
            setRadioStation(found);
            setTitle(found.name);
            setRadioError(null);
            pushHistory(makeRadioHistoryEntry(radioCountry, found));
            void navigate({
              to: getRadioItemPath(radioCountry, found),
              replace: true,
            });
          } else {
            void navigate({ to: getRadioPath(radioCountry), replace: true });
          }
        })
        .catch(() => {
          if (!cancelled) initialRadioItemSlugRef.current = null;
        });
    }

    return () => {
      cancelled = true;
    };
  }, [iptvChannel, iptvCountry, mode, navigate, pushHistory, radioCountry, radioStation]);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));
  }, []);

  const triggerStatic = useCallback(() => {
    setStaticBurst((n) => n + 1);
  }, []);

  const copyShareLink = useCallback(async () => {
    try {
      const url = new URL(
        getTvPath(
          mode,
          channel,
          iptvCountry,
          radioCountry,
          iptvChannel ? getIptvItemSlug(iptvChannel) : null,
          radioStation ? getRadioItemSlug(radioStation) : null,
        ),
        window.location.origin,
      );
      await navigator.clipboard.writeText(url.toString());
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy link");
    }
  }, [channel, iptvChannel, iptvCountry, mode, radioCountry, radioStation]);

  const navigateToMode = useCallback(
    (nextMode: "yt" | "iptv" | "radio") => {
      if (nextMode === "yt") {
        void navigate({ to: getChannelPath(channel), replace: true });
      } else if (nextMode === "iptv") {
        void navigate({
          to: iptvChannel ? getIptvItemPath(iptvCountry, iptvChannel) : getIptvPath(iptvCountry),
          replace: true,
        });
      } else {
        void navigate({
          to: radioStation
            ? getRadioItemPath(radioCountry, radioStation)
            : getRadioPath(radioCountry),
          replace: true,
        });
      }
    },
    [channel, iptvChannel, iptvCountry, navigate, radioCountry, radioStation],
  );

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
        pushHistory(makeYtHistoryEntry(ch));
        void navigate({
          to: getChannelPath(ch),
          replace: true,
        });
      }
    },
    [navigate, pushHistory, triggerStatic],
  );

  const openRandomChannel = useCallback(() => {
    const next = getRandomChannel(channel.id);
    openChannel(next);
    toast("Surprise channel loaded");
  }, [channel.id, openChannel]);

  const openDiscoveryDesk = useCallback(() => {
    void navigate({ to: "/discover" });
  }, [navigate]);

  const openPlayground = useCallback(() => {
    void navigate({ to: "/playground" });
  }, [navigate]);

  const openFocusRoom = useCallback(() => {
    void navigate({ to: "/focus" });
  }, [navigate]);

  const resumeLatest = useCallback(() => {
    const latest = history[0];
    if (!latest) return;
    setGuideOpen(false);
    setMode(latest.mode);
    void navigate({ to: latest.path, replace: true });
  }, [history, navigate]);

  const openHistoryEntry = useCallback(
    (entry: TvHistoryEntry) => {
      setGuideOpen(false);
      setMode(entry.mode);
      void navigate({ to: entry.path, replace: true });
    },
    [navigate],
  );

  const handleModeChange = useCallback(
    (nextMode: "yt" | "iptv" | "radio") => {
      setMode(nextMode);
      navigateToMode(nextMode);
    },
    [navigateToMode],
  );

  const handleIptvCountryChange = useCallback(
    (country: string) => {
      const next = normalizeIptvCountryCode(country);
      setIptvCountry(next);
      setIptvChannel(null);
      setIptvError(null);
      setMode("iptv");
      void navigate({ to: getIptvPath(next), replace: true });
    },
    [navigate],
  );

  const handleRadioCountryChange = useCallback(
    (country: string) => {
      const next = normalizeRadioCountryCode(country);
      setRadioCountry(next);
      setRadioStation(null);
      setRadioError(null);
      setMode("radio");
      void navigate({ to: getRadioPath(next), replace: true });
    },
    [navigate],
  );

  const changeChannel = useCallback(
    (delta: number) => {
      const next = CHANNELS[(channelIdx + delta + CHANNELS.length) % CHANNELS.length];
      openChannel(next);
    },
    [channelIdx, openChannel],
  );

  const pickIptv = useCallback(
    (country: string, ch: IptvChannel) => {
      const nextCountry = normalizeIptvCountryCode(country);
      setIptvCountry(nextCountry);
      setIptvChannel(ch);
      setIptvError(null);
      setMode("iptv");
      setTitle(ch.name);
      setGuideOpen(false);
      pushHistory(makeIptvHistoryEntry(nextCountry, ch));
      void navigate({ to: getIptvItemPath(nextCountry, ch), replace: true });
      loadCountryChannels(nextCountry)
        .then((list) => {
          const pool = list.filter((c) => c.url !== ch.url && (!ch.group || c.group === ch.group));
          for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
          }
          setIptvCandidates(pool.slice(0, 12));
        })
        .catch(() => setIptvCandidates([]));
    },
    [navigate, pushHistory],
  );

  const pickRadio = useCallback(
    (country: string, st: RadioStation) => {
      const nextCountry = normalizeRadioCountryCode(country);
      setRadioCountry(nextCountry);
      setRadioStation(st);
      setRadioError(null);
      setMode("radio");
      setTitle(st.name);
      setGuideOpen(false);
      pushHistory(makeRadioHistoryEntry(nextCountry, st));
      void navigate({ to: getRadioItemPath(nextCountry, st), replace: true });
    },
    [navigate, pushHistory],
  );

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
      <header className="relative flex items-center justify-between gap-4 overflow-hidden border-b border-border/60 bg-[linear-gradient(90deg,rgba(8,12,16,0.98),rgba(10,16,15,0.94)_42%,rgba(18,13,8,0.95))] px-6 py-3">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(112,239,183,0.68),rgba(255,196,92,0.58),transparent)]" />
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md border border-primary/30 bg-[linear-gradient(135deg,rgba(79,174,123,0.18),rgba(226,174,74,0.12))] text-primary shadow-glow">
            <Tv className="h-4.5 w-4.5" />
          </div>
          <div>
            <h1 className="font-mono-tv text-lg font-semibold tracking-[0.12em] text-foreground">
              Tube<span className="text-primary">TV</span>
            </h1>
            <p className="font-mono-tv text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              broadcast desk
            </p>
          </div>
        </div>
        <Clock />
      </header>

      <Ticker />

      <section className="relative flex flex-1 flex-col lg:flex-row">
        <aside className="hidden w-64 shrink-0 border-r border-border/60 bg-[linear-gradient(180deg,rgba(9,12,15,0.96),rgba(6,8,10,0.98))] lg:block">
          <div className="border-b border-border/60 px-4 py-3 font-mono-tv text-[10px] uppercase tracking-widest text-muted-foreground">
            Sources
          </div>
          <div className="h-[calc(100vh-180px)] overflow-y-auto py-2">
            <button
              onClick={() => {
                handleModeChange("iptv");
                setGuideOpen(true);
              }}
              className={
                "flex w-full items-center gap-3 border-l-2 px-4 py-3 text-left transition-colors " +
                (mode === "iptv"
                  ? "border-primary bg-primary/10"
                  : "border-transparent hover:bg-primary/8")
              }
            >
              <Globe2 className="h-5 w-5 text-primary" />
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
                handleModeChange("radio");
                setGuideOpen(true);
              }}
              className={
                "flex w-full items-center gap-3 border-l-2 px-4 py-3 text-left transition-colors " +
                (mode === "radio"
                  ? "border-accent bg-accent/10"
                  : "border-transparent hover:bg-accent/8")
              }
            >
              <RadioIcon className="h-5 w-5 text-accent" />
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
                      : "border-transparent hover:bg-primary/8")
                  }
                >
                  <span
                    className={cn(
                      "font-mono-tv text-lg font-bold tabular-nums",
                      active ? "text-foreground" : "text-muted-foreground/80",
                    )}
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
              "relative aspect-video w-full bg-[radial-gradient(circle_at_top_left,rgba(79,174,123,0.11),transparent_28%),radial-gradient(circle_at_top_right,rgba(104,145,255,0.08),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(226,174,74,0.1),transparent_22%),#050608] lg:aspect-auto lg:flex-1 " +
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
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[linear-gradient(135deg,rgba(6,8,10,0.96),rgba(10,14,16,0.95),rgba(13,10,8,0.96))] text-center">
                <RadioIcon className="h-16 w-16 animate-pulse-dot text-accent" />
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
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[linear-gradient(135deg,rgba(5,7,9,0.98),rgba(10,12,15,0.96))] text-center">
                {mode === "radio" ? (
                  <RadioIcon className="h-10 w-10 text-accent" />
                ) : (
                  <Globe2 className="h-10 w-10 text-primary" />
                )}
                <div className="font-mono-tv text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  {mode === "radio"
                    ? "Radio - pick a country & station"
                    : "Live TV - pick a country & channel"}
                </div>
                <button
                  onClick={() => setGuideOpen(true)}
                  className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground shadow-glow-accent"
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

            <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-3 rounded-md border border-border/60 bg-background/75 px-3 py-2 backdrop-blur">
              <span className="flex items-center gap-1.5 font-mono-tv text-[10px] uppercase tracking-widest text-primary">
                <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-primary" />
                Live
              </span>
              {mode === "yt" && currentMeta && (
                <>
                  <span className="font-mono-tv text-lg font-bold leading-none text-primary">
                    {currentMeta.number}
                  </span>
                  <span className="text-sm font-semibold tracking-tight">{currentMeta.name}</span>
                </>
              )}
              {mode === "iptv" && (
                <>
                  <span className="font-mono-tv text-lg leading-none text-primary">
                    {countryLabel?.flag}
                  </span>
                  <span className="text-sm font-semibold tracking-tight">
                    {iptvChannel?.name ?? "Live TV"}
                  </span>
                </>
              )}
              {mode === "radio" && (
                <>
                  <span className="font-mono-tv text-lg leading-none text-accent">
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

          <div className="border-t border-border/60 bg-[linear-gradient(180deg,rgba(8,10,12,0.72),rgba(4,5,7,0.96))] px-6 py-4">
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
                      className="flex items-center gap-1.5 rounded-md border border-border/60 bg-background/45 px-3 py-2 text-sm font-medium hover:border-primary/60 hover:bg-primary/10 hover:text-primary"
                      aria-label="Previous channel"
                    >
                      <ChevronDown className="h-4 w-4" /> CH-
                    </button>
                    <button
                      onClick={() => changeChannel(1)}
                      className="flex items-center gap-1.5 rounded-md border border-border/60 bg-background/45 px-3 py-2 text-sm font-medium hover:border-primary/60 hover:bg-primary/10 hover:text-primary"
                      aria-label="Next channel"
                    >
                      <ChevronUp className="h-4 w-4" /> CH+
                    </button>
                    <button
                      onClick={advance}
                      className="flex items-center gap-1.5 rounded-md border border-border/60 bg-background/45 px-3 py-2 text-sm font-medium hover:border-accent/60 hover:bg-accent/10 hover:text-accent"
                      aria-label="Skip to next video"
                    >
                      <SkipForward className="h-4 w-4" /> Skip
                    </button>
                  </>
                )}
                <button
                  onClick={() => setMuted((m) => !m)}
                  className="rounded-md border border-border/60 bg-background/45 p-2 hover:border-primary/60 hover:bg-primary/10 hover:text-primary"
                  aria-label={muted ? "Unmute" : "Mute"}
                >
                  {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => setGuideOpen(true)}
                  className="flex items-center gap-1.5 rounded-md bg-[linear-gradient(135deg,rgba(79,174,123,0.95),rgba(58,143,104,0.95))] px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-95"
                >
                  <Grid3x3 className="h-4 w-4" /> Guide
                </button>
                {history[0] && (
                  <button
                    onClick={resumeLatest}
                    className="flex items-center gap-1.5 rounded-md border border-border/60 bg-background/45 px-3 py-2 text-sm font-medium hover:border-primary/60 hover:bg-primary/10 hover:text-primary"
                    aria-label="Resume latest"
                  >
                    <SkipForward className="h-4 w-4" /> Resume
                  </button>
                )}
                <button
                  onClick={openRandomChannel}
                  className="flex items-center gap-1.5 rounded-md border border-border/60 bg-background/45 px-3 py-2 text-sm font-medium hover:border-accent/60 hover:bg-accent/10 hover:text-accent"
                  aria-label="Surprise me"
                >
                  <Sparkles className="h-4 w-4" /> Surprise
                </button>
                <button
                  onClick={copyShareLink}
                  className="rounded-md border border-border/60 bg-background/45 p-2 hover:border-primary/60 hover:bg-primary/10 hover:text-primary"
                  aria-label="Copy current link"
                >
                  <Link2 className="h-4 w-4" />
                </button>
                <button
                  onClick={openDiscoveryDesk}
                  className="flex items-center gap-1.5 rounded-md border border-border/60 bg-background/45 px-3 py-2 text-sm font-medium hover:border-primary/60 hover:bg-primary/10 hover:text-primary"
                  aria-label="Open discovery desk"
                >
                  <Compass className="h-4 w-4" /> Discover
                </button>
                <button
                  onClick={openPlayground}
                  className="flex items-center gap-1.5 rounded-md border border-border/60 bg-background/45 px-3 py-2 text-sm font-medium hover:border-accent/60 hover:bg-accent/10 hover:text-accent"
                  aria-label="Open playground"
                >
                  <Gamepad2 className="h-4 w-4" /> Play
                </button>
                <button
                  onClick={openFocusRoom}
                  className="flex items-center gap-1.5 rounded-md border border-border/60 bg-background/45 px-3 py-2 text-sm font-medium hover:border-primary/60 hover:bg-primary/10 hover:text-primary"
                  aria-label="Open focus room"
                >
                  <Timer className="h-4 w-4" /> Focus
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
          onModeChange={handleModeChange}
          currentId={channel.id}
          onPick={openChannel}
          onPickIptv={pickIptv}
          iptvCountry={iptvCountry}
          onCountryChange={handleIptvCountryChange}
          iptvCurrentUrl={iptvChannel?.url ?? null}
          onPickRadio={pickRadio}
          radioCountry={radioCountry}
          onRadioCountryChange={handleRadioCountryChange}
          radioCurrentUrl={radioStation?.url_resolved || radioStation?.url || null}
          onClose={() => setGuideOpen(false)}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          history={history}
          onPickHistory={openHistoryEntry}
        />
      </section>

      {helpOpen && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-md border border-border/60 bg-[linear-gradient(180deg,rgba(12,15,18,0.96),rgba(7,9,12,0.98))] p-6 shadow-2xl">
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
