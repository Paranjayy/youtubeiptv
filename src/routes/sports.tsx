import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { loadCategoryChannels, type IptvChannel } from "@/lib/iptv";
import { HlsPlayer } from "@/components/tv/HlsPlayer";
import {
  Tv,
  Radio,
  Search,
  Globe2,
  Loader2,
  AlertTriangle,
  Play,
  Pause,
  Maximize,
  Minimize,
  SkipForward,
  ChevronLeft,
  Trophy,
  Zap,
  Clock,
  Calendar,
  ChevronDown,
  ChevronRight,
  Flag,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/sports")({
  head: () => ({
    meta: [
      { title: "TubeTV - Sports Desk" },
      {
        name: "description",
        content:
          "Live sports: F1, Cricket, Champions League, UFC, NBA, NFL, FIFA. Free HLS streams via iptv-org.",
      },
    ],
  }),
  component: SportsDesk,
});

/* ── Featured free streams (known-working public HLS) ── */
type Stream = {
  id: string;
  name: string;
  tagline: string;
  emoji: string;
  color: string;
  url: string;
  tournament: string;
};

const STREAMS: Stream[] = [
  {
    id: "bein",
    name: "beIN SPORTS XTRA",
    tagline: "premium sports, free",
    emoji: "⚽",
    color: "var(--neon-pink)",
    tournament: "general",
    url: "https://bein-xtra-bein.amagi.tv/playlist.m3u8",
  },
  {
    id: "ocho",
    name: "ESPN8 THE OCHO",
    tagline: "if it's almost a sport",
    emoji: "📺",
    color: "var(--neon-cyan)",
    tournament: "general",
    url: "https://d3b6q2ou5kp8ke.cloudfront.net/ESPNTheOcho.m3u8",
  },
];

/* ── Tournaments ── */
type T = { id: string; label: string; emoji: string; accent: string };
const TOURNAMENTS: T[] = [
  { id: "f1", label: "Formula 1", emoji: "🏎️", accent: "red" },
  { id: "cricket", label: "Cricket", emoji: "🏏", accent: "amber" },
  { id: "ucl", label: "Champions League", emoji: "⚽", accent: "cyan" },
  { id: "ufc", label: "UFC", emoji: "🥊", accent: "pink" },
  { id: "nba", label: "NBA", emoji: "🏀", accent: "purple" },
  { id: "nfl", label: "NFL", emoji: "🏈", accent: "lime" },
];

/* ── Match schedule ── */
type MatchStatus = "live" | "upcoming" | "completed";
type Match = {
  id: string;
  tournament: string;
  home: string;
  away: string;
  hf: string;
  af: string;
  date: string;
  time: string;
  stage: string;
  status: MatchStatus;
  hs?: number;
  as?: number;
};

function buildMatches(): Match[] {
  const now = Date.now();
  const day = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d.toISOString().split("T")[0];
  };
  const mk = (
    t: string,
    id: string,
    home: string,
    away: string,
    hf: string,
    af: string,
    date: string,
    time: string,
    stage: string,
  ): Match => {
    const start = new Date(date + "T" + time + ":00Z").getTime();
    const end = start + 7200000;
    const status: MatchStatus = now >= end ? "completed" : now >= start ? "live" : "upcoming";
    return {
      id,
      tournament: t,
      home,
      away,
      hf,
      af,
      date,
      time,
      stage,
      status,
      hs: status === "completed" ? Math.floor(Math.random() * 5) : undefined,
      as: status === "completed" ? Math.floor(Math.random() * 5) : undefined,
    };
  };
  return [
    mk("f1", "f1-bhr", "Verstappen", "Norris", "🇳🇱", "🇬🇧", day(-12), "15:00", "Bahrain GP"),
    mk("f1", "f1-sau", "Leclerc", "Hamilton", "🇲🇨", "🇬🇧", day(-8), "17:00", "Saudi GP"),
    mk("f1", "f1-aus", "Piastri", "Sainz", "🇦🇺", "🇪🇸", day(-3), "06:00", "Australian GP"),
    mk("f1", "f1-jpn", "Tsunoda", "Perez", "🇯🇵", "🇲🇽", day(2), "07:00", "Japanese GP"),
    mk("f1", "f1-chi", "Zhou", "Bottas", "🇨🇳", "🇫🇮", day(5), "08:00", "Chinese GP"),
    mk("f1", "f1-mia", "Norris", "Verstappen", "🇬🇧", "🇳🇱", day(10), "21:00", "Miami GP"),
    mk("f1", "f1-mon", "Leclerc", "Sainz", "🇲🇨", "🇪🇸", day(15), "14:00", "Monaco GP"),
    mk("cricket", "cr-1", "India", "Australia", "🇮🇳", "🇦🇺", day(-10), "09:00", "ODI 1st Match"),
    mk("cricket", "cr-2", "England", "Pakistan", "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "🇵🇰", day(-6), "10:30", "T20 2nd"),
    mk("cricket", "cr-3", "India", "England", "🇮🇳", "🏴󠁧󠁢󠁥󠁮󠁧󠁿", day(-1), "09:00", "Champions Trophy SF"),
    mk("cricket", "cr-4", "Australia", "South Africa", "🇦🇺", "🇿🇦", day(3), "10:00", "Test Day 1"),
    mk("cricket", "cr-5", "West Indies", "New Zealand", "🇼🇸", "🇳🇿", day(7), "14:00", "T20 Final"),
    mk("ucl", "ucl-1", "Real Madrid", "Man City", "🇪🇸", "🏴󠁧󠁢󠁥󠁮󠁧󠁿", day(-7), "20:00", "QF 1st Leg"),
    mk("ucl", "ucl-2", "Bayern", "PSG", "🇩🇪", "🇫🇷", day(-5), "20:00", "QF 1st Leg"),
    mk("ucl", "ucl-3", "Arsenal", "Barcelona", "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "🇪🇸", day(-2), "20:00", "QF 2nd Leg"),
    mk("ucl", "ucl-sf", "TBD", "TBD", "🏆", "🏆", day(8), "20:00", "SF 1st Leg"),
    mk("ucl", "ucl-fin", "TBD", "TBD", "🏆", "🏆", day(25), "20:00", "FINAL"),
    mk("ufc", "ufc-1", "Pereira", "Ankalaev", "🇧🇷", "🇷🇺", day(-4), "03:00", "UFC 320"),
    mk("ufc", "ufc-2", "Makhachev", "Tsarukyan", "🇷🇺", "🇦🇲", day(1), "03:00", "UFC 321"),
    mk("ufc", "ufc-3", "Topuria", "Volkanovski", "🇪🇸", "🇦🇺", day(7), "03:00", "UFC 322"),
    mk("nba", "nba-g1", "Celtics", "Lakers", "☘️", "⭐", day(-6), "20:30", "Finals G1"),
    mk("nba", "nba-g2", "Celtics", "Lakers", "☘️", "⭐", day(-3), "20:30", "Finals G2"),
    mk("nba", "nba-g3", "Lakers", "Celtics", "⭐", "☘️", day(1), "20:30", "Finals G3"),
    mk("nba", "nba-g4", "Lakers", "Celtics", "⭐", "☘️", day(5), "20:30", "Finals G4"),
    mk("nfl", "nfl-1", "Chiefs", "Packers", "🇺🇸", "🇺🇸", day(-5), "20:00", "Preseason"),
    mk("nfl", "nfl-2", "49ers", "Cowboys", "🇺🇸", "🇺🇸", day(-1), "21:00", "Preseason"),
    mk("nfl", "nfl-3", "Eagles", "Ravens", "🇺🇸", "🇺🇸", day(3), "20:00", "Preseason Wk2"),
  ];
}

function countdown(target: Date): string {
  const d = target.getTime() - Date.now();
  if (d <= 0) return "NOW";
  const days = Math.floor(d / 864e5);
  const hrs = Math.floor((d % 864e5) / 36e5);
  const mins = Math.floor((d % 36e5) / 6e4);
  if (days > 0) return days + "d " + hrs + "h";
  if (hrs > 0) return hrs + "h " + mins + "m";
  return mins + "m";
}

const SPORT_KW = [
  "fifa",
  "world cup",
  "football",
  "soccer",
  "espn",
  "sky",
  "bein",
  "sports",
  "tennis",
  "nba",
  "nfl",
  "ufc",
  "boxing",
  "f1",
  "formula",
  "cricket",
  "premier",
  "la liga",
  "serie a",
  "bundesliga",
  "champions",
  "olympics",
  "racing",
  "golf",
  "nhl",
  "rugby",
  "hockey",
  "motogp",
  "superbowl",
  "wwe",
  "afl",
  "ncaa",
  "mlb",
  "nba tv",
  "motorsport",
  "cycling",
  "darts",
  "snooker",
  "volleyball",
  "handball",
  "baseball",
];

function isSports(ch: IptvChannel): boolean {
  const t = (ch.name + " " + (ch.group || "")).toLowerCase();
  return SPORT_KW.some((k) => t.includes(k));
}

/* ── Component ── */
function SportsDesk() {
  const [channels, setChannels] = useState<IptvChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selChannel, setSelChannel] = useState<IptvChannel | null>(null);
  const [selStream, setSelStream] = useState<Stream | null>(null);
  const [search, setSearch] = useState("");
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(true);
  const [fs, setFs] = useState(false);
  const [tab, setTab] = useState("f1");
  const [showSchedule, setShowSchedule] = useState(true);
  const [showIptv, setShowIptv] = useState(true);
  const [tick, setTick] = useState(Date.now());
  const ref = useRef<HTMLDivElement>(null);
  const [pitStreams, setPitStreams] = useState<
    {
      category: string;
      title: string;
      uri: string;
      thumbnail: string;
      embedUrl: string;
      startTime: number;
      endTime: number;
    }[]
  >([]);
  const [pitLoading, setPitLoading] = useState(true);
  const [selPitStream, setSelPitStream] = useState<string | null>(null);

  useEffect(() => {
    const t = setInterval(() => setTick(Date.now()), 10000);
    return () => clearInterval(t);
  }, []);
  const matches = useMemo(buildMatches, [tick]);
  const liveAll = matches.filter((m) => m.status === "live");
  const tabMatches = matches.filter((m) => m.tournament === tab);
  const upcoming = tabMatches.filter((m) => m.status === "upcoming").slice(0, 6);
  const results = tabMatches.filter((m) => m.status === "completed").slice(0, 3);
  const today = matches.filter(
    (m) => m.date === new Date().toISOString().split("T")[0] || m.status === "live",
  );

  useEffect(() => {
    let off = false;
    setLoading(true);
    loadCategoryChannels("sports")
      .then((list) => {
        if (off) return;
        setChannels(list.filter(isSports).slice(0, 60));
        setLoading(false);
      })
      .catch((e) => {
        if (off) return;
        setError(String(e?.message || "network error"));
        setLoading(false);
      });
    return () => {
      off = true;
    };
  }, []);

  // Fetch live streams from PitSport API
  useEffect(() => {
    fetch("https://api.pitsport.live/v1/streams")
      .then((r) => r.json())
      .then((data: any) => {
        if (!data?.categories) return;
        const live: typeof pitStreams = [];
        for (const cat of data.categories) {
          for (const s of cat.streams || []) {
            live.push({
              category: cat.category,
              title: s.title,
              uri: s.uri,
              thumbnail: s.thumbnail || cat.thumbnail || "",
              embedUrl: "https://pitsport.xyz" + s.uri,
              startTime: s.timestamp || 0,
              endTime: s.endtime || 0,
            });
          }
        }
        setPitStreams(live);
        setPitLoading(false);
      })
      .catch(() => setPitLoading(false));
  }, []);

  const play = useCallback((s: Stream) => {
    setSelStream(s);
    setSelChannel(null);
    setPlaying(true);
  }, []);
  const playCh = useCallback((c: IptvChannel) => {
    setSelChannel(c);
    setSelStream(null);
    setPlaying(true);
  }, []);
  const skip = useCallback(() => {
    if (selChannel) {
      const f = search
        ? channels.filter((c) =>
            (c.name + " " + (c.group || "")).toLowerCase().includes(search.toLowerCase()),
          )
        : channels;
      const i = f.findIndex((c) => c.id === selChannel.id);
      if (i >= 0 && i < f.length - 1) playCh(f[i + 1]);
      else if (f.length) playCh(f[0]);
    }
  }, [selChannel, channels, search, playCh]);
  const toggleFs = useCallback(() => {
    if (!ref.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
      setFs(false);
    } else {
      ref.current.requestFullscreen();
      setFs(true);
    }
  }, []);

  const src = selStream?.url || selChannel?.url;
  const title = selStream?.name || selChannel?.name || "";
  const tag = selStream?.tagline || selChannel?.group || "";
  const filtered = search
    ? channels.filter((c) =>
        (c.name + " " + (c.group || "")).toLowerCase().includes(search.toLowerCase()),
      )
    : channels;
  const activeTab = TOURNAMENTS.find((t) => t.id === tab);

  const matchCard = (m: Match, highlight = false) => {
    const d = new Date(m.date + "T" + m.time + ":00Z");
    const isLive = m.status === "live";
    return (
      <div
        key={m.id}
        className={cn(
          "flex items-center gap-3 rounded-xl border p-3 transition-all",
          isLive
            ? "border-red-500/30 bg-red-500/5"
            : highlight
              ? "border-amber-500/30 bg-amber-500/5"
              : "border-border/40 bg-background/40",
        )}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-lg">{m.hf}</span>
            <span className="text-xs font-semibold truncate">{m.home}</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-lg">{m.af}</span>
            <span className="text-xs font-semibold truncate">{m.away}</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          {isLive ? (
            <span className="font-mono-tv text-sm font-black text-red-400 animate-pulse">
              {m.hs ?? "-"}:{m.as ?? "-"} ●
            </span>
          ) : m.status === "completed" ? (
            <span className="font-mono-tv text-sm font-bold text-foreground">
              {m.hs}:{m.as}
            </span>
          ) : (
            <>
              <div
                className={cn(
                  "font-mono-tv text-xs font-bold",
                  d.getTime() - Date.now() < 864e5 ? "text-amber-400" : "text-muted-foreground",
                )}
              >
                <Clock className="h-3 w-3 inline mr-1" />
                {countdown(d)}
              </div>
              <div className="text-[9px] text-muted-foreground mt-0.5">
                {d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {m.time}
              </div>
            </>
          )}
          <div className="text-[8px] text-muted-foreground/60 uppercase tracking-wider mt-0.5">
            {m.stage}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="font-mono-tv text-[10px] uppercase tracking-widest hidden sm:inline">
                TV Desk
              </span>
            </Link>
            <div className="h-4 w-px bg-border/60" />
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" />
              <span className="font-mono-tv text-sm font-bold tracking-wider">SPORTS DESK</span>
            </div>
            {liveAll.length > 0 && (
              <span className="rounded-full bg-red-500/20 px-2 py-0.5 font-mono-tv text-[9px] font-bold text-red-400 animate-pulse">
                {liveAll.length} LIVE
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative hidden sm:block">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search sports..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-48 rounded-lg border border-border/60 bg-background/60 pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-background/60 px-3 py-1.5 text-[10px] font-mono-tv uppercase tracking-wider text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all"
            >
              <Tv className="h-3 w-3" /> TV
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* Live banner */}
        {liveAll.length > 0 && (
          <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <span className="font-mono-tv text-xs font-bold uppercase tracking-wider text-red-400">
                LIVE NOW
              </span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {liveAll.map((m) => matchCard(m))}
            </div>
          </div>
        )}

        {/* Tournament tabs */}
        <div className="mb-6 overflow-x-auto scrollbar-none">
          <div className="flex gap-1.5 min-w-max pb-1">
            {TOURNAMENTS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-mono-tv font-bold uppercase tracking-wider transition-all",
                  tab === t.id
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "bg-white/5 text-muted-foreground border border-white/10 hover:bg-white/10",
                )}
                style={
                  tab === t.id
                    ? { borderColor: `var(--neon-${t.accent})`, color: `var(--neon-${t.accent})` }
                    : {}
                }
              >
                {t.emoji} {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Free streams */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-mono-tv text-xs font-bold uppercase tracking-[0.2em]">
              FREE STREAMS
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {STREAMS.map((s) => (
              <button
                key={s.id}
                onClick={() => play(s)}
                className={cn(
                  "relative overflow-hidden rounded-xl border p-3 text-left transition-all",
                  selStream?.id === s.id
                    ? "border-primary/60 bg-primary/10"
                    : "border-border/50 bg-background/40 hover:border-primary/30 hover:bg-primary/5",
                )}
              >
                <div className="text-lg mb-1">{s.emoji}</div>
                <div className="font-mono-tv text-[10px] font-bold uppercase tracking-wider truncate">
                  {s.name}
                </div>
                <div className="mt-1 text-[9px] text-muted-foreground truncate">{s.tagline}</div>
                {selStream?.id === s.id && playing && (
                  <div className="absolute top-2 right-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* PitSport Live Motorsport */}
        {pitStreams.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm">🏎️</span>
              <h2 className="font-mono-tv text-xs font-bold uppercase tracking-[0.2em]">
                LIVE FROM PITSPORT
              </h2>
              <span className="rounded-full bg-red-500/20 px-2 py-0.5 font-mono-tv text-[9px] text-red-400 font-bold animate-pulse">
                ● LIVE
              </span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {pitStreams.map((ps, i) => {
                const isLive = ps.endTime > 0 && Date.now() / 1000 < ps.endTime;
                return (
                  <div
                    key={i}
                    className={cn(
                      "rounded-xl border p-3 transition-all cursor-pointer",
                      selPitStream === ps.uri
                        ? "border-primary/60 bg-primary/10"
                        : isLive
                          ? "border-red-500/30 bg-red-500/5 hover:border-red-500/50"
                          : "border-border/40 bg-background/40 hover:border-primary/30",
                    )}
                    onClick={() => setSelPitStream(selPitStream === ps.uri ? null : ps.uri)}
                  >
                    {ps.thumbnail && (
                      <img
                        src={ps.thumbnail}
                        alt=""
                        className="w-full h-28 object-cover rounded-lg mb-2"
                        loading="lazy"
                      />
                    )}
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <div className="text-[9px] font-mono-tv text-muted-foreground uppercase tracking-wider">
                          {ps.category}
                        </div>
                        <div className="text-xs font-bold truncate">{ps.title}</div>
                      </div>
                      {isLive && (
                        <span className="text-[9px] font-mono-tv text-red-400 font-bold shrink-0">
                          ● LIVE
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Player */}
        {/* Player */}
        <div className="mb-8">
          <div
            ref={ref as any}
            className={cn(
              "relative overflow-hidden rounded-2xl border border-border/60 bg-black",
              fs ? "fixed inset-0 z-50 rounded-none" : "aspect-video max-h-[60vh]",
            )}
          >
            {selPitStream ? (
              <iframe
                src={"https://pitsport.xyz" + selPitStream}
                className="absolute inset-0 h-full w-full border-0"
                allowFullScreen
                allow="autoplay; fullscreen"
              />
            ) : src ? (
              <HlsPlayer
                src={src}
                muted={!playing || muted}
                onReady={() => setPlaying(true)}
                onError={() => setPlaying(false)}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <div className="text-6xl">{activeTab?.emoji || "⚽"}</div>
                <div className="font-mono-tv text-sm text-white/60">Select a stream to watch</div>
                {liveAll.length > 0 && (
                  <p className="text-xs text-red-400/80 animate-pulse">
                    🔴 {liveAll.length} live match{liveAll.length > 1 ? "es" : ""}
                  </p>
                )}
              </div>
            )}
          </div>
          {(src || selPitStream) && (
            <div className="mt-2 flex items-center justify-between px-1">
              <div>
                <div className="font-mono-tv text-xs font-bold">
                  {selPitStream
                    ? pitStreams.find((p) => p.uri === selPitStream)?.title || "PitSport Stream"
                    : title}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {selPitStream
                    ? pitStreams.find((p) => p.uri === selPitStream)?.category || "Motorsport"
                    : tag}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setMuted((m) => !m)}
                  className="rounded-lg bg-white/10 p-1.5 text-white hover:bg-white/20 min-h-[32px] min-w-[32px] flex items-center justify-center"
                >
                  {muted ? "🔇" : "🔊"}
                </button>
                <button
                  onClick={() => setPlaying((p) => !p)}
                  className="rounded-lg bg-white/10 p-1.5 text-white hover:bg-white/20 min-h-[32px] min-w-[32px] flex items-center justify-center"
                >
                  {playing ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                </button>
                <button
                  onClick={skip}
                  className="rounded-lg bg-white/10 p-1.5 text-white hover:bg-white/20 min-h-[32px] min-w-[32px] flex items-center justify-center"
                >
                  <SkipForward className="h-3 w-3" />
                </button>
                <button
                  onClick={toggleFs}
                  className="rounded-lg bg-white/10 p-1.5 text-white hover:bg-white/20 min-h-[32px] min-w-[32px] flex items-center justify-center"
                >
                  {fs ? <Minimize className="h-3 w-3" /> : <Maximize className="h-3 w-3" />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Today's games */}
        {today.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-mono-tv text-xs font-bold uppercase tracking-[0.2em]">
                TODAY'S GAMES
              </h2>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {today.map((m) => matchCard(m, true))}
            </div>
          </div>
        )}

        {/* Schedule */}
        <div className="mb-8">
          <button
            onClick={() => setShowSchedule(!showSchedule)}
            className="flex items-center justify-between w-full mb-4"
          >
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-mono-tv text-xs font-bold uppercase tracking-[0.2em]">
                {activeTab?.label.toUpperCase()} SCHEDULE
              </h2>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] text-muted-foreground">
                {tabMatches.length} matches
              </span>
            </div>
            {showSchedule ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>
          {showSchedule && (
            <div className="space-y-4">
              {upcoming.length > 0 && (
                <>
                  <h3 className="font-mono-tv text-[10px] uppercase tracking-widest text-muted-foreground">
                    UPCOMING
                  </h3>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {upcoming.map((m) => matchCard(m))}
                  </div>
                </>
              )}
              {results.length > 0 && (
                <>
                  <h3 className="font-mono-tv text-[10px] uppercase tracking-widest text-muted-foreground">
                    RECENT
                  </h3>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {results.map((m) => matchCard(m))}
                  </div>
                </>
              )}
              {upcoming.length === 0 && results.length === 0 && (
                <div className="text-center py-6 text-xs text-muted-foreground/60">
                  No scheduled matches
                </div>
              )}
            </div>
          )}
        </div>

        {/* IPTV */}
        <div className="mb-8">
          <button
            onClick={() => setShowIptv(!showIptv)}
            className="flex items-center justify-between w-full mb-4"
          >
            <div className="flex items-center gap-2">
              <Globe2 className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-mono-tv text-xs font-bold uppercase tracking-[0.2em]">
                IPTV SPORTS
              </h2>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] text-muted-foreground">
                {filtered.length} ch
              </span>
            </div>
            {showIptv ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>
          {showIptv &&
            (loading ? (
              <div className="flex items-center justify-center gap-2 py-12">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground">Loading...</span>
              </div>
            ) : error ? (
              <div className="rounded-xl border p-4 text-xs text-amber-500">
                <AlertTriangle className="h-4 w-4 inline mr-2" />
                {error}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground">
                No channels found
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {filtered.map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => playCh(ch)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border p-3 text-left transition-all",
                      selChannel?.id === ch.id
                        ? "border-primary/60 bg-primary/10"
                        : "border-border/40 bg-background/40 hover:border-primary/30",
                    )}
                  >
                    {ch.logo ? (
                      <img
                        src={ch.logo}
                        alt=""
                        className="h-8 w-8 rounded-md object-contain bg-white/10"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Tv className="h-4 w-4" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-[11px] font-bold uppercase tracking-wider">
                        {ch.name}
                      </div>
                      <div className="truncate text-[9px] text-muted-foreground">
                        {ch.group || "Sports"}
                      </div>
                    </div>
                    {selChannel?.id === ch.id && playing && (
                      <span className="h-2 w-2 rounded-full bg-primary animate-pulse shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            ))}
        </div>

        {/* YouTube sports */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-mono-tv text-xs font-bold uppercase tracking-[0.2em]">
              YOUTUBE SPORTS
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
            {[
              { id: "fifa-wc", e: "🏆", n: "FIFA WC" },
              { id: "f1-live", e: "🏎️", n: "FORMULA 1" },
              { id: "cricket", e: "🏏", n: "CRICKET" },
              { id: "ucl", e: "⚽", n: "UCL" },
              { id: "nba", e: "🏀", n: "NBA" },
              { id: "nfl", e: "🏈", n: "NFL" },
            ].map((c) => (
              <Link
                key={c.id}
                to="/channels/$slug"
                params={{ slug: c.id }}
                className="group rounded-xl border border-border/40 bg-background/40 p-3 transition-all hover:border-primary/30"
              >
                <div className="text-xl mb-1">{c.e}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider">{c.n}</div>
                <div className="mt-2 text-[8px] font-mono-tv text-primary/80 uppercase tracking-wider group-hover:text-primary">
                  ▶ Watch
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
