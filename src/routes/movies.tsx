import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import {
  Search,
  Tv,
  Sparkles,
  Timer,
  Film,
  Play,
  Star,
  Layers,
  AlertTriangle,
  Loader2,
  Globe2,
  Radio as RadioIcon,
  Github,
  Compass,
  Gamepad2,
  Newspaper,
  BookOpen,
  Map,
  Music2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── TMDb Genre Map ───────────────────────────────────────────────────────────
function getGenreName(id: number): string {
  const genres: Record<number, string> = {
    28: "Action",
    12: "Adventure",
    16: "Animation",
    35: "Comedy",
    80: "Crime",
    99: "Documentary",
    18: "Drama",
    10751: "Family",
    14: "Fantasy",
    36: "History",
    27: "Horror",
    10402: "Music",
    9648: "Mystery",
    10749: "Romance",
    878: "Sci-Fi",
    10770: "TV Movie",
    53: "Thriller",
    10752: "War",
    37: "Western",
    10759: "Action & Adventure",
    10762: "Kids",
    10763: "News",
    10764: "Reality",
    10765: "Sci-Fi & Fantasy",
    10766: "Soap",
    10767: "Talk",
    10768: "War & Politics",
  };
  return genres[id] || "Genre";
}

// ─── Media Item Interface ─────────────────────────────────────────────────────
interface MediaItem {
  id: string; // tmdb id
  title: string;
  year: string;
  type: "movie" | "tv";
  rating: string;
  votes: string;
  genres: string[];
  duration: string;
  ageRating: string;
  synopsis: string;
  backdropUrl: string;
}

// Curated list for fallback/trending links
const TRENDING_MEDIA: MediaItem[] = [
  {
    id: "1160164",
    title: "KPop Demon Hunters",
    year: "2025",
    type: "movie",
    rating: "7.5",
    votes: "3,911",
    genres: ["Action", "Animation", "Comedy", "Fantasy", "Music"],
    duration: "96 Min",
    ageRating: "PG",
    synopsis: "When K-pop superstars Rumi, Mira, and Zoey aren't selling out stadiums, they're using their secret powers to protect their fans from supernatural threats.",
    backdropUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=60",
  },
  {
    id: "27205",
    title: "Inception",
    year: "2010",
    type: "movie",
    rating: "8.8",
    votes: "2.4M",
    genres: ["Action", "Sci-Fi", "Adventure"],
    duration: "148 Min",
    ageRating: "PG-13",
    synopsis: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
    backdropUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=60",
  },
  {
    id: "693134",
    title: "Dune: Part Two",
    year: "2024",
    type: "movie",
    rating: "8.6",
    votes: "420K",
    genres: ["Action", "Adventure", "Sci-Fi"],
    duration: "166 Min",
    ageRating: "PG-13",
    synopsis: "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.",
    backdropUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=60",
  },
  {
    id: "496243",
    title: "Parasite",
    year: "2019",
    type: "movie",
    rating: "8.5",
    votes: "930K",
    genres: ["Drama", "Thriller", "Comedy"],
    duration: "132 Min",
    ageRating: "R",
    synopsis: "Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.",
    backdropUrl: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=60",
  },
  {
    id: "1396",
    title: "Breaking Bad",
    year: "2008",
    type: "tv",
    rating: "9.5",
    votes: "2.1M",
    genres: ["Crime", "Drama", "Thriller"],
    duration: "5 Seasons",
    ageRating: "TV-MA",
    synopsis: "A chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine with a former student in order to secure his family's future.",
    backdropUrl: "https://images.unsplash.com/photo-1535016120720-40c646be5580?w=800&auto=format&fit=crop&q=60",
  },
  {
    id: "70523",
    title: "Dark",
    year: "2017",
    type: "tv",
    rating: "8.7",
    votes: "430K",
    genres: ["Sci-Fi", "Mystery", "Drama"],
    duration: "3 Seasons",
    ageRating: "TV-MA",
    synopsis: "A family saga with a supernatural twist, set in a German town where the disappearance of two young children exposes the relationships among four families.",
    backdropUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=60",
  },
];

// Video Sources list
interface VideoSource {
  name: string;
  getUrl: (id: string, type: "movie" | "tv", season?: number, episode?: number) => string;
}

const VIDEO_SOURCES: VideoSource[] = [
  {
    name: "Orion",
    getUrl: (id, type) =>
      type === "movie"
        ? `https://vidsrc.to/embed/movie/${id}`
        : `https://vidsrc.to/embed/tv/${id}/1/1`,
  },
  {
    name: "Elysium",
    getUrl: (id, type) =>
      type === "movie"
        ? `https://vidsrc.me/embed/movie?tmdb=${id}`
        : `https://vidsrc.me/embed/tv?tmdb=${id}&season=1&episode=1`,
  },
  {
    name: "Vega",
    getUrl: (id, type) =>
      type === "movie"
        ? `https://embed.su/embed/movie/${id}`
        : `https://embed.su/embed/tv/${id}/1/1`,
  },
  {
    name: "Sirius",
    getUrl: (id, type) =>
      type === "movie"
        ? `https://multiembed.to/emulator.php?video_id=${id}&tmdb=1`
        : `https://multiembed.to/emulator.php?video_id=${id}&tmdb=1&s=1&e=1`,
  },
  {
    name: "Capella",
    getUrl: (id, type) =>
      type === "movie"
        ? `https://play2.vidapi.pro/movie/${id}`
        : `https://play2.vidapi.pro/tv/${id}/1/1`,
  },
  {
    name: "Nova",
    getUrl: (id, type) =>
      type === "movie"
        ? `https://2embed.cc/embed/${id}`
        : `https://2embed.cc/embedtv/${id}&s=1&e=1`,
  },
  {
    name: "Lyra",
    getUrl: (id, type) =>
      type === "movie"
        ? `https://vidsrc.cc/v2/embed/movie/${id}`
        : `https://vidsrc.cc/v2/embed/tv/${id}/1/1`,
  },
];

export const Route = createFileRoute("/movies")({
  head: () => ({
    meta: [
      { title: "Cinema desk - TubeTV" },
      {
        name: "description",
        content: "Search and stream movies and series on-demand via flawless non-torrent servers.",
      },
    ],
  }),
  component: MoviesPage,
});

function MoviesPage() {
  const navigate = useNavigate();
  const [selectedMedia, setSelectedMedia] = useState<MediaItem>(TRENDING_MEDIA[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [activeSourceIndex, setActiveSourceIndex] = useState(0);

  const [activeViewers, setActiveViewers] = useState(48);
  const [totalViewers, setTotalViewers] = useState(14832);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTotal = localStorage.getItem("tubetv:total-viewers");
      let base = savedTotal ? parseInt(savedTotal, 10) : 14832;
      setTotalViewers(base);
    }
    const interval = setInterval(() => {
      setActiveViewers((prev) => {
        const diff = Math.floor(Math.random() * 5) - 2;
        return Math.max(38, Math.min(68, prev + diff));
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Manual ID query overrides
  const [customIdInput, setCustomIdInput] = useState("");
  const [customType, setCustomType] = useState<"movie" | "tv">("movie");

  // Season / Episode states for TV shows
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);

  // Trigger TMDb API search globally on search query input changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);

    const delayDebounce = setTimeout(() => {
      // Fetching via a stable public API key
      const url = `https://api.themoviedb.org/3/search/multi?api_key=15d1a227521ab6b773a7d5907d9b5741&query=${encodeURIComponent(searchQuery)}`;
      fetch(url)
        .then((res) => res.json())
        .then((data) => {
          if (data.results) {
            const formatted: MediaItem[] = data.results
              .filter((item: any) => item.media_type === "movie" || item.media_type === "tv")
              .map((item: any) => ({
                id: String(item.id),
                title: item.title || item.name || "Untitled",
                year: (item.release_date || item.first_air_date || "2026").slice(0, 4),
                type: item.media_type === "tv" ? "tv" : "movie",
                rating: item.vote_average ? String(item.vote_average.toFixed(1)) : "N/A",
                votes: item.vote_count ? String(item.vote_count) : "0",
                genres: item.genre_ids ? item.genre_ids.map((gid: number) => getGenreName(gid)) : ["Stream"],
                duration: item.media_type === "tv" ? "TV Series" : "Movie",
                ageRating: item.adult ? "R" : "PG-13",
                synopsis: item.overview || "No overview description available.",
                backdropUrl: item.backdrop_path
                  ? `https://image.tmdb.org/t/p/w500${item.backdrop_path}`
                  : "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=60",
              }));
            setSearchResults(formatted);
          }
        })
        .catch((err) => {
          console.error("TMDb fetch failed: ", err);
        })
        .finally(() => {
          setSearchLoading(false);
        });
    }, 450);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Handle manual ID loading overrides
  const handleLoadCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customIdInput.trim()) return;

    const mockItem: MediaItem = {
      id: customIdInput.trim(),
      title: `Custom ${customType === "movie" ? "Movie" : "TV Show"} #${customIdInput}`,
      year: "2026",
      type: customType,
      rating: "N/A",
      votes: "0",
      genres: ["Direct Link Override"],
      duration: customType === "movie" ? "Unknown" : "1 Season",
      ageRating: "NR",
      synopsis: "Manual override stream loaded via direct TMDb id input link.",
      backdropUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=60",
    };
    setSelectedMedia(mockItem);
    setSeason(1);
    setEpisode(1);
  };

  // Compute player Url
  const playerUrl = useMemo(() => {
    const src = VIDEO_SOURCES[activeSourceIndex];
    if (selectedMedia.type === "movie") {
      return src.getUrl(selectedMedia.id, "movie");
    } else {
      const base = src.getUrl(selectedMedia.id, "tv");
      if (base.includes("vidsrc.to")) {
        return `https://vidsrc.to/embed/tv/${selectedMedia.id}/${season}/${episode}`;
      } else if (base.includes("vidsrc.me")) {
        return `https://vidsrc.me/embed/tv?tmdb=${selectedMedia.id}&season=${season}&episode=${episode}`;
      } else if (base.includes("embed.su")) {
        return `https://embed.su/embed/tv/${selectedMedia.id}/${season}/${episode}`;
      } else if (base.includes("multiembed.to")) {
        return `https://multiembed.to/emulator.php?video_id=${selectedMedia.id}&tmdb=1&s=${season}&e=${episode}`;
      } else if (base.includes("2embed.cc")) {
        return `https://2embed.cc/embedtv/${selectedMedia.id}&s=${season}&e=${episode}`;
      } else if (base.includes("vidsrc.cc")) {
        return `https://vidsrc.cc/v2/embed/tv/${selectedMedia.id}/${season}/${episode}`;
      } else {
        return `https://play2.vidapi.pro/tv/${selectedMedia.id}/${season}/${episode}`;
      }
    }
  }, [selectedMedia, activeSourceIndex, season, episode]);

  return (
    <div className="flex min-h-screen flex-col bg-[#050608] text-foreground font-sans selection:bg-primary/20">
      {/* Top Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/60 bg-[#080a0e]/95 px-4 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[linear-gradient(135deg,rgba(79,174,123,0.2),rgba(226,174,74,0.15))] border border-primary/20">
            <Film className="h-4 w-4 text-[oklch(0.74_0.18_335)] animate-pulse" />
          </div>
          <div>
            <span className="font-mono-tv text-sm font-bold uppercase tracking-widest text-white">TubeTV</span>
            <p className="hidden font-mono-tv text-[10px] uppercase tracking-[0.22em] text-muted-foreground sm:block">
              cinema cabinet
            </p>
          </div>
        </div>
        
        <div className="font-mono-tv text-xs text-muted-foreground uppercase tracking-widest">
          CINEMA ROOM
        </div>
      </header>

      {/* Main layout container */}
      <section className="relative flex flex-1 flex-col lg:flex-row min-h-0">
        {/* Left Sidebar */}
        <aside className="hidden w-64 shrink-0 border-r border-border/60 bg-[linear-gradient(180deg,rgba(8,10,14,0.98),rgba(5,6,9,0.99))] lg:flex lg:flex-col">
          {/* Header: Sources label */}
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-2.5">
            <span className="font-mono-tv text-[10px] uppercase tracking-widest text-muted-foreground">Sources</span>
          </div>

          {/* Mode switchers with per-mode neon accents */}
          <div className="border-b border-border/60 py-1.5">
            <button
              onClick={() => navigate({ to: "/" })}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-all duration-200 text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
            >
              <Tv className="h-4 w-4 shrink-0" />
              <span className="flex-1">
                <span className="block text-[11px] font-semibold uppercase tracking-wider">Live TV</span>
                <span className="block text-[10px] opacity-70">YouTube & IPTV</span>
              </span>
            </button>
            <button
              onClick={() => navigate({ to: "/", search: { mode: "radio" } } as any)}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-all duration-200 text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
            >
              <RadioIcon className="h-4 w-4 shrink-0" />
              <span className="flex-1">
                <span className="block text-[11px] font-semibold uppercase tracking-wider">Radio World</span>
                <span className="block text-[10px] opacity-70">Worldwide stations</span>
              </span>
            </button>
            <button
              style={{ boxShadow: "inset 3px 0 0 oklch(0.74 0.18 335)" }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-all duration-200 bg-[oklch(0.74_0.18_335_/_0.1)] text-[oklch(0.74_0.18_335)]"
            >
              <Film className="h-4 w-4 shrink-0 text-[oklch(0.74_0.18_335)] animate-pulse" />
              <span className="flex-1">
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-[oklch(0.74_0.18_335)]" style={{ textShadow: "0 0 6px oklch(0.74 0.18 335 / 0.4)" }}>Movies & Series</span>
                <span className="block text-[10px] opacity-70">On-Demand Stream</span>
              </span>
              <span className="h-1.5 w-1.5 shrink-0 animate-pulse-dot rounded-full bg-[oklch(0.74_0.18_335)]" />
            </button>
          </div>

          {/* Sidebar bottom: quick nav & stats (inside scroll area) */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-2 grid grid-cols-4 gap-1 mt-4 bg-black/10 border-t border-border/40">
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

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto min-h-0 bg-[#050608] text-zinc-100 relative">
          <div className="absolute inset-0 opacity-10 [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:40px_40px] pointer-events-none" />
          
          <div className="relative w-full px-4 py-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col min-h-full">
            <header className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <div className="font-mono-tv text-[10px] uppercase tracking-[0.45em] text-red-400">
                  Cinema Room
                </div>
                <h1 className="mt-2 text-4xl font-black tracking-tight text-zinc-50 sm:text-5xl">
                  123Movies Cabinet
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-300">
                  On-demand, non-torrent CDN streaming. Search for absolutely any movie or series and select a mirror server below to play.
                </p>
              </div>
            </header>

        <section className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_0.9fr]">
          {/* LEFT: Video player & details */}
          <article className="space-y-4">
            <div className="relative aspect-video w-full overflow-hidden rounded-[2rem] border border-white/10 bg-black/60 shadow-2xl shadow-black/80">
              <iframe
                src={playerUrl}
                title="TubeTV Cinema Player"
                className="h-full w-full"
                allowFullScreen
                sandbox="allow-forms allow-pointer-lock allow-same-origin allow-scripts allow-top-navigation"
              />
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-[#0a0c10]/80 p-5 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div className="font-mono text-xs uppercase tracking-widest text-zinc-400">
                  Select Video Source
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <AlertTriangle className="h-3.5 w-3.5 text-yellow-500/80" /> Report error if buffering
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {VIDEO_SOURCES.map((src, idx) => (
                  <button
                    key={src.name}
                    onClick={() => setActiveSourceIndex(idx)}
                    className={cn(
                      "rounded-xl border px-4 py-2 font-mono text-xs font-semibold tracking-wider transition-all",
                      activeSourceIndex === idx
                        ? "border-red-500/50 bg-red-500/15 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                        : "border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    {src.name}
                  </button>
                ))}
              </div>

              {selectedMedia.type === "tv" && (
                <div className="mt-5 border-t border-white/5 pt-4">
                  <div className="font-mono text-xs uppercase tracking-widest text-zinc-400 mb-2">
                    Episode Panel
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-400">Season:</span>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={season}
                        onChange={(e) => setSeason(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-16 rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-center font-mono text-xs text-white"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-400">Episode:</span>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={episode}
                        onChange={(e) => setEpisode(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-16 rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-center font-mono text-xs text-white"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 backdrop-blur-md">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-black tracking-tight text-white">
                    {selectedMedia.title}
                  </h2>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-zinc-400">
                    <span className="rounded bg-white/10 px-1.5 py-0.5 text-white">
                      {selectedMedia.year}
                    </span>
                    <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-red-400 uppercase">
                      {selectedMedia.type}
                    </span>
                    <span className="rounded border border-white/10 px-1.5 py-0.5">
                      {selectedMedia.duration}
                    </span>
                    <span className="rounded border border-white/10 px-1.5 py-0.5">
                      {selectedMedia.ageRating}
                    </span>
                    <div className="flex items-center gap-1 text-yellow-400 ml-2">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      <span>{selectedMedia.rating}</span>
                      <span className="text-zinc-500">({selectedMedia.votes})</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {selectedMedia.genres.map((g) => (
                  <span
                    key={g}
                    className="rounded-full border border-white/5 bg-white/5 px-3 py-1 text-xs text-zinc-300"
                  >
                    {g}
                  </span>
                ))}
              </div>

              <p className="mt-4 text-sm leading-relaxed text-zinc-300">
                {selectedMedia.synopsis}
              </p>
            </div>
          </article>

          {/* RIGHT: Search input & movie list */}
          <aside className="space-y-4">
            <article className="rounded-[2rem] border border-red-500/20 bg-red-950/10 p-5">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-red-400">
                <Layers className="h-3.5 w-3.5" /> Direct ID Override
              </div>
              <form onSubmit={handleLoadCustom} className="mt-3 space-y-2">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCustomType("movie")}
                    className={cn(
                      "flex-1 rounded-lg py-1.5 text-xs font-semibold uppercase tracking-wider transition-all",
                      customType === "movie" ? "bg-red-500 text-zinc-950" : "bg-white/5 text-zinc-400"
                    )}
                  >
                    Movie
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomType("tv")}
                    className={cn(
                      "flex-1 rounded-lg py-1.5 text-xs font-semibold uppercase tracking-wider transition-all",
                      customType === "tv" ? "bg-red-500 text-zinc-950" : "bg-white/5 text-zinc-400"
                    )}
                  >
                    TV
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    value={customIdInput}
                    onChange={(e) => setCustomIdInput(e.target.value)}
                    placeholder="Enter TMDb ID (e.g. 27205)"
                    className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-red-500/50"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-red-500 hover:bg-red-400 text-zinc-950 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all"
                  >
                    Load
                  </button>
                </div>
              </form>
            </article>

            <article className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search 1,000,000+ titles..."
                  className="w-full rounded-full border border-white/10 bg-black/20 px-10 py-2.5 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                />
              </div>

              {/* Show list loader */}
              {searchLoading && (
                <div className="mt-6 flex items-center justify-center gap-2 text-zinc-400 font-mono text-xs">
                  <Loader2 className="h-4 w-4 animate-spin text-red-400" />
                  Searching TMDb Database...
                </div>
              )}

              <div className="mt-4 space-y-2.5">
                <div className="font-mono text-[9px] uppercase tracking-widest text-zinc-500">
                  {searchQuery.trim() ? `Search Results (${searchResults.length})` : "Trending Movies & TV"}
                </div>

                {/* Grid list mapping */}
                {(searchQuery.trim() ? searchResults : TRENDING_MEDIA).map((item) => (
                  <button
                    key={item.id + item.type}
                    onClick={() => {
                      setSelectedMedia(item);
                      setSeason(1);
                      setEpisode(1);
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all hover:bg-white/5",
                      selectedMedia.id === item.id && selectedMedia.type === item.type
                        ? "border-red-500/40 bg-red-500/5"
                        : "border-white/5 bg-black/10"
                    )}
                  >
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-zinc-900">
                      <img
                        src={item.backdropUrl}
                        alt=""
                        className="h-full w-full object-cover opacity-80"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=200&auto=format&fit=crop&q=60";
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/35">
                        <Play className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <div className="truncate text-sm font-bold text-zinc-100">
                          {item.title}
                        </div>
                        <span className="shrink-0 rounded bg-white/10 px-1 py-0.5 text-[8px] font-bold text-zinc-400 uppercase">
                          {item.type}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 font-mono text-[9px] text-zinc-400">
                        <span>{item.year}</span>
                        <span>·</span>
                        <span>{item.duration}</span>
                        <span>·</span>
                        <span className="flex items-center gap-0.5 text-yellow-500/80">
                          ★ {item.rating}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </article>

            <div className="p-2 font-mono text-[8px] leading-relaxed text-zinc-600 text-center uppercase tracking-wider">
              Disclaimer: This app indexes third party streaming APIs for educational research. No files are stored locally.
            </div>
          </aside>
            </section>
          </div>
        </div>
      </section>
    </div>
  );
}
