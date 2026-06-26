import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { loadCategoryChannels, type IptvChannel } from "@/lib/iptv";
import { HlsPlayer } from "@/components/tv/HlsPlayer";
import { Link } from "@tanstack/react-router";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/sports")({
  head: () => ({
    meta: [
      { title: "TubeTV - Sports Desk" },
      {
        name: "description",
        content:
          "Live sports streams: FIFA World Cup, Formula 1, Champions League, Cricket, and more. Free HLS streams via iptv-org.",
      },
      { property: "og:title", content: "TubeTV - Sports Desk" },
      {
        property: "og:description",
        content: "Live FIFA World Cup, F1, Champions League, Cricket streams — free and embeddable.",
      },
    ],
  }),
  component: SportsDesk,
});

// Featured sports streams with known-working HLS URLs
const FEATURED_STREAMS: {
  id: string;
  name: string;
  tagline: string;
  emoji: string;
  color: string;
  url: string;
}[] = [
  {
    id: "fifa-plus-en",
    name: "FIFA+ LIVE",
    tagline: "World Cup 2026 — official FIFA stream",
    emoji: "🏆",
    color: "var(--neon-green)",
    url: "https://d2w9q46ikgrcwx.cloudfront.net/v1/master/3722c60a815c199d9c0ef36c5b73da68a62b09d1/cc-of5cbk3sav3w5/v1/sysdata_s_p_a_fifa_7/samsungheadend_us/latest/main/hls/playlist.m3u8",
  },
  {
    id: "fifa-plus-es",
    name: "FIFA+ ESPAÑOL",
    tagline: "Copa Mundial en español",
    emoji: "🌎",
    color: "var(--neon-amber)",
    url: "https://d2w9q46ikgrcwx.cloudfront.net/v1/master/3722c60a815c199d9c0ef36c5b73da68a62b09d1/cc-of5cbk3sav3w5/v1/sysdata_s_p_a_fifa_7/samsungheadend_es/latest/main/hls/playlist.m3u8",
  },
  {
    id: "fifa-plus-fr",
    name: "FIFA+ FRANÇAIS",
    tagline: "Coupe du Monde en français",
    emoji: "🇫🇷",
    color: "var(--neon-cyan)",
    url: "https://d2w9q46ikgrcwx.cloudfront.net/v1/master/3722c60a815c199d9c0ef36c5b73da68a62b09d1/cc-of5cbk3sav3w5/v1/sysdata_s_p_a_fifa_7/samsungheadend_fr/latest/main/hls/playlist.m3u8",
  },
  {
    id: "fifa-plus-de",
    name: "FIFA+ DEUTSCH",
    tagline: "Fußball auf Deutsch",
    emoji: "🇩🇪",
    color: "var(--neon-purple)",
    url: "https://d2w9q46ikgrcwx.cloudfront.net/v1/master/3722c60a815c199d9c0ef36c5b73da68a62b09d1/cc-of5cbk3sav3w5/v1/sysdata_s_p_a_fifa_7/samsungheadend_de/latest/main/hls/playlist.m3u8",
  },
  {
    id: "fifa-plus-pt",
    name: "FIFA+ PORTUGUÊS",
    tagline: "Copa do Mundo em português",
    emoji: "🇧🇷",
    color: "var(--neon-green)",
    url: "https://d2w9q46ikgrcwx.cloudfront.net/v1/master/3722c60a815c199d9c0ef36c5b73da68a62b09d1/cc-of5cbk3sav3w5/v1/sysdata_s_p_a_fifa_7/samsungheadend_pt/latest/main/hls/playlist.m3u8",
  },
  {
    id: "fifa-plus-it",
    name: "FIFA+ ITALIANO",
    tagline: "Coppa del Mondo in italiano",
    emoji: "🇮🇹",
    color: "var(--neon-amber)",
    url: "https://d2w9q46ikgrcwx.cloudfront.net/v1/master/3722c60a815c199d9c0ef36c5b73da68a62b09d1/cc-of5cbk3sav3w5/v1/sysdata_s_p_a_fifa_7/samsungheadend_it/latest/main/hls/playlist.m3u8",
  },
  {
    id: "bein-xtra",
    name: "beIN SPORTS XTRA",
    tagline: "premium sports, free stream",
    emoji: "⚽",
    color: "var(--neon-pink)",
    url: "https://bein-xtra-bein.amagi.tv/playlist.m3u8",
  },
  {
    id: "espn-ocho",
    name: "ESPN8 THE OCHO",
    tagline: "if it's almost a real sport, we've got it",
    emoji: " ESPN",
    color: "var(--neon-cyan)",
    url: "https://d3b6q2ou5kp8ke.cloudfront.net/ESPNTheOcho.m3u8",
  },
];

const SPORTS_KEYWORDS = [
  "fifa", "world cup", "football", "soccer", "espn", "sky", "bein",
  "sports", "tennis", "nba", "nfl", "ufc", "boxing", "f1", "formula",
  "cricket", "premier", "la liga", "serie a", "bundesliga", "champions",
  "olympics", "racing", "golf", "nhl", "rugby", "hockey",
];

function matchesSportsFilter(ch: IptvChannel): boolean {
  const text = `${ch.name} ${ch.group || ""}`.toLowerCase();
  return SPORTS_KEYWORDS.some((kw) => text.includes(kw));
}

function SportsDesk() {
  const [channels, setChannels] = useState<IptvChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<IptvChannel | null>(null);
  const [selectedFeatured, setSelectedFeatured] = useState<typeof FEATURED_STREAMS[0] | null>(null);
  const [search, setSearch] = useState("");
  const [muted, setMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useState<HTMLDivElement>(null)[0];

  // Load iptv-org sports category
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    loadCategoryChannels("sports")
      .then((list) => {
        if (cancelled) return;
        // Filter to known sports channels
        const sportsChannels = list.filter(matchesSportsFilter);
        setChannels(sportsChannels.slice(0, 50)); // limit to top 50
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        // Non-fatal — we still have featured streams
        setError(`Could not load iptv-org sports list: ${err?.message || "network error"}`);
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  const playFeatured = useCallback((stream: typeof FEATURED_STREAMS[0]) => {
    setSelectedFeatured(stream);
    setSelectedChannel(null);
    setIsPlaying(true);
  }, []);

  const playIptv = useCallback((ch: IptvChannel) => {
    setSelectedChannel(ch);
    setSelectedFeatured(null);
    setIsPlaying(true);
  }, []);

  const togglePlayPause = useCallback(() => {
    setIsPlaying((p) => !p);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
      setIsFullscreen(false);
    } else {
      containerRef.requestFullscreen();
      setIsFullscreen(true);
    }
  }, [containerRef]);

  const skipNext = useCallback(() => {
    if (selectedFeatured) {
      const idx = FEATURED_STREAMS.findIndex((s) => s.id === selectedFeatured.id);
      const next = FEATURED_STREAMS[(idx + 1) % FEATURED_STREAMS.length];
      playFeatured(next);
    } else if (selectedChannel) {
      const filteredList = search
        ? channels.filter((ch) =>
            `${ch.name} ${ch.group || ""}`.toLowerCase().includes(search.toLowerCase())
          )
        : channels;
      const idx = filteredList.findIndex((ch) => ch.id === selectedChannel.id);
      if (idx >= 0 && idx < filteredList.length - 1) {
        playIptv(filteredList[idx + 1]);
      } else if (filteredList.length > 0) {
        playIptv(filteredList[0]);
      }
    }
  }, [selectedFeatured, selectedChannel, channels, search, playFeatured, playIptv]);

  const currentStreamUrl = selectedFeatured?.url || selectedChannel?.url;
  const currentTitle = selectedFeatured?.name || selectedChannel?.name || "";
  const currentTagline = selectedFeatured?.tagline || selectedChannel?.group || "";

  const filteredChannels = search
    ? channels.filter((ch) =>
        `${ch.name} ${ch.group || ""}`.toLowerCase().includes(search.toLowerCase())
      )
    : channels;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="h-4 w-4" />
              <span className="font-mono-tv text-[10px] uppercase tracking-widest hidden sm:inline">TV Desk</span>
            </Link>
            <div className="h-4 w-px bg-border/60" />
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" />
              <span className="font-mono-tv text-sm font-bold tracking-wider">SPORTS DESK</span>
            </div>
            <span className="rounded-full bg-primary/20 px-2 py-0.5 font-mono-tv text-[9px] font-bold text-primary uppercase tracking-wider">
              LIVE
            </span>
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
              <Tv className="h-3 w-3" /> All Channels
            </Link>
            <Link
              to="/radio/$country"
              params={{ country: "us" }}
              className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-background/60 px-3 py-1.5 text-[10px] font-mono-tv uppercase tracking-wider text-muted-foreground hover:bg-accent/10 hover:text-accent transition-all"
            >
              <Radio className="h-3 w-3" /> Radio
            </Link>
          </div>
        </div>
        {/* Mobile search */}
        <div className="px-4 pb-3 sm:hidden">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search sports..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-border/60 bg-background/60 pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* Featured: FIFA+ LIVE streams */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="h-4 w-4 text-primary" />
            <h2 className="font-mono-tv text-xs font-bold uppercase tracking-[0.2em] text-foreground">
              FIFA WORLD CUP 2026
            </h2>
            <span className="rounded-full bg-red-500/20 px-2 py-0.5 font-mono-tv text-[8px] font-bold text-red-400 uppercase tracking-wider animate-pulse">
              ● LIVE
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
            {FEATURED_STREAMS.map((stream) => (
              <button
                key={stream.id}
                onClick={() => playFeatured(stream)}
                className={cn(
                  "group relative overflow-hidden rounded-xl border p-3 text-left transition-all",
                  selectedFeatured?.id === stream.id
                    ? "border-primary/60 bg-primary/10 shadow-[0_0_16px_rgba(79,174,123,0.15)]"
                    : "border-border/50 bg-background/40 hover:border-primary/30 hover:bg-primary/5"
                )}
              >
                <div className="text-lg mb-1">{stream.emoji}</div>
                <div className="font-mono-tv text-[10px] font-bold uppercase tracking-wider text-foreground truncate">
                  {stream.name}
                </div>
                <div className="mt-1 text-[9px] text-muted-foreground truncate">
                  {stream.tagline}
                </div>
                {selectedFeatured?.id === stream.id && isPlaying && (
                  <div className="absolute top-2 right-2 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Player area */}
        <div className="mb-8">
          <div
            ref={containerRef}
            className={cn(
              "relative overflow-hidden rounded-2xl border border-border/60 bg-black",
              isFullscreen ? "fixed inset-0 z-50 rounded-none" : "aspect-video max-h-[60vh]"
            )}
          >
            {currentStreamUrl ? (
              <>
                <HlsPlayer
                  src={currentStreamUrl}
                  muted={!isPlaying ? true : muted}
                  onReady={() => setIsPlaying(true)}
                  onError={() => {
                    // Silently handle stream errors — show fallback
                    setIsPlaying(false);
                  }}
                />
                {/* Overlay controls */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-mono-tv text-xs font-bold text-white">
                        {currentTitle}
                      </div>
                      <div className="text-[10px] text-white/60">{currentTagline}</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setMuted((m) => !m)}
                        className="rounded-lg bg-white/10 px-2.5 py-1.5 text-[10px] font-mono-tv text-white hover:bg-white/20 transition-colors"
                        title={muted ? "Unmute" : "Mute"}
                      >
                        {muted ? "🔇" : "🔊"}
                      </button>
                      <button
                        onClick={togglePlayPause}
                        className="rounded-lg bg-white/10 px-2.5 py-1.5 text-[10px] font-mono-tv text-white hover:bg-white/20 transition-colors"
                      >
                        {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                      </button>
                      <button
                        onClick={skipNext}
                        className="rounded-lg bg-white/10 px-2.5 py-1.5 text-[10px] font-mono-tv text-white hover:bg-white/20 transition-colors"
                        title="Next stream"
                      >
                        <SkipForward className="h-3 w-3" />
                      </button>
                      <button
                        onClick={toggleFullscreen}
                        className="rounded-lg bg-white/10 px-2.5 py-1.5 text-[10px] font-mono-tv text-white hover:bg-white/20 transition-colors"
                      >
                        {isFullscreen ? <Minimize className="h-3 w-3" /> : <Maximize className="h-3 w-3" />}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <div className="text-6xl">⚽</div>
                <div className="font-mono-tv text-sm text-white/60">
                  Select a stream above to watch live
                </div>
                <div className="text-[10px] text-white/40">
                  FIFA+ streams are free and official — no account needed
                </div>
              </div>
            )}
          </div>
        </div>

        {/* IPTV Sports channels */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Globe2 className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-mono-tv text-xs font-bold uppercase tracking-[0.2em] text-foreground">
                IPTV SPORTS CHANNELS
              </h2>
              <span className="rounded-full bg-white/10 px-2 py-0.5 font-mono-tv text-[9px] text-muted-foreground">
                {filteredChannels.length} channels
              </span>
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-border/50 bg-background/40 py-12">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="font-mono-tv text-xs text-muted-foreground">Loading sports streams...</span>
            </div>
          )}

          {error && !loading && (
            <div className="rounded-xl border border-border/50 bg-background/40 p-4">
              <div className="flex items-center gap-2 text-amber-500 mb-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-mono-tv text-xs font-bold">Stream list unavailable</span>
              </div>
              <p className="text-xs text-muted-foreground">{error}</p>
              <p className="mt-2 text-[10px] text-muted-foreground/60">
                The FIFA+ featured streams above are still working — try those!
              </p>
            </div>
          )}

          {!loading && !error && filteredChannels.length === 0 && (
            <div className="rounded-xl border border-border/50 bg-background/40 py-8 text-center">
              <p className="text-sm text-muted-foreground">No sports channels found</p>
              <p className="mt-1 text-xs text-muted-foreground/60">Try a different search term</p>
            </div>
          )}

          {!loading && filteredChannels.length > 0 && (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {filteredChannels.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => playIptv(ch)}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl border p-3 text-left transition-all",
                    selectedChannel?.id === ch.id
                      ? "border-primary/60 bg-primary/10 shadow-[0_0_12px_rgba(79,174,123,0.12)]"
                      : "border-border/40 bg-background/40 hover:border-primary/30 hover:bg-primary/5"
                  )}
                >
                  {ch.logo ? (
                    <img
                      src={ch.logo}
                      alt={ch.name}
                      className="h-8 w-8 rounded-md object-contain bg-white/10"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Tv className="h-4 w-4" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-mono-tv text-[11px] font-bold uppercase tracking-wider text-foreground">
                      {ch.name}
                    </div>
                    <div className="truncate text-[9px] text-muted-foreground">
                      {ch.group || "Sports"}
                    </div>
                  </div>
                  {selectedChannel?.id === ch.id && isPlaying && (
                    <span className="h-2 w-2 rounded-full bg-primary animate-pulse shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* YouTube Sports Channels */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-mono-tv text-xs font-bold uppercase tracking-[0.2em] text-foreground">
              YOUTUBE SPORTS CHANNELS
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { id: "fifa-wc", name: "FIFA WORLD CUP", emoji: "🏆", tagline: "official highlights & classic WC moments" },
              { id: "f1-live", name: "FORMULA 1", emoji: "🏎️", tagline: "races, highlights & onboard battles" },
              { id: "cricket", name: "CRICKET ZONE", emoji: "🏏", tagline: "world cup highlights & classic innings" },
              { id: "ucl", name: "CHAMPIONS LEAGUE", emoji: "⚽", tagline: "UEFA classic matches & goals" },
            ].map((ch) => (
              <Link
                key={ch.id}
                to={`/channels/${ch.id}`}
                className="group overflow-hidden rounded-xl border border-border/40 bg-background/40 p-4 transition-all hover:border-primary/30 hover:bg-primary/5"
              >
                <div className="text-2xl mb-2">{ch.emoji}</div>
                <div className="font-mono-tv text-[11px] font-bold uppercase tracking-wider text-foreground">
                  {ch.name}
                </div>
                <div className="mt-1 text-[9px] text-muted-foreground">
                  {ch.tagline}
                </div>
                <div className="mt-2 text-[9px] font-mono-tv text-primary/80 uppercase tracking-wider group-hover:text-primary transition-colors">
                  ▶ Watch Now
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
