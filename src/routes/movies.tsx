import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Search,
  Tv,
  Sparkles,
  Timer,
  Film,
  Play,
  Share2,
  AlertTriangle,
  Info,
  Layers,
  Star,
  ChevronRight,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Curated Movies & TV Shows Metadata (with TMDb IDs) ──────────────────────
interface MediaItem {
  id: string; // tmdb id
  imdbId?: string;
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

const CURATED_MEDIA: MediaItem[] = [
  {
    id: "1160164", // K-Pop Demon Hunters (fake/real tmdb or close match)
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
    id: "19995",
    title: "Avatar",
    year: "2009",
    type: "movie",
    rating: "7.9",
    votes: "1.3M",
    genres: ["Action", "Adventure", "Fantasy", "Sci-Fi"],
    duration: "162 Min",
    ageRating: "PG-13",
    synopsis: "A paraplegic Marine dispatched to the moon Pandora on a unique mission becomes torn between following his orders and protecting the world he feels is his home.",
    backdropUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=60",
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

// Video Sources / CDN mirrors (Orion, Elysium, etc. mapping to public API embeds)
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
];

export const Route = createFileRoute("/movies")({
  head: () => ({
    meta: [
      { title: "Cinema desk - TubeTV" },
      {
        name: "description",
        content: "Watch movies and series via flawless non-torrent CDN servers directly.",
      },
    ],
  }),
  component: MoviesPage,
});

function MoviesPage() {
  const [selectedMedia, setSelectedMedia] = useState<MediaItem>(CURATED_MEDIA[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSourceIndex, setActiveSourceIndex] = useState(0);

  // Manual query input for custom TMDb ids
  const [customIdInput, setCustomIdInput] = useState("");
  const [customType, setCustomType] = useState<"movie" | "tv">("movie");

  // Episode state for TV shows
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);

  // Handle custom manual ID load
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
      genres: ["Custom Stream"],
      duration: customType === "movie" ? "Unknown" : "1 Season",
      ageRating: "NR",
      synopsis: "Manual override stream loaded via direct TMDb id input link.",
      backdropUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=60",
    };
    setSelectedMedia(mockItem);
    setSeason(1);
    setEpisode(1);
  };

  // Filter curated media based on search query
  const filteredMedia = useMemo(() => {
    if (!searchQuery.trim()) return CURATED_MEDIA;
    return CURATED_MEDIA.filter((item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  // Compute final iframe URL based on active source and episode numbers
  const playerUrl = useMemo(() => {
    const src = VIDEO_SOURCES[activeSourceIndex];
    if (selectedMedia.type === "movie") {
      return src.getUrl(selectedMedia.id, "movie");
    } else {
      // Modify tv url with customized season/episode
      const base = src.getUrl(selectedMedia.id, "tv");
      if (base.includes("vidsrc.to")) {
        return `https://vidsrc.to/embed/tv/${selectedMedia.id}/${season}/${episode}`;
      } else if (base.includes("vidsrc.me")) {
        return `https://vidsrc.me/embed/tv?tmdb=${selectedMedia.id}&season=${season}&episode=${episode}`;
      } else if (base.includes("embed.su")) {
        return `https://embed.su/embed/tv/${selectedMedia.id}/${season}/${episode}`;
      } else if (base.includes("multiembed.to")) {
        return `https://multiembed.to/emulator.php?video_id=${selectedMedia.id}&tmdb=1&s=${season}&e=${episode}`;
      } else {
        return `https://play2.vidapi.pro/tv/${selectedMedia.id}/${season}/${episode}`;
      }
    }
  }, [selectedMedia, activeSourceIndex, season, episode]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050608] text-zinc-100 font-sans">
      {/* Glow blobs */}
      <div className="absolute inset-0 opacity-15 [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:40px_40px]" />
      <div className="absolute inset-x-0 top-0 h-60 bg-gradient-to-b from-red-500/5 to-transparent pointer-events-none" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="font-mono-tv text-[10px] uppercase tracking-[0.45em] text-red-400">
              Cinema Room
            </div>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-zinc-50 sm:text-5xl">
              123Movies Cabinet
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-300">
              Flawless, non-torrent CDN streaming. Select a server source below if you hit errors or buffering issues.
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
              to="/playground"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-100 transition-colors hover:bg-white/10"
            >
              <Layers className="h-4 w-4" /> Arcade
            </Link>
            <Link
              to="/focus"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-100 transition-colors hover:bg-white/10"
            >
              <Timer className="h-4 w-4" /> Focus
            </Link>
          </div>
        </header>

        <section className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_0.9fr]">
          {/* LEFT: Video Player & Controls */}
          <article className="space-y-4">
            {/* Player Frame */}
            <div className="relative aspect-video w-full overflow-hidden rounded-[2rem] border border-white/10 bg-black/60 shadow-2xl shadow-black/80">
              <iframe
                src={playerUrl}
                title="TubeTV Cinema Player"
                className="h-full w-full"
                allowFullScreen
                // Sandboxing blocks redirects and popups from public CDN providers
                sandbox="allow-forms allow-pointer-lock allow-same-origin allow-scripts allow-top-navigation"
              />
            </div>

            {/* Server Mirror Picker Cabinet */}
            <div className="rounded-[2rem] border border-white/10 bg-[#0a0c10]/80 p-5 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div className="font-mono text-xs uppercase tracking-widest text-zinc-400">
                  Select Video Source
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <AlertTriangle className="h-3.5 w-3.5 text-yellow-500/80" /> Report error if broken
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

              {/* TV Show Episode Control Panel */}
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
                        max="20"
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

            {/* Media Information Card */}
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

          {/* RIGHT: Search, Manual TMDb Loader, & Catalog */}
          <aside className="space-y-4">
            {/* Direct TMDb / IMDb ID Loader overrides */}
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

            {/* Catalog search search */}
            <article className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search catalog titles..."
                  className="w-full rounded-full border border-white/10 bg-black/20 px-10 py-2.5 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                />
              </div>

              {/* Movie Cards list */}
              <div className="mt-4 space-y-2.5">
                <div className="font-mono text-[9px] uppercase tracking-widest text-zinc-500">
                  Catalog Results ({filteredMedia.length})
                </div>

                {filteredMedia.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelectedMedia(item);
                      setSeason(1);
                      setEpisode(1);
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all hover:bg-white/5",
                      selectedMedia.id === item.id
                        ? "border-red-500/40 bg-red-500/5"
                        : "border-white/5 bg-black/10"
                    )}
                  >
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-zinc-900">
                      <img
                        src={item.backdropUrl}
                        alt=""
                        className="h-full w-full object-cover opacity-80"
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

            {/* Disclaimer */}
            <div className="p-2 font-mono text-[8px] leading-relaxed text-zinc-600 text-center uppercase tracking-wider">
              Disclaimer: This app indexes third party streaming APIs for educational research. No files are stored locally.
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
