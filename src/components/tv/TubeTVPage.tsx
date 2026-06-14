import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CHANNELS, getChannelBySlug, getChannelPath, shuffle, type Channel, CATEGORIES, normalizeChannelSlug } from "@/lib/channels";
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
import { getCategoryColor } from "@/lib/ui-kit";
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
  Search,
  Newspaper,
  Map,
  BookOpen,
  Music2,
  Film,
  Github,
  Minimize,
  Maximize,
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
  const [fullWindow, setFullWindow] = useState(false);
  const [staticBurst, setStaticBurst] = useState(0);
  const [helpOpen, setHelpOpen] = useState(false);
  const [jumpOpen, setJumpOpen] = useState(false);
  const [jumpQuery, setJumpQuery] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [history, setHistory] = useState<TvHistoryEntry[]>([]);
  const failedVideosRef = useRef<Record<string, Set<string>>>({});
  const hasHydratedRef = useRef(false);
  const initialIptvItemSlugRef = useRef(initialIptvItemSlug);
  const initialRadioItemSlugRef = useRef(initialRadioItemSlug);

  const channel: Channel = CHANNELS[channelIdx];

  const [activeViewers, setActiveViewers] = useState(48);
  const [totalViewers, setTotalViewers] = useState(14832);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTotal = localStorage.getItem("tubetv:total-viewers");
      let base = savedTotal ? parseInt(savedTotal, 10) : 14832;
      base += Math.floor(Math.random() * 3) + 1;
      localStorage.setItem("tubetv:total-viewers", base.toString());
      setTotalViewers(base);
    }

    const interval = setInterval(() => {
      setActiveViewers((prev) => {
        const diff = Math.floor(Math.random() * 5) - 2;
        const next = prev + diff;
        return Math.max(38, Math.min(68, next));
      });
      setTotalViewers((prev) => {
        const next = prev + (Math.random() > 0.7 ? 1 : 0);
        try {
          localStorage.setItem("tubetv:total-viewers", next.toString());
        } catch {}
        return next;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

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

    if (initialIptvItemSlug && mode === "iptv") {
      const currentSlug = iptvChannel ? getIptvItemSlug(iptvChannel) : null;
      if (normalizeChannelSlug(initialIptvItemSlug) !== currentSlug) {
        loadCountryChannels(iptvCountry)
          .then((list) => {
            if (cancelled) return;
            const found = findIptvChannelBySlug(list, initialIptvItemSlug);
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
              // Fallback global search across other supported countries
              const fallbackCountries = ["us", "uk", "ca", "in", "fr", "de", "es", "au", "jp", "kr"];
              Promise.all(
                fallbackCountries
                  .filter((c) => c !== iptvCountry)
                  .map((code) =>
                    loadCountryChannels(code)
                      .then((subList) => {
                        const match = findIptvChannelBySlug(subList, initialIptvItemSlug);
                        return match ? { match, code } : null;
                      })
                      .catch(() => null)
                  )
              ).then((results) => {
                if (cancelled) return;
                const match = results.find((r) => r !== null);
                if (match) {
                  setIptvCountry(match.code);
                  setIptvChannel(match.match);
                  setTitle(match.match.name);
                  setIptvError(null);
                  pushHistory(makeIptvHistoryEntry(match.code, match.match));
                  void navigate({
                    to: getIptvItemPath(match.code, match.match),
                    replace: true,
                  });
                } else {
                  void navigate({ to: getIptvPath(iptvCountry), replace: true });
                }
              });
            }
          })
          .catch(() => {});
      }
    }

    if (initialRadioItemSlug && mode === "radio") {
      const currentSlug = radioStation ? getRadioItemSlug(radioStation) : null;
      if (normalizeChannelSlug(initialRadioItemSlug) !== currentSlug) {
        loadCountryRadio(radioCountry)
          .then((list) => {
            if (cancelled) return;
            const found = findRadioStationBySlug(list, initialRadioItemSlug);
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
          .catch(() => {});
      }
    }

    return () => {
      cancelled = true;
    };
  }, [
    initialIptvItemSlug,
    initialRadioItemSlug,
    mode,
    iptvCountry,
    radioCountry,
    iptvChannel,
    radioStation,
    navigate,
    pushHistory,
  ]);

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

  const openJumpPalette = useCallback(() => {
    setJumpQuery("");
    setGuideOpen(false);
    setHelpOpen(false);
    setJumpOpen(true);
  }, []);

  const closeJumpPalette = useCallback(() => {
    setJumpOpen(false);
    setJumpQuery("");
  }, []);

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

  const jumpTargets = useMemo(() => {
    const items: Array<{
      id: string;
      title: string;
      subtitle: string;
      kind: string;
      run: () => void;
    }> = [
      {
        id: "route-home",
        title: "TubeTV",
        subtitle: "Return to the current broadcast desk",
        kind: "route",
        run: () => {
          setMode("yt");
          setJumpOpen(false);
          void navigate({ to: getChannelPath(channel), replace: true });
        },
      },
      {
        id: "route-discover",
        title: "Discovery Desk",
        subtitle: "News, wiki, and artist trail",
        kind: "route",
        run: () => {
          setJumpOpen(false);
          void navigate({ to: "/discover" });
        },
      },
      {
        id: "route-play",
        title: "Playground",
        subtitle: "Geo, music, screen, anime, and books",
        kind: "route",
        run: () => {
          setJumpOpen(false);
          void navigate({ to: "/playground" });
        },
      },
      {
        id: "route-focus",
        title: "Focus Room",
        subtitle: "Pomodoro, notes, and sketch canvas",
        kind: "route",
        run: () => {
          setJumpOpen(false);
          void navigate({ to: "/focus" });
        },
      },
      {
        id: "route-wordle",
        title: "Wordle",
        subtitle: "Daily 5-letter word guessing game",
        kind: "route",
        run: () => {
          setJumpOpen(false);
          void navigate({ to: "/wordle" });
        },
      },
      {
        id: "route-vibes",
        title: "Vibes",
        subtitle: "Music mood explorer — lofi to synthwave",
        kind: "route",
        run: () => {
          setJumpOpen(false);
          void navigate({ to: "/vibes" });
        },
      },
      {
        id: "route-movies",
        title: "Movies & Series Cabinet",
        subtitle: "On-demand CDN streaming search engine",
        kind: "route",
        run: () => {
          setJumpOpen(false);
          void navigate({ to: "/movies" });
        },
      },
      {
        id: "route-news",
        title: "News Aggregator",
        subtitle: "Aggregated live tech, world, anime feeds",
        kind: "route",
        run: () => {
          setJumpOpen(false);
          void navigate({ to: "/news" });
        },
      },
      {
        id: "route-reader",
        title: "Interactive Reader",
        subtitle: "Interactive annotations and Wikipedia search",
        kind: "route",
        run: () => {
          setJumpOpen(false);
          void navigate({ to: "/reader" });
        },
      },
      {
        id: "route-roadmap",
        title: "Feature Roadmap",
        subtitle: "Progress, shipped logs, and saturation index",
        kind: "route",
        run: () => {
          setJumpOpen(false);
          void navigate({ to: "/roadmap" });
        },
      },
      ...history.slice(0, 6).map((entry) => ({
        id: `history-${entry.path}`,
        title: entry.title,
        subtitle: entry.subtitle,
        kind:
          entry.mode === "yt"
            ? "recent yt"
            : entry.mode === "iptv"
              ? "recent iptv"
              : "recent radio",
        run: () => {
          setJumpOpen(false);
          openHistoryEntry(entry);
        },
      })),
      ...CHANNELS.map((ch) => ({
        id: `channel-${ch.id}`,
        title: `${ch.number}. ${ch.name}`,
        subtitle: ch.tagline,
        kind: ch.category,
        run: () => {
          setJumpOpen(false);
          openChannel(ch);
        },
      })),
    ];

    const query = jumpQuery.trim().toLowerCase();
    const filtered = query
      ? items.filter((item) =>
          [item.title, item.subtitle, item.kind].some((value) =>
            value.toLowerCase().includes(query),
          ),
        )
      : items;

    return filtered.slice(0, 32);
  }, [channel, history, jumpQuery, navigate, openChannel, openHistoryEntry]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Command+K / Ctrl+K Command Palette toggle
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setJumpOpen((o) => !o);
        return;
      }

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
        setJumpOpen(false);
        setFullWindow(false);
      } else if (e.key.toLowerCase() === "m") {
        setMuted((m) => !m);
      } else if (e.key.toLowerCase() === "c") {
        setCrt((c) => !c);
      } else if (e.key === "?" || e.key === "/") {
        e.preventDefault();
        setHelpOpen((o) => !o);
      } else if (e.key.toLowerCase() === "j") {
        e.preventDefault();
        setJumpOpen((o) => !o);
      } else if (e.key.toLowerCase() === "f") {
        e.preventDefault();
        setFullWindow((fw) => !fw);
      } else if ((e.altKey || e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "f" && mode === "yt") {
        e.preventDefault();
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
    <main className="relative flex h-screen flex-col overflow-hidden bg-[#050608]">
      <header className="relative flex items-center justify-between gap-3 overflow-hidden border-b border-border/60 bg-[linear-gradient(90deg,rgba(8,12,16,0.98),rgba(10,16,15,0.94)_42%,rgba(18,13,8,0.95))] px-3 py-2.5 sm:px-6 sm:py-3">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(112,239,183,0.68),rgba(255,196,92,0.58),transparent)]" />
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md border border-primary/30 bg-[linear-gradient(135deg,rgba(79,174,123,0.18),rgba(226,174,74,0.12))] text-primary shadow-glow sm:h-9 sm:w-9">
            <Tv className="h-4.5 w-4.5" />
          </div>
          <div>
            <h1 className="font-mono-tv text-base font-semibold tracking-[0.12em] text-foreground sm:text-lg">
              Tube<span className="text-primary">TV</span>
            </h1>
            <p className="hidden font-mono-tv text-[10px] uppercase tracking-[0.22em] text-muted-foreground sm:block">
              broadcast desk
            </p>
          </div>
        </div>
        <Clock />
      </header>

      <Ticker />

      <section className="relative flex flex-1 flex-col lg:flex-row min-h-0">
        <aside className="hidden w-64 shrink-0 border-r border-border/60 bg-[linear-gradient(180deg,rgba(8,10,14,0.98),rgba(5,6,9,0.99))] lg:flex lg:flex-col">
          {/* Header: Sources label */}
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-2.5">
            <span className="font-mono-tv text-[10px] uppercase tracking-widest text-muted-foreground">Sources</span>
            <span className="rounded bg-primary/15 px-1.5 py-0.5 font-mono-tv text-[9px] uppercase tracking-widest text-primary">{CHANNELS.length} ch</span>
          </div>

          {/* Mode switchers with per-mode neon accents */}
          <div className="border-b border-border/60 py-1.5">
            <button
              onClick={() => { handleModeChange("iptv"); setGuideOpen(true); }}
              style={mode === "iptv" ? { boxShadow: "inset 3px 0 0 oklch(0.84 0.14 205)" } : undefined}
              className={cn(
                "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-all duration-200",
                mode === "iptv"
                  ? "bg-[oklch(0.84_0.14_205_/_0.1)] text-[oklch(0.84_0.14_205)]"
                  : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
              )}
            >
              <Globe2 className="h-4 w-4 shrink-0" />
              <span className="flex-1">
                <span className="block text-[11px] font-semibold uppercase tracking-wider">Live TV</span>
                <span className="block text-[10px] opacity-70">{countryLabel?.flag} {countryLabel?.name}</span>
              </span>
              {mode === "iptv" && <span className="h-1.5 w-1.5 shrink-0 animate-pulse-dot rounded-full bg-[oklch(0.84_0.14_205)]" />}
            </button>
            <button
              onClick={() => { handleModeChange("radio"); setGuideOpen(true); }}
              style={mode === "radio" ? { boxShadow: "inset 3px 0 0 oklch(0.86 0.16 72)" } : undefined}
              className={cn(
                "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-all duration-200",
                mode === "radio"
                  ? "bg-[oklch(0.86_0.16_72_/_0.1)] text-[oklch(0.86_0.16_72)]"
                  : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
              )}
            >
              <RadioIcon className="h-4 w-4 shrink-0" />
              <span className="flex-1">
                <span className="block text-[11px] font-semibold uppercase tracking-wider">Radio World</span>
                <span className="block text-[10px] opacity-70">{radioCountryLabel?.flag} {radioCountryLabel?.name}</span>
              </span>
              {mode === "radio" && <span className="h-1.5 w-1.5 shrink-0 animate-pulse-dot rounded-full bg-[oklch(0.86_0.16_72)]" />}
            </button>
            <button
              onClick={() => navigate({ to: "/movies" })}
              className={cn(
                "flex w-full items-center gap-3 border-t border-border/45 px-4 py-2.5 text-left transition-all duration-200",
                "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
              )}
            >
              <Film className="h-4 w-4 shrink-0 text-[oklch(0.74_0.18_335)]" />
              <span className="flex-1">
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-[oklch(0.74_0.18_335)]" style={{ textShadow: "0 0 6px oklch(0.74 0.18 335 / 0.4)" }}>Movies & Series</span>
                <span className="block text-[10px] opacity-70">On-Demand Stream</span>
              </span>
            </button>
          </div>

          {/* YouTube channel list grouped by category */}
          <div className="flex-1 overflow-y-auto">
            {CATEGORIES.map((cat) => {
              const catChannels = CHANNELS.filter((ch) => ch.category === cat);
              const catColor = getCategoryColor(cat);
              return (
                <div key={cat}>
                  {/* Category header chip */}
                  <div className={cn("flex items-center gap-1.5 border-b border-t border-border/40 px-3 py-1.5", catColor.bg)}>
                    <span className={cn("font-mono-tv text-[9px] font-bold uppercase tracking-widest", catColor.text)}>
                      {catColor.label}
                    </span>
                    <span className={cn("ml-auto font-mono-tv text-[9px] opacity-60", catColor.text)}>{catChannels.length}</span>
                  </div>
                  {catChannels.map((ch) => {
                    const active = mode === "yt" && CHANNELS.indexOf(ch) === channelIdx;
                    return (
                      <button
                        key={ch.id}
                        onClick={() => openChannel(ch)}
                        style={active ? { boxShadow: `inset 3px 0 0 ${ch.color}`, background: `${ch.color}18` } : undefined}
                        className={cn(
                          "flex w-full items-center gap-2.5 px-3 py-2 text-left transition-all duration-150",
                          active ? "text-foreground" : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground/90"
                        )}
                      >
                        <span
                          className="font-mono-tv text-base font-bold tabular-nums"
                          style={active ? { color: ch.color, textShadow: `0 0 8px ${ch.color}` } : undefined}
                        >
                          {ch.number}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block truncate text-[11px] font-semibold tracking-tight">{ch.name}</span>
                          <span className="block truncate text-[10px] opacity-60">{ch.tagline}</span>
                        </span>
                        {active && (
                          <span
                            className="h-1.5 w-1.5 shrink-0 animate-pulse-dot rounded-full"
                            style={{ background: ch.color, boxShadow: `0 0 6px ${ch.color}` }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}

            {/* Sidebar bottom: quick nav to extra routes (inside scroll area) */}
            <div className="border-t border-border/60 p-2 grid grid-cols-4 gap-1 mt-4 bg-black/10">
              {([
                { to: "/discover", icon: Compass, label: "Disc", color: "oklch(0.84 0.14 205)" },
                { to: "/playground", icon: Gamepad2, label: "Play", color: "oklch(0.74 0.18 335)" },
                { to: "/news", icon: Newspaper, label: "News", color: "oklch(0.84 0.14 205)" },
                { to: "/vibes", icon: Music2, label: "Vibes", color: "oklch(0.8 0.14 180)" },
                { to: "/wordle", icon: BookOpen, label: "Word", color: "oklch(0.82 0.18 152)" },
                { to: "/focus", icon: Timer, label: "Focus", color: "oklch(0.86 0.16 72)" },
                { to: "/roadmap", icon: Map, label: "Map", color: "oklch(0.72 0.16 305)" },
                { to: "/reader", icon: BookOpen, label: "Read", color: "oklch(0.86 0.16 72)" },
              ] as const).map(({ to, icon: Icon, label, color }) => (
                <button
                  key={to}
                  onClick={() => navigate({ to })}
                  className="flex flex-col items-center gap-0.5 rounded p-1.5 transition-all duration-150 hover:bg-white/[0.06]"
                  title={label}
                >
                  <Icon className="h-3.5 w-3.5" style={{ color }} />
                  <span className="font-mono-tv text-[8px] uppercase tracking-wider" style={{ color, opacity: 0.8 }}>{label}</span>
                </button>
              ))}
            </div>

            {/* GitHub Repo Link & Live Stats at the bottom of the sidebar (inside scroll area) */}
            <div className="border-t border-border/60 bg-black/40 p-2.5 flex flex-col gap-2">
              <div className="flex flex-col gap-1 rounded bg-black/30 p-2 font-mono-tv text-[9px] text-muted-foreground border border-border/20">
                <div className="flex justify-between items-center">
                  <span>VERSION</span>
                  <span className="text-primary font-bold">v2.4.2</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>UPDATED</span>
                  <span className="text-foreground">Jun 14, 2026</span>
                </div>
                <div className="h-[1px] bg-border/40 my-1" />
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    ACTIVE
                  </span>
                  <span className="text-emerald-400 font-bold">{activeViewers}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>TOTAL VIEWS</span>
                  <span className="text-sky-400 font-bold">{totalViewers.toLocaleString()}</span>
                </div>
              </div>

              <a
                href="https://github.com/Paranjayy/youtubeiptv"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded px-2.5 py-1.5 text-xs text-muted-foreground transition-all duration-200 hover:bg-white/[0.04] hover:text-foreground w-full border border-dashed border-border/40 hover:border-border/80"
              >
                <Github className="h-3.5 w-3.5 text-primary" />
                <span className="font-mono-tv text-[9px] uppercase tracking-[0.15em]">GitHub Source</span>
              </a>
            </div>
          </div>
        </aside>

        <div className="relative flex flex-1 flex-col min-h-0">
          <div
            className={cn(
              "relative aspect-video w-full bg-[radial-gradient(circle_at_top_left,rgba(79,174,123,0.11),transparent_28%),radial-gradient(circle_at_top_right,rgba(104,145,255,0.08),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(226,174,74,0.1),transparent_22%),#050608] lg:aspect-auto lg:flex-1",
              crt && "crt-screen",
              fullWindow && "fixed inset-0 z-50 w-screen h-screen"
            )}
          >
            {fullWindow && (
              <button
                onClick={() => setFullWindow(false)}
                className="absolute right-4 top-4 z-50 flex items-center gap-1.5 rounded-md border border-white/20 bg-black/75 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-white shadow-lg backdrop-blur-sm transition-all hover:bg-black/90 hover:border-white/40"
              >
                <Minimize className="h-3.5 w-3.5 text-glow" /> Exit Screen
              </button>
            )}
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

            <div className="pointer-events-none absolute left-3 top-3 flex max-w-[calc(100%-1.5rem)] items-center gap-2 rounded-md border border-border/60 bg-background/75 px-2.5 py-1.5 backdrop-blur sm:left-4 sm:top-4 sm:gap-3 sm:px-3 sm:py-2">
              <span className="flex items-center gap-1.5 font-mono-tv text-[10px] uppercase tracking-widest text-primary">
                <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-primary" />
                Live
              </span>
              {mode === "yt" && currentMeta && (
                <>
                  <span className="font-mono-tv text-base font-bold leading-none text-primary sm:text-lg">
                    {currentMeta.number}
                  </span>
                  <span className="truncate text-xs font-semibold tracking-tight sm:text-sm">
                    {currentMeta.name}
                  </span>
                </>
              )}
              {mode === "iptv" && (
                <>
                  <span className="font-mono-tv text-base leading-none text-primary sm:text-lg">
                    {countryLabel?.flag}
                  </span>
                  <span className="truncate text-xs font-semibold tracking-tight sm:text-sm">
                    {iptvChannel?.name ?? "Live TV"}
                  </span>
                </>
              )}
              {mode === "radio" && (
                <>
                  <span className="font-mono-tv text-base leading-none text-accent sm:text-lg">
                    {radioCountryLabel?.flag}
                  </span>
                  <span className="truncate text-xs font-semibold tracking-tight sm:text-sm">
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

          <div className="border-t border-border/60 bg-[linear-gradient(180deg,rgba(8,10,12,0.72),rgba(4,5,7,0.96))] px-3 py-3 sm:px-6 sm:py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-4">
              <div className="min-w-0 flex-1">
                <div className="font-mono-tv text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                  Now playing -{" "}
                  {mode === "yt"
                    ? channel.category
                    : mode === "iptv"
                      ? `Live TV - ${countryLabel?.name}`
                      : `Radio - ${radioCountryLabel?.name}`}
                </div>
                <div className="mt-1 truncate text-base font-semibold tracking-tight sm:text-lg">
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

              <div className="-mx-3 flex items-center gap-1.5 overflow-x-auto px-3 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
                {mode === "yt" && (
                  <>
                    <button
                      onClick={() => changeChannel(-1)}
                      className="flex shrink-0 items-center gap-1 rounded-md border border-border/60 bg-background/45 px-2.5 py-1.5 text-xs font-medium hover:border-[oklch(0.82_0.18_152_/_0.5)] hover:bg-[oklch(0.82_0.18_152_/_0.08)] hover:text-[oklch(0.82_0.18_152)]"
                      aria-label="Previous channel"
                    >
                      <ChevronDown className="h-3.5 w-3.5" /> CH−
                    </button>
                    <button
                      onClick={() => changeChannel(1)}
                      className="flex shrink-0 items-center gap-1 rounded-md border border-border/60 bg-background/45 px-2.5 py-1.5 text-xs font-medium hover:border-[oklch(0.82_0.18_152_/_0.5)] hover:bg-[oklch(0.82_0.18_152_/_0.08)] hover:text-[oklch(0.82_0.18_152)]"
                      aria-label="Next channel"
                    >
                      <ChevronUp className="h-3.5 w-3.5" /> CH+
                    </button>
                    <button
                      onClick={advance}
                      className="flex shrink-0 items-center gap-1 rounded-md border border-border/60 bg-background/45 px-2.5 py-1.5 text-xs font-medium hover:border-[oklch(0.86_0.16_72_/_0.5)] hover:bg-[oklch(0.86_0.16_72_/_0.08)] hover:text-[oklch(0.86_0.16_72)]"
                      aria-label="Skip to next video"
                    >
                      <SkipForward className="h-3.5 w-3.5" /> Skip
                    </button>
                  </>
                )}
                <button
                  onClick={() => setMuted((m) => !m)}
                  className="shrink-0 rounded-md border border-border/60 bg-background/45 p-1.5 hover:border-[oklch(0.82_0.18_152_/_0.5)] hover:bg-[oklch(0.82_0.18_152_/_0.08)] hover:text-[oklch(0.82_0.18_152)]"
                  aria-label={muted ? "Unmute" : "Mute"}
                >
                  {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                </button>
                <button
                  onClick={() => setFullWindow((fw) => !fw)}
                  className="shrink-0 rounded-md border border-border/60 bg-background/45 p-1.5 hover:border-[oklch(0.86_0.16_72_/_0.5)] hover:bg-[oklch(0.86_0.16_72_/_0.08)] hover:text-[oklch(0.86_0.16_72)]"
                  aria-label={fullWindow ? "Exit Full Window" : "Full Window"}
                  title="Full Window (F)"
                >
                  {fullWindow ? <Minimize className="h-3.5 w-3.5" /> : <Maximize className="h-3.5 w-3.5" />}
                </button>
                <button
                  onClick={() => setGuideOpen(true)}
                  className="flex shrink-0 items-center gap-1 rounded-md bg-[oklch(0.82_0.18_152)] px-3 py-1.5 text-xs font-semibold text-black shadow-[0_0_10px_oklch(0.82_0.18_152_/_0.4)] hover:opacity-90"
                >
                  <Grid3x3 className="h-3.5 w-3.5" /> Guide
                </button>
                {history[0] && (
                  <button
                    onClick={resumeLatest}
                    className="flex shrink-0 items-center gap-1 rounded-md border border-border/60 bg-background/45 px-2.5 py-1.5 text-xs font-medium hover:border-[oklch(0.82_0.18_152_/_0.5)] hover:bg-[oklch(0.82_0.18_152_/_0.08)] hover:text-[oklch(0.82_0.18_152)]"
                    aria-label="Resume latest"
                  >
                    <SkipForward className="h-3.5 w-3.5" /> Resume
                  </button>
                )}
                <button
                  onClick={openRandomChannel}
                  className="flex shrink-0 items-center gap-1 rounded-md border border-border/60 bg-background/45 px-2.5 py-1.5 text-xs font-medium hover:border-[oklch(0.86_0.16_72_/_0.5)] hover:bg-[oklch(0.86_0.16_72_/_0.08)] hover:text-[oklch(0.86_0.16_72)]"
                  aria-label="Surprise me"
                >
                  <Sparkles className="h-3.5 w-3.5" /> Surprise
                </button>

                {/* Separator */}
                <span className="mx-0.5 h-4 w-px shrink-0 bg-border/60" />

                {/* Discovery/extras in neon colors */}
                <button
                  onClick={openDiscoveryDesk}
                  className="flex shrink-0 items-center gap-1 rounded-md border border-[oklch(0.84_0.14_205_/_0.25)] bg-[oklch(0.84_0.14_205_/_0.07)] px-2.5 py-1.5 text-xs font-medium text-[oklch(0.84_0.14_205)] hover:bg-[oklch(0.84_0.14_205_/_0.14)]"
                  aria-label="Open discovery desk"
                >
                  <Compass className="h-3.5 w-3.5" /> Discover
                </button>
                <button
                  onClick={() => navigate({ to: "/news" })}
                  className="flex shrink-0 items-center gap-1 rounded-md border border-[oklch(0.84_0.14_205_/_0.25)] bg-[oklch(0.84_0.14_205_/_0.07)] px-2.5 py-1.5 text-xs font-medium text-[oklch(0.84_0.14_205)] hover:bg-[oklch(0.84_0.14_205_/_0.14)]"
                  aria-label="Open news"
                >
                  <Newspaper className="h-3.5 w-3.5" /> News
                </button>
                <button
                  onClick={openPlayground}
                  className="flex shrink-0 items-center gap-1 rounded-md border border-[oklch(0.74_0.18_335_/_0.25)] bg-[oklch(0.74_0.18_335_/_0.07)] px-2.5 py-1.5 text-xs font-medium text-[oklch(0.74_0.18_335)] hover:bg-[oklch(0.74_0.18_335_/_0.14)]"
                  aria-label="Open playground"
                >
                  <Gamepad2 className="h-3.5 w-3.5" /> Play
                </button>
                <button
                  onClick={openFocusRoom}
                  className="flex shrink-0 items-center gap-1 rounded-md border border-[oklch(0.86_0.16_72_/_0.25)] bg-[oklch(0.86_0.16_72_/_0.07)] px-2.5 py-1.5 text-xs font-medium text-[oklch(0.86_0.16_72)] hover:bg-[oklch(0.86_0.16_72_/_0.14)]"
                  aria-label="Open focus room"
                >
                  <Timer className="h-3.5 w-3.5" /> Focus
                </button>
                <button
                  onClick={() => navigate({ to: "/vibes" })}
                  className="flex shrink-0 items-center gap-1 rounded-md border border-[oklch(0.8_0.14_180_/_0.25)] bg-[oklch(0.8_0.14_180_/_0.07)] px-2.5 py-1.5 text-xs font-medium text-[oklch(0.8_0.14_180)] hover:bg-[oklch(0.8_0.14_180_/_0.14)]"
                  aria-label="Open vibes"
                >
                  <Music2 className="h-3.5 w-3.5" /> Vibes
                </button>

                {/* Separator */}
                <span className="mx-0.5 h-4 w-px shrink-0 bg-border/60" />

                <button
                  onClick={copyShareLink}
                  className="shrink-0 rounded-md border border-border/60 bg-background/45 p-1.5 hover:border-[oklch(0.82_0.18_152_/_0.5)] hover:bg-[oklch(0.82_0.18_152_/_0.08)] hover:text-[oklch(0.82_0.18_152)]"
                  aria-label="Copy current link"
                >
                  <Link2 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={openJumpPalette}
                  className="flex shrink-0 items-center gap-1 rounded-md border border-border/60 bg-background/45 px-2.5 py-1.5 text-xs font-medium hover:border-[oklch(0.82_0.18_152_/_0.5)] hover:bg-[oklch(0.82_0.18_152_/_0.08)] hover:text-[oklch(0.82_0.18_152)]"
                  aria-label="Open jump palette"
                >
                  <Search className="h-3.5 w-3.5" /> Jump
                </button>
              </div>
            </div>

            <div className="mt-2 hidden flex-wrap items-center gap-x-6 gap-y-1 font-mono-tv text-[10px] uppercase tracking-widest text-muted-foreground sm:flex">
              {mode === "yt" && <span>↑/↓ change channel</span>}
              {mode === "yt" && <span>→ skip</span>}
              <span>G guide</span>
              <span>J jump</span>
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
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 px-3 backdrop-blur-sm sm:px-4">
          <div className="w-full max-w-lg rounded-md border border-border/60 bg-[linear-gradient(180deg,rgba(12,15,18,0.96),rgba(7,9,12,0.98))] p-6 shadow-2xl">
            <div className="text-lg font-bold tracking-tight">Keyboard shortcuts</div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm font-mono-tv">
              <div>Cmd+K / Ctrl+K : Search Palette</div>
              <div>F : Full Window / Theater</div>
              <div>Alt+F : Favorite current</div>
              <div>G : Open channel guide</div>
              <div>M : Mute toggle</div>
              <div>C : Toggle CRT filter</div>
              <div>? : Open help panel</div>
              <div>Esc : Exit Full / Close modals</div>
              <div>Up / Down : Change channel</div>
              <div>Right : Skip video</div>
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

      {jumpOpen && (
        <div className="absolute inset-0 z-40 flex items-end justify-center bg-black/65 px-3 pb-3 backdrop-blur-sm sm:items-start sm:px-4 sm:pt-16 sm:pb-0">
          <div className="w-full max-w-2xl overflow-hidden rounded-md border border-border/60 bg-[linear-gradient(180deg,rgba(12,15,18,0.98),rgba(7,9,12,0.98))] shadow-2xl">
            <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3">
              <Search className="h-4 w-4 text-primary" />
              <input
                autoFocus
                value={jumpQuery}
                onChange={(e) => setJumpQuery(e.target.value)}
                placeholder="Jump to a channel, route, or recent item…"
                className="h-10 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <button
                onClick={closeJumpPalette}
                className="font-mono-tv text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground"
              >
                Esc
              </button>
            </div>
            <div className="max-h-[62vh] overflow-y-auto sm:max-h-[60vh]">
              {jumpTargets.map((item) => (
                <button
                  key={item.id}
                  onClick={item.run}
                  className="flex w-full items-center gap-3 border-b border-border/50 px-3 py-3 text-left transition-colors hover:bg-primary/8 sm:px-4"
                >
                  <span className="hidden w-20 shrink-0 font-mono-tv text-[10px] uppercase tracking-widest text-muted-foreground sm:block">
                    {item.kind}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold tracking-tight">
                      {item.title}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {item.subtitle}
                    </span>
                  </span>
                  <span className="font-mono-tv text-[10px] uppercase tracking-widest text-primary">
                    Enter
                  </span>
                </button>
              ))}
              {jumpTargets.length === 0 && (
                <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                  Nothing matches that search.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
