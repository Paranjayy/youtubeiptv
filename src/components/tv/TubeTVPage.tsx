import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CHANNELS, getChannelBySlug, getChannelPath, shuffle, type Channel, CATEGORIES, normalizeChannelSlug } from "@/lib/channels";
import { TRENDING_MEDIA, VIDEO_SOURCES, type MediaItem, getGenreName } from "@/lib/movies";
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
  Star,
  Play,
  AlertTriangle,
  Loader2,
  PanelLeft,
} from "lucide-react";

type TubeTVPageProps = {
  initialChannelSlug?: string | null;
  initialMode?: "yt" | "iptv" | "radio" | "movies";
  initialIptvCountry?: string | null;
  initialIptvItemSlug?: string | null;
  initialRadioCountry?: string | null;
  initialRadioItemSlug?: string | null;
  initialMovieId?: string | null;
  initialMovieType?: "movie" | "tv" | null;
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
  initialMovieId,
  initialMovieType,
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
  const [mode, setMode] = useState<"yt" | "iptv" | "radio" | "movies">(initialMode ?? "yt");
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

  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const val = localStorage.getItem("tubetv:sidebar-open");
      return val !== "false";
    }
    return true;
  });

  // Real connection-based (active tab) count
  const [activeTabsCount, setActiveTabsCount] = useState(1);
  const [activeViewers, setActiveViewers] = useState(48);
  const [totalViewers, setTotalViewers] = useState(14832);

  // Movies & Series mode state
  const [tmdbKey, setTmdbKey] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("tubetv:tmdb-key") || "";
    }
    return "";
  });
  const [selectedMedia, setSelectedMedia] = useState<MediaItem>(() => {
    if (initialMovieId && initialMovieType) {
      const matched = TRENDING_MEDIA.find(
        (m) => m.id === initialMovieId && m.type === initialMovieType
      );
      if (matched) return matched;
      return {
        id: initialMovieId,
        title: initialMovieType === "tv" ? "TV Series Stream" : "Movie Stream",
        year: "2026",
        type: initialMovieType,
        rating: "N/A",
        votes: "0",
        genres: ["Live"],
        duration: initialMovieType === "tv" ? "TV Series" : "Movie",
        ageRating: "PG-13",
        synopsis: "Dynamic override stream loaded from URL.",
        backdropUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80",
        posterUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=60",
      };
    }
    return TRENDING_MEDIA[0];
  });
  const [movieSearchQuery, setMovieSearchQuery] = useState("");
  const [movieSearchResults, setMovieSearchResults] = useState<MediaItem[]>([]);
  const [movieSearchLoading, setMovieSearchLoading] = useState(false);
  const [movieActiveSourceIndex, setMovieActiveSourceIndex] = useState(0);
  const [movieImdbId, setMovieImdbId] = useState<string | null>(null);

  const [movieCast, setMovieCast] = useState<{ name: string; character: string; profileUrl: string | null }[]>([]);
  const [movieTrailers, setMovieTrailers] = useState<{ name: string; key: string }[]>([]);
  const [movieRecommendations, setMovieRecommendations] = useState<MediaItem[]>([]);
  const [movieActiveTrailerKey, setMovieActiveTrailerKey] = useState<string | null>(null);
  const [movieShowDownloadPanel, setMovieShowDownloadPanel] = useState(false);
  const [movieDownloadProgress, setMovieDownloadProgress] = useState<Record<string, number>>({});
  const [movieDownloadActive, setMovieDownloadActive] = useState<string | null>(null);
  const [movieExtraDetails, setMovieExtraDetails] = useState<{
    director: string;
    runtime: string;
    language: string;
    releaseDate: string;
    budget: string;
    revenue: string;
  }>({
    director: "N/A",
    runtime: "N/A",
    language: "EN",
    releaseDate: "N/A",
    budget: "N/A",
    revenue: "N/A",
  });

  const [movieSeason, setMovieSeason] = useState(1);
  const [movieEpisode, setMovieEpisode] = useState(1);
  const [movieCustomIdInput, setMovieCustomIdInput] = useState("");
  const [movieCustomType, setMovieCustomType] = useState<"movie" | "tv">("movie");
  const [movieTotalSeasons, setMovieTotalSeasons] = useState(1);
  const [movieEpisodesCount, setMovieEpisodesCount] = useState(10);
  const [movieSeasonsList, setMovieSeasonsList] = useState<{ seasonNumber: number; episodeCount: number }[]>([]);

  // Collapsible categories in sidebar
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [youtubeListCollapsed, setYoutubeListCollapsed] = useState(false);
  const [iptvListCollapsed, setIptvListCollapsed] = useState(false);
  const [radioListCollapsed, setRadioListCollapsed] = useState(false);

  // Load and increment total views from CounterAPI for real unique count
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    fetch("https://api.counterapi.dev/v1/tubetv/visits/up")
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.value === "number") {
          setTotalViewers(data.value);
          // Calculate realistic active users relative to total unique visits
          const activeBase = Math.max(12, Math.floor(Math.sqrt(data.value) * 0.6) + Math.floor(Math.random() * 5));
          setActiveViewers(activeBase);
        }
      })
      .catch((err) => {
        console.error("CounterAPI error: ", err);
      });
  }, []);

  // Real-time active tab tracker & heartbeat system
  useEffect(() => {
    if (typeof window === "undefined") return;
    const tabId = Math.random().toString(36).substring(2);
    
    const updateHeartbeat = () => {
      try {
        const now = Date.now();
        const tabs = JSON.parse(localStorage.getItem("tubetv:active-tabs") || "{}");
        
        // Register current tab heartbeat
        tabs[tabId] = now;
        
        // Evict tabs older than 8 seconds
        const cleanTabs: Record<string, number> = {};
        let count = 0;
        for (const [id, stamp] of Object.entries(tabs)) {
          if (now - (stamp as number) < 8000) {
            cleanTabs[id] = stamp as number;
            count++;
          }
        }
        
        localStorage.setItem("tubetv:active-tabs", JSON.stringify(cleanTabs));
        setActiveTabsCount(Math.max(1, count));
      } catch (e) {
        console.error(e);
      }
    };

    updateHeartbeat();
    const interval = setInterval(updateHeartbeat, 3000);

    const handleUnload = () => {
      try {
        const tabs = JSON.parse(localStorage.getItem("tubetv:active-tabs") || "{}");
        delete tabs[tabId];
        localStorage.setItem("tubetv:active-tabs", JSON.stringify(tabs));
      } catch {}
    };

    window.addEventListener("beforeunload", handleUnload);
    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, []);

  // Synchronize route search parameters on selected media changes
  useEffect(() => {
    if (mode === "movies" && selectedMedia?.id) {
      void navigate({
        to: "/movies",
        search: {
          id: selectedMedia.id,
          type: selectedMedia.type,
        },
        replace: true,
      });
    }
  }, [selectedMedia, mode, navigate]);

  // Fetch TMDb details when selected media changes in movies mode
  useEffect(() => {
    if (mode !== "movies" || !selectedMedia.id) return;
    setMovieImdbId(null);
    setMovieCast([]);
    setMovieTrailers([]);
    setMovieRecommendations([]);
    setMovieExtraDetails({
      director: "N/A",
      runtime: "N/A",
      language: "EN",
      releaseDate: "N/A",
      budget: "N/A",
      revenue: "N/A",
    });

    const isTv = selectedMedia.type === "tv";
    setMovieTotalSeasons(1);
    setMovieEpisodesCount(10);
    setMovieSeasonsList([]);
    
    if (tmdbKey.trim()) {
      const url = isTv
        ? `https://api.themoviedb.org/3/tv/${selectedMedia.id}?api_key=${tmdbKey.trim()}&append_to_response=credits,videos,external_ids,recommendations`
        : `https://api.themoviedb.org/3/movie/${selectedMedia.id}?api_key=${tmdbKey.trim()}&append_to_response=credits,videos,recommendations`;

      fetch(url)
        .then((res) => {
          if (!res.ok) throw new Error("TMDB Key invalid or network issue");
          return res.json();
        })
        .then((data) => {
          if (isTv && data.external_ids?.imdb_id) {
            setMovieImdbId(data.external_ids.imdb_id);
          } else if (data.imdb_id) {
            setMovieImdbId(data.imdb_id);
          }

          if (isTv) {
            const totalSeasons = data.number_of_seasons || 1;
            setMovieTotalSeasons(totalSeasons);
            if (data.seasons && data.seasons.length > 0) {
              const list = data.seasons
                .filter((s: any) => s.season_number > 0) // exclude specials (season 0)
                .map((s: any) => ({
                  seasonNumber: s.season_number,
                  episodeCount: s.episode_count || 10,
                }));
              setMovieSeasonsList(list);
              setMovieEpisodesCount(list[0]?.episodeCount ?? 10);
            }
          }

          // Resolve core placeholders on dynamic route hydration
          setSelectedMedia((prev) => {
            if (
              prev.id === String(data.id) &&
              (prev.title === "TV Series Stream" ||
                prev.title === "Movie Stream" ||
                !prev.backdropUrl.includes("image.tmdb.org"))
            ) {
              return {
                ...prev,
                title: data.title || data.name || prev.title,
                year: (data.release_date || data.first_air_date || "").slice(0, 4) || prev.year,
                rating: data.vote_average ? String(data.vote_average.toFixed(1)) : prev.rating,
                votes: data.vote_count ? String(data.vote_count) : prev.votes,
                genres: data.genres ? data.genres.map((g: any) => g.name) : prev.genres,
                synopsis: data.overview || prev.synopsis,
                backdropUrl: data.backdrop_path
                  ? `https://image.tmdb.org/t/p/w1280${data.backdrop_path}`
                  : prev.backdropUrl,
                posterUrl: data.poster_path
                  ? `https://image.tmdb.org/t/p/w500${data.poster_path}`
                  : prev.posterUrl,
              };
            }
            return prev;
          });

          if (data.credits?.cast) {
            const castList = data.credits.cast.slice(0, 12).map((member: any) => ({
              name: member.name,
              character: member.character,
              profileUrl: member.profile_path
                ? `https://image.tmdb.org/t/p/w185${member.profile_path}`
                : null,
            }));
            setMovieCast(castList);
          }

          if (data.videos?.results) {
            const trailerList = data.videos.results
              .filter((video: any) => video.site === "YouTube" && (video.type === "Trailer" || video.type === "Teaser" || video.type === "Clip"))
              .map((video: any) => ({
                name: video.name,
                key: video.key,
              }));
            setMovieTrailers(trailerList);
          }

          let director = "N/A";
          if (isTv && data.created_by && data.created_by.length > 0) {
            director = data.created_by.map((c: any) => c.name).join(", ");
          } else if (data.credits?.crew) {
            const dirMember = data.credits.crew.find((c: any) => c.job === "Director");
            if (dirMember) director = dirMember.name;
          }

          const formatter = new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0,
          });

          setMovieExtraDetails({
            director,
            runtime: isTv
              ? `${data.episode_run_time?.[0] || 45}m`
              : data.runtime
              ? `${Math.floor(data.runtime / 60)}h ${data.runtime % 60}m`
              : "N/A",
            language: (data.original_language || "en").toUpperCase(),
            releaseDate: data.release_date || data.first_air_date || "N/A",
            budget: data.budget ? formatter.format(data.budget) : "N/A",
            revenue: data.revenue ? formatter.format(data.revenue) : "N/A",
          });

          if (data.recommendations?.results) {
            const recList = data.recommendations.results.slice(0, 10).map((item: any) => ({
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
              posterUrl: item.poster_path
                ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
                : "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=60",
            }));
            setMovieRecommendations(recList);
          }
        })
        .catch((err) => {
          console.error("Failed to fetch TMDb details, using fallback:", err);
          useLocalFallbackDetails();
        });
    } else {
      useLocalFallbackDetails();
    }

    function useLocalFallbackDetails() {
      const matched = TRENDING_MEDIA.find((m) => m.id === selectedMedia.id);
      if (matched) {
        setMovieExtraDetails({
          director: matched.director || "N/A",
          runtime: matched.duration,
          language: "EN",
          releaseDate: matched.year,
          budget: matched.budget || "N/A",
          revenue: matched.revenue || "N/A",
        });
        if (matched.cast) setMovieCast(matched.cast);
        if (matched.trailers) setMovieTrailers(matched.trailers);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMedia.id, selectedMedia.type, tmdbKey, mode]);

  // Trigger TMDb API search globally on search query input changes
  useEffect(() => {
    if (mode !== "movies" || !movieSearchQuery.trim()) {
      setMovieSearchResults([]);
      return;
    }
    
    if (!tmdbKey.trim()) {
      const filtered = TRENDING_MEDIA.filter((item) =>
        item.title.toLowerCase().includes(movieSearchQuery.toLowerCase())
      );
      setMovieSearchResults(filtered);
      return;
    }

    setMovieSearchLoading(true);

    const delayDebounce = setTimeout(() => {
      const url = `https://api.themoviedb.org/3/search/multi?api_key=${tmdbKey.trim()}&query=${encodeURIComponent(movieSearchQuery)}`;
      fetch(url)
        .then((res) => {
          if (!res.ok) throw new Error("Search failed");
          return res.json();
        })
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
                  ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}`
                  : "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80",
                posterUrl: item.poster_path
                  ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
                  : "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=60",
              }));
            setMovieSearchResults(formatted);
          }
        })
        .catch((err) => {
          console.error("TMDb search failed: ", err);
          toast.error("TMDb Search failed. Check your API key or network/ad-blocker connection.");
        })
        .finally(() => {
          setMovieSearchLoading(false);
        });
    }, 450);

    return () => clearTimeout(delayDebounce);
  }, [movieSearchQuery, tmdbKey, mode]);

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
    (nextMode: "yt" | "iptv" | "radio" | "movies") => {
      setMode(nextMode);
      if (nextMode === "movies") {
        void navigate({ to: "/movies", replace: true });
      } else {
        navigateToMode(nextMode);
      }
    },
    [navigateToMode, navigate],
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
      if (e.key === "Escape") {
        setGuideOpen(false);
        setHelpOpen(false);
        setJumpOpen(false);
        setFullWindow(false);
        return;
      }

      // Command+K / Ctrl+K Command Palette toggle
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setJumpOpen((o) => !o);
        return;
      }

      // Block all other shortcuts when typing in form controls (ESC already handled above)
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement || e.target instanceof HTMLTextAreaElement) return;

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
          <button
            onClick={() => {
              setSidebarOpen((prev) => {
                const next = !prev;
                localStorage.setItem("tubetv:sidebar-open", String(next));
                return next;
              });
            }}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground transition-all active:scale-95 z-20 cursor-pointer"
            title={sidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
          >
            <PanelLeft className="h-4 w-4" />
          </button>
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
        <aside className={cn(
          "w-64 shrink-0 border-r border-border/60 bg-[linear-gradient(180deg,rgba(8,10,14,0.98),rgba(5,6,9,0.99))] flex-col transition-all duration-300",
          sidebarOpen ? "hidden lg:flex" : "hidden"
        )}>
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
              onClick={() => handleModeChange("movies")}
              style={mode === "movies" ? { boxShadow: "inset 3px 0 0 oklch(0.74 0.18 335)" } : undefined}
              className={cn(
                "flex w-full items-center gap-3 border-t border-border/45 px-4 py-2.5 text-left transition-all duration-200",
                mode === "movies"
                  ? "bg-[oklch(0.74_0.18_335_/_0.1)] text-[oklch(0.74_0.18_335)]"
                  : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
              )}
            >
              <Film className="h-4 w-4 shrink-0 text-[oklch(0.74_0.18_335)]" />
              <span className="flex-1">
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-[oklch(0.74_0.18_335)]" style={{ textShadow: "0 0 6px oklch(0.74 0.18 335 / 0.4)" }}>Movies & Series</span>
                <span className="block text-[10px] opacity-70">On-Demand Stream</span>
              </span>
              {mode === "movies" && <span className="h-1.5 w-1.5 shrink-0 animate-pulse-dot rounded-full bg-[oklch(0.74_0.18_335)]" />}
            </button>
          </div>

          {/* YouTube channel list grouped by category */}
          <div className="flex-1 overflow-y-auto">
            <div 
              onClick={() => setYoutubeListCollapsed(!youtubeListCollapsed)} 
              className="flex items-center justify-between border-b border-border/60 px-4 py-2 bg-black/20 cursor-pointer text-muted-foreground hover:text-foreground select-none"
            >
              <span className="font-mono-tv text-[9px] uppercase tracking-widest">📺 YT Channels</span>
              {youtubeListCollapsed ? <ChevronDown className="-rotate-90 h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </div>

            {!youtubeListCollapsed && CATEGORIES.map((cat) => {
              const catChannels = CHANNELS.filter((ch) => ch.category === cat);
              const catColor = getCategoryColor(cat);
              const isCollapsed = collapsedCategories[cat];
              return (
                <div key={cat}>
                  {/* Category header chip */}
                  <div 
                    onClick={() => setCollapsedCategories(prev => ({ ...prev, [cat]: !prev[cat] }))}
                    className={cn("flex items-center gap-1.5 border-b border-t border-border/40 px-3 py-1.5 cursor-pointer hover:brightness-110 select-none", catColor.bg)}
                  >
                    <span className={cn("font-mono-tv text-[9px] font-bold uppercase tracking-widest", catColor.text)}>
                      {catColor.label}
                    </span>
                    <span className={cn("ml-auto font-mono-tv text-[9px] opacity-60 mr-2", catColor.text)}>{catChannels.length}</span>
                    {isCollapsed ? (
                      <ChevronDown className={cn("h-3 w-3 -rotate-90", catColor.text)} />
                    ) : (
                      <ChevronDown className={cn("h-3 w-3", catColor.text)} />
                    )}
                  </div>
                  {!isCollapsed && catChannels.map((ch) => {
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
                    TABS / ACTIVE
                  </span>
                  <span className="text-emerald-400 font-bold">{activeTabsCount} / {activeViewers}</span>
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
          {mode === "movies" ? (
            <div className="flex-1 overflow-y-auto min-h-0 bg-[#050608] text-zinc-100 relative scroll-smooth">
              {/* Background glows */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(153,51,204,0.08),transparent_50%)] pointer-events-none" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(239,68,68,0.05),transparent_60%)] pointer-events-none" />
              
              {/* Cinema Desk Sub-Header Navigation */}
              <div className="sticky top-0 z-30 bg-[#050608]/85 backdrop-blur-md border-b border-white/[0.04] px-4 py-3 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                      <Film className="h-5 w-5 text-red-500 animate-pulse" />
                      CINEMA<span className="text-red-500 font-extrabold font-mono">DESK</span>
                    </span>
                    <span className="text-xs text-zinc-500 border-l border-zinc-800 pl-3 hidden sm:inline">
                      Stream HD Movies & Series
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 w-full md:w-auto flex-1 md:flex-initial justify-end">
                    {/* Search Field */}
                    <div className="relative w-full md:w-80">
                      <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                      <input
                        value={movieSearchQuery}
                        onChange={(e) => setMovieSearchQuery(e.target.value)}
                        placeholder="Search title, cast, genre..."
                        className="w-full rounded-full border border-white/10 bg-zinc-950/60 pl-10 pr-4 py-2.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all"
                      />
                      {movieSearchQuery.trim() && (
                        <button
                          onClick={() => setMovieSearchQuery("")}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-xs font-mono"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative w-full px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col gap-8 min-h-full z-10">
                {/* TMDb Warning Banner if Key is Missing */}
                {!tmdbKey.trim() && (
                  <div className="rounded-[1.5rem] border border-yellow-500/20 bg-yellow-500/5 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🔑</span>
                      <div className="text-left">
                        <p className="text-xs font-bold text-yellow-500 uppercase tracking-wider">Bring Your Own API Key (TMDb)</p>
                        <p className="text-[11px] text-zinc-400">Offline Fallback Mode active. Enter your TMDb v3 API Key in the settings card at the bottom to search the entire online database.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* SEARCH RESULTS GRID VIEW */}
                {movieSearchQuery.trim() ? (
                  <section className="space-y-6 animate-fade-in min-h-[50vh]">
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <h2 className="text-lg font-bold text-white">
                        Search Results for <span className="text-red-500 italic">"{movieSearchQuery}"</span>
                      </h2>
                      <span className="text-xs text-zinc-500 font-mono">
                        {movieSearchResults.length} titles found
                      </span>
                    </div>

                    {movieSearchLoading ? (
                      <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-400">
                        <Loader2 className="h-8 w-8 animate-spin text-red-500" />
                        <span className="text-xs font-mono uppercase tracking-widest">Searching online databases...</span>
                      </div>
                    ) : movieSearchResults.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {movieSearchResults.map((item) => (
                          <button
                            key={item.id + item.type + "-grid-search"}
                            onClick={() => {
                              setSelectedMedia(item);
                              setMovieSeason(1);
                              setMovieEpisode(1);
                              setMovieSearchQuery("");
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            className="group flex flex-col rounded-2xl overflow-hidden border border-white/5 bg-zinc-950/40 text-left transition-all duration-300 hover:scale-105 hover:border-red-500/40 hover:bg-zinc-900/40 cursor-pointer shadow-lg"
                          >
                            <div className="aspect-[2/3] relative overflow-hidden bg-zinc-900">
                              <img
                                src={item.posterUrl || item.backdropUrl}
                                alt={item.title}
                                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=200&auto=format&fit=crop&q=60";
                                }}
                              />
                              <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded text-[9px] font-mono text-zinc-300 border border-white/5">
                                ★ {item.rating}
                              </div>
                              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">{item.duration}</span>
                              </div>
                            </div>
                            <div className="p-3.5">
                              <h3 className="text-xs font-bold text-zinc-100 line-clamp-1 group-hover:text-red-500 transition-colors">
                                {item.title}
                              </h3>
                              <div className="mt-1 flex items-center gap-1.5 font-mono text-[9px] text-zinc-500">
                                <span>{item.year}</span>
                                <span>·</span>
                                <span className="uppercase text-red-500 font-bold">{item.type}</span>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-20 text-zinc-500 border border-dashed border-white/5 rounded-3xl">
                        <span className="text-xl block mb-2">🔍</span>
                        <p className="text-xs font-mono uppercase tracking-widest text-zinc-400">No movies or series found</p>
                        <p className="text-[11px] text-zinc-600 mt-1">Try another keyword, or supply a TMDb key below for online lookup.</p>
                      </div>
                    )}
                  </section>
                ) : (
                  /* HOME GRID BROWSE VIEW */
                  <>
                    {/* Giant Hero Theater Spotlight Arena */}
                    <div className="grid gap-6 lg:grid-cols-[1.6fr_0.8fr] text-left">
                      {/* LEFT: Video Player and Mirror Selector */}
                      <div className="space-y-4">
                        <div className="relative aspect-video w-full overflow-hidden rounded-[2.5rem] border border-white/10 bg-zinc-950/60 shadow-2xl shadow-black/85 group">
                          {/* Ambient Glow behind player */}
                          <div 
                            className="absolute inset-0 z-0 bg-cover bg-center opacity-10 filter blur-3xl scale-110 pointer-events-none"
                            style={{ backgroundImage: `url(${selectedMedia.backdropUrl})` }}
                          />
                          <iframe
                            src={VIDEO_SOURCES[movieActiveSourceIndex].getUrl(selectedMedia.id, movieImdbId, selectedMedia.type, movieSeason, movieEpisode)}
                            title="Cinema HD Stream Player"
                            className="relative z-10 h-full w-full border-none"
                            allowFullScreen
                          />
                        </div>

                        {/* Mirror Selector & Panel */}
                        <div className="rounded-[2rem] border border-white/10 bg-zinc-950/40 p-5 backdrop-blur-md">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="font-mono text-xs uppercase tracking-widest text-zinc-300 font-bold flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
                              Select Video Mirror
                            </div>
                            <div className="flex items-center gap-2 text-xs text-zinc-500">
                              <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" /> Buffering? Try a different server.
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {VIDEO_SOURCES.map((src, idx) => (
                              <button
                                key={src.name}
                                onClick={() => setMovieActiveSourceIndex(idx)}
                                className={cn(
                                  "rounded-full border px-4 py-2 font-mono text-xs font-semibold tracking-wider transition-all duration-200 cursor-pointer",
                                  movieActiveSourceIndex === idx
                                    ? "border-red-500 bg-red-600/10 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                                    : "border-white/5 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
                                )}
                              >
                                {src.name}
                              </button>
                            ))}
                          </div>

                          {/* Visual Season & Episode Grid Selector */}
                          {selectedMedia.type === "tv" && (
                            <div className="mt-5 border-t border-white/5 pt-4">
                              <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
                                <span className="font-mono text-xs uppercase tracking-widest text-zinc-300 font-bold">
                                  Season {movieSeason} · Episode {movieEpisode}
                                </span>
                                <div className="flex items-center gap-1 bg-black/45 border border-white/5 rounded-full p-0.5 flex-wrap max-w-full overflow-x-auto">
                                  {/* Seasons Toggles - dynamic from TMDb */}
                                  {(movieSeasonsList.length > 0 ? movieSeasonsList : Array.from({ length: movieTotalSeasons }).map((_, i) => ({ seasonNumber: i + 1, episodeCount: movieEpisodesCount }))).map((season) => (
                                    <button
                                      key={"season-tab-" + season.seasonNumber}
                                      onClick={() => {
                                        setMovieSeason(season.seasonNumber);
                                        setMovieEpisode(1);
                                        setMovieEpisodesCount(season.episodeCount);
                                      }}
                                      className={cn(
                                        "px-3 py-1 rounded-full font-mono text-[10px] font-bold uppercase transition-all cursor-pointer whitespace-nowrap",
                                        movieSeason === season.seasonNumber ? "bg-red-600 text-white" : "text-zinc-500 hover:text-zinc-300"
                                      )}
                                    >
                                      S{season.seasonNumber}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 max-h-36 overflow-y-auto pr-1 scrollbar-thin">
                                {Array.from({ length: movieEpisodesCount }).map((_, idx) => {
                                  const ep = idx + 1;
                                  return (
                                    <button
                                      key={"episode-grid-" + ep}
                                      onClick={() => setMovieEpisode(ep)}
                                      className={cn(
                                        "py-2 rounded-xl border font-mono text-[10px] font-bold text-center transition-all cursor-pointer",
                                        movieEpisode === ep
                                          ? "border-red-500/50 bg-red-600/10 text-red-500"
                                          : "border-white/5 bg-white/[0.02] text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                                      )}
                                    >
                                      EP {ep}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* RIGHT: Spotlight Selection Metadata Info details */}
                      <div className="flex flex-col gap-6">
                        <div className="rounded-[2.5rem] border border-white/10 bg-zinc-950/40 p-6 sm:p-8 backdrop-blur-md flex flex-col justify-between h-full relative overflow-hidden group">
                          {/* Background Glow */}
                          <div 
                            className="absolute inset-0 z-0 bg-cover bg-center opacity-[0.03] scale-110 pointer-events-none"
                            style={{ backgroundImage: `url(${selectedMedia.backdropUrl})` }}
                          />
                          
                          <div className="relative z-10 flex flex-col h-full justify-between gap-5">
                            <div>
                              <div className="font-mono text-[9px] uppercase tracking-[0.45em] text-red-500 font-bold mb-2">
                                SPOTLIGHT SELECTION
                              </div>
                              <h1 className="text-xl sm:text-3xl font-black italic tracking-tighter text-white uppercase transform -skew-x-3 line-clamp-2">
                                {selectedMedia.title}
                              </h1>
                              
                              <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-semibold text-zinc-300">
                                <span className="rounded bg-white/10 px-1.5 py-0.5 text-white">
                                  {selectedMedia.year}
                                </span>
                                <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-red-400 uppercase">
                                  {selectedMedia.type}
                                </span>
                                <span className="rounded border border-white/10 px-1.5 py-0.5 text-zinc-400">
                                  {movieExtraDetails.runtime !== "N/A" ? movieExtraDetails.runtime : selectedMedia.duration}
                                </span>
                                <span className="rounded border border-white/10 px-1.5 py-0.5">
                                  {selectedMedia.ageRating}
                                </span>
                                <div className="flex items-center gap-1 text-yellow-400 font-bold">
                                  ★ {selectedMedia.rating}
                                </div>
                              </div>

                              <p className="mt-4 text-xs text-zinc-400 leading-relaxed line-clamp-5">
                                {selectedMedia.synopsis}
                              </p>
                            </div>

                            <div className="space-y-4">
                              {/* Extra Info List */}
                              <div className="rounded-2xl bg-black/45 border border-white/[0.05] divide-y divide-white/[0.05] font-mono text-[9px] w-full">
                                <div className="flex items-center justify-between px-3.5 py-2">
                                  <span className="text-zinc-500">DIRECTOR</span>
                                  <span className="text-zinc-200 font-bold truncate max-w-[150px]">{movieExtraDetails.director}</span>
                                </div>
                                <div className="flex items-center justify-between px-3.5 py-2">
                                  <span className="text-zinc-500">LANGUAGE</span>
                                  <span className="text-zinc-200 font-bold uppercase">{movieExtraDetails.language}</span>
                                </div>
                                <div className="flex items-center justify-between px-3.5 py-2">
                                  <span className="text-zinc-500">RELEASED</span>
                                  <span className="text-zinc-200 font-bold">{movieExtraDetails.releaseDate !== "N/A" ? movieExtraDetails.releaseDate : selectedMedia.year}</span>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex gap-2">
                                {selectedMedia.trailers && selectedMedia.trailers.length > 0 && (
                                  <button
                                    onClick={() => setMovieActiveTrailerKey(selectedMedia.trailers?.[0].key ?? null)}
                                    className="flex-1 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 font-bold bg-white/5 border border-white/10 hover:border-white/20 hover:scale-102 h-[38px] text-[10px] uppercase text-zinc-100 cursor-pointer"
                                  >
                                    Watch Trailer
                                  </button>
                                )}
                                <button
                                  onClick={() => setMovieShowDownloadPanel((prev) => !prev)}
                                  className="rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 font-bold bg-white/5 border border-white/10 hover:border-white/20 hover:scale-102 h-[38px] w-[38px] p-0 shrink-0 text-white cursor-pointer"
                                  title="Download stream offline"
                                >
                                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                    <path d="M5 20h14v-2H5v2zM19 9h-4V3H9v6H5l7 7 7-7z" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* HORIZONTAL CATEGORY SHELVES */}
                    <div className="flex flex-col gap-6">
                      {/* 1. Trending Blockbusters Row */}
                      <section className="space-y-3 text-left">
                        <div className="flex items-center justify-between px-1">
                          <h2 className="text-md font-extrabold text-white tracking-tight uppercase border-l-2 border-red-600 pl-2">
                            Trending Now
                          </h2>
                        </div>
                        <div className="flex gap-4 overflow-x-auto pb-4 pt-1 scrollbar-hide items-start">
                          {TRENDING_MEDIA.map((item) => (
                            <button
                              key={item.id + item.type + "-trending-row"}
                              onClick={() => {
                                setSelectedMedia(item);
                                setMovieSeason(1);
                                setMovieEpisode(1);
                                window.scrollTo({ top: 0, behavior: "smooth" });
                              }}
                              className={cn(
                                "flex-none w-[130px] sm:w-[170px] rounded-2xl overflow-hidden bg-zinc-950/60 border border-white/5 text-left transition-all duration-300 hover:scale-105 active:scale-95 group/card cursor-pointer shadow-lg",
                                selectedMedia.id === item.id && selectedMedia.type === item.type
                                  ? "border-red-500/50 bg-red-950/20 shadow-[0_0_15px_rgba(239,68,68,0.15)]"
                                  : "hover:border-white/10 hover:bg-zinc-900/60"
                              )}
                            >
                              <div className="aspect-[2/3] relative overflow-hidden bg-zinc-900">
                                <img
                                  src={item.posterUrl || item.backdropUrl}
                                  alt=""
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=200&auto=format&fit=crop&q=60";
                                  }}
                                />
                                <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] font-mono text-yellow-400">
                                  ★ {item.rating}
                                </div>
                              </div>
                              <div className="p-3">
                                <h3 className="text-xs font-bold text-zinc-100 truncate group-hover/card:text-red-500 transition-colors">
                                  {item.title}
                                </h3>
                                <div className="mt-1 flex items-center gap-1.5 font-mono text-[8px] text-zinc-500 uppercase">
                                  <span>{item.year}</span>
                                  <span>·</span>
                                  <span className="text-red-500 font-bold">{item.type}</span>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </section>

                      {/* 2. Popular Movies Row */}
                      <section className="space-y-3 text-left">
                        <div className="flex items-center justify-between px-1">
                          <h2 className="text-md font-extrabold text-white tracking-tight uppercase border-l-2 border-red-600 pl-2">
                            Blockbuster Movies
                          </h2>
                        </div>
                        <div className="flex gap-4 overflow-x-auto pb-4 pt-1 scrollbar-hide items-start">
                          {TRENDING_MEDIA.filter(m => m.type === "movie").map((item) => (
                            <button
                              key={item.id + item.type + "-movies-row"}
                              onClick={() => {
                                setSelectedMedia(item);
                                setMovieSeason(1);
                                setMovieEpisode(1);
                                window.scrollTo({ top: 0, behavior: "smooth" });
                              }}
                              className={cn(
                                "flex-none w-[130px] sm:w-[170px] rounded-2xl overflow-hidden bg-zinc-950/60 border border-white/5 text-left transition-all duration-300 hover:scale-105 active:scale-95 group/card cursor-pointer shadow-lg",
                                selectedMedia.id === item.id && selectedMedia.type === item.type
                                  ? "border-red-500/50 bg-red-950/20 shadow-[0_0_15px_rgba(239,68,68,0.15)]"
                                  : "hover:border-white/10 hover:bg-zinc-900/60"
                              )}
                            >
                              <div className="aspect-[2/3] relative overflow-hidden bg-zinc-900">
                                <img
                                  src={item.posterUrl || item.backdropUrl}
                                  alt=""
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=200&auto=format&fit=crop&q=60";
                                  }}
                                />
                                <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] font-mono text-yellow-400">
                                  ★ {item.rating}
                                </div>
                              </div>
                              <div className="p-3">
                                <h3 className="text-xs font-bold text-zinc-100 truncate group-hover/card:text-red-500 transition-colors">
                                  {item.title}
                                </h3>
                                <div className="mt-1 flex items-center gap-1.5 font-mono text-[8px] text-zinc-500 uppercase">
                                  <span>{item.year}</span>
                                  <span>·</span>
                                  <span className="text-red-500 font-bold">{item.type}</span>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </section>

                      {/* 3. Hit TV Series Row */}
                      <section className="space-y-3 text-left">
                        <div className="flex items-center justify-between px-1">
                          <h2 className="text-md font-extrabold text-white tracking-tight uppercase border-l-2 border-red-600 pl-2">
                            Hit TV Series
                          </h2>
                        </div>
                        <div className="flex gap-4 overflow-x-auto pb-4 pt-1 scrollbar-hide items-start">
                          {TRENDING_MEDIA.filter(m => m.type === "tv").map((item) => (
                            <button
                              key={item.id + item.type + "-series-row"}
                              onClick={() => {
                                setSelectedMedia(item);
                                setMovieSeason(1);
                                setMovieEpisode(1);
                                window.scrollTo({ top: 0, behavior: "smooth" });
                              }}
                              className={cn(
                                "flex-none w-[130px] sm:w-[170px] rounded-2xl overflow-hidden bg-zinc-950/60 border border-white/5 text-left transition-all duration-300 hover:scale-105 active:scale-95 group/card cursor-pointer shadow-lg",
                                selectedMedia.id === item.id && selectedMedia.type === item.type
                                  ? "border-red-500/50 bg-red-950/20 shadow-[0_0_15px_rgba(239,68,68,0.15)]"
                                  : "hover:border-white/10 hover:bg-zinc-900/60"
                              )}
                            >
                              <div className="aspect-[2/3] relative overflow-hidden bg-zinc-900">
                                <img
                                  src={item.posterUrl || item.backdropUrl}
                                  alt=""
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=200&auto=format&fit=crop&q=60";
                                  }}
                                />
                                <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] font-mono text-yellow-400">
                                  ★ {item.rating}
                                </div>
                              </div>
                              <div className="p-3">
                                <h3 className="text-xs font-bold text-zinc-100 truncate group-hover/card:text-red-500 transition-colors">
                                  {item.title}
                                </h3>
                                <div className="mt-1 flex items-center gap-1.5 font-mono text-[8px] text-zinc-500 uppercase">
                                  <span>{item.year}</span>
                                  <span>·</span>
                                  <span className="text-red-500 font-bold">{item.type}</span>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </section>

                      {/* 4. More Like This / Recommendations Row */}
                      {movieRecommendations.length > 0 && (
                        <section className="space-y-3 text-left">
                          <div className="flex items-center justify-between px-1">
                            <h2 className="text-md font-extrabold text-white tracking-tight uppercase border-l-2 border-purple-500 pl-2">
                              More Like This
                            </h2>
                            <span className="text-[10px] font-mono text-zinc-500">{movieRecommendations.length} titles</span>
                          </div>
                          <div className="flex gap-4 overflow-x-auto pb-4 pt-1 scrollbar-hide items-start">
                            {movieRecommendations.map((item) => (
                              <button
                                key={item.id + item.type + "-recs-row"}
                                onClick={() => {
                                  setSelectedMedia(item);
                                  setMovieSeason(1);
                                  setMovieEpisode(1);
                                  window.scrollTo({ top: 0, behavior: "smooth" });
                                }}
                                className={cn(
                                  "flex-none w-[130px] sm:w-[160px] rounded-2xl overflow-hidden bg-zinc-950/60 border border-white/5 text-left transition-all duration-300 hover:scale-105 active:scale-95 group/card cursor-pointer shadow-lg",
                                  selectedMedia.id === item.id && selectedMedia.type === item.type
                                    ? "border-purple-500/50 bg-purple-950/20 shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                                    : "hover:border-purple-500/20 hover:bg-zinc-900/60"
                                )}
                              >
                                <div className="aspect-[2/3] relative overflow-hidden bg-zinc-900">
                                  <img
                                    src={item.posterUrl || item.backdropUrl}
                                    alt=""
                                    className="h-full w-full object-cover"
                                    onError={(e) => {
                                      (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=200&auto=format&fit=crop&q=60";
                                    }}
                                  />
                                  <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] font-mono text-yellow-400">
                                    ★ {item.rating}
                                  </div>
                                  <div className="absolute inset-0 bg-gradient-to-t from-purple-900/20 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity" />
                                </div>
                                <div className="p-3">
                                  <h3 className="text-xs font-bold text-zinc-100 truncate group-hover/card:text-purple-400 transition-colors">
                                    {item.title}
                                  </h3>
                                  <div className="mt-1 flex items-center gap-1.5 font-mono text-[8px] text-zinc-500 uppercase">
                                    <span>{item.year}</span>
                                    <span>·</span>
                                    <span className="text-purple-400 font-bold">{item.type}</span>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </section>
                      )}
                    </div>
                  </>
                )}

                {/* TMDb API Settings & Custom Loader Utility Panel */}
                <section className="grid gap-6 md:grid-cols-2 text-left mt-2">
                  {/* Settings Panel */}
                  <article className="rounded-[2rem] border border-white/10 bg-zinc-950/40 p-5 backdrop-blur-md">
                    <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-zinc-300 font-bold">
                      <span>🔑 TMDb API Configuration</span>
                      {tmdbKey.trim() ? (
                        <span className="text-emerald-400 font-bold text-[9px] border border-emerald-500/20 bg-emerald-500/5 px-2 py-0.5 rounded-full">Connected</span>
                      ) : (
                        <span className="text-yellow-500 font-bold text-[9px] border border-yellow-500/20 bg-yellow-500/5 px-2 py-0.5 rounded-full">Offline Mode</span>
                      )}
                    </div>
                    <div className="mt-3.5 space-y-3">
                      <p className="text-[10px] text-zinc-400 leading-relaxed font-mono">
                        Paste your personal TMDb v3 API Key to resolve online details, search, cast & trailers. Saved strictly to localStorage.
                      </p>
                      <div className="flex flex-col gap-2">
                        <input
                          type="password"
                          value={tmdbKey}
                          onChange={(e) => {
                            setTmdbKey(e.target.value);
                            localStorage.setItem("tubetv:tmdb-key", e.target.value);
                          }}
                          placeholder="Paste TMDb API Key..."
                          className="w-full rounded-full border border-white/10 bg-zinc-950 px-4 py-2.5 text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-red-500/40"
                        />
                        {tmdbKey.trim() && (
                          <button
                            onClick={() => {
                              setTmdbKey("");
                              localStorage.removeItem("tubetv:tmdb-key");
                              toast.success("TMDb API Key cleared");
                            }}
                            className="w-full text-center text-[10px] font-mono font-bold uppercase tracking-wider text-red-400/80 hover:text-red-400 mt-1 cursor-pointer"
                          >
                            Clear Key
                          </button>
                        )}
                      </div>
                    </div>
                  </article>

                  {/* Direct ID Loader */}
                  <article className="rounded-[2rem] border border-white/10 bg-zinc-950/40 p-5 backdrop-blur-md">
                    <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-zinc-300 font-bold">
                      <span>Direct Loader</span>
                    </div>
                    <p className="text-[10px] text-zinc-400 leading-relaxed font-mono mt-2">
                      Know the TMDb ID? Load the stream instantly by typing it below.
                    </p>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      if (!movieCustomIdInput.trim()) return;
                      setSelectedMedia({
                        id: movieCustomIdInput.trim(),
                        title: `Custom ${movieCustomType === "movie" ? "Movie" : "TV"} #${movieCustomIdInput}`,
                        year: "2026",
                        type: movieCustomType,
                        rating: "N/A",
                        votes: "0",
                        genres: ["Override"],
                        duration: "Unknown",
                        ageRating: "NR",
                        synopsis: "Manual override stream loaded via direct TMDB ID override.",
                        backdropUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=60",
                        posterUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=60",
                      });
                      setMovieSeason(1);
                      setMovieEpisode(1);
                    }} className="mt-3.5 space-y-2.5">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setMovieCustomType("movie")}
                          className={cn(
                            "flex-1 rounded-full py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer",
                            movieCustomType === "movie" ? "bg-red-600 text-white" : "bg-white/5 text-zinc-400"
                          )}
                        >
                          Movie
                        </button>
                        <button
                          type="button"
                          onClick={() => setMovieCustomType("tv")}
                          className={cn(
                            "flex-1 rounded-full py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer",
                            movieCustomType === "tv" ? "bg-red-600 text-white" : "bg-white/5 text-zinc-400"
                          )}
                        >
                          TV
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <input
                          value={movieCustomIdInput}
                          onChange={(e) => setMovieCustomIdInput(e.target.value)}
                          placeholder="e.g. 27205"
                          className="flex-1 rounded-full border border-white/10 bg-zinc-950 px-4 py-2 text-xs font-mono text-white focus:outline-none"
                        />
                        <button
                          type="submit"
                          className="rounded-full bg-red-600 hover:bg-red-500 text-white px-5 py-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                        >
                          Load
                        </button>
                      </div>
                    </form>
                  </article>
                </section>

                {/* Circular Cast Grid */}
                {movieCast.length > 0 && (
                  <section className="space-y-4 mt-2 text-left">
                    <h2 className="text-xl font-bold text-white/90 px-2 uppercase tracking-tight">Cast Members</h2>
                    <div className="flex gap-5 overflow-x-auto p-4 px-6 scrollbar-hide">
                      {movieCast.map((member) => (
                        <div key={member.name} className="flex flex-col items-center gap-2.5 flex-none w-28 text-center group">
                          <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden bg-white/5 border border-white/10 shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:border-white/30 z-10">
                            {member.profileUrl ? (
                              <img
                                src={member.profileUrl}
                                alt={member.name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white/30 font-bold text-xl bg-zinc-800">
                                {member.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-xs font-semibold text-white/90 line-clamp-1 group-hover:text-white transition-colors">{member.name}</p>
                            <p className="text-[10px] text-white/50 line-clamp-1">{member.character}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* YouTube Trailers Row */}
                {movieTrailers.length > 0 && (
                  <section className="space-y-4 mt-2 text-left">
                    <h2 className="text-xl font-bold text-white/90 px-2 uppercase tracking-tight">Trailers & Clips</h2>
                    <div className="flex gap-5 overflow-x-auto p-4 px-6 scrollbar-hide">
                      {movieTrailers.slice(0, 6).map((trailer) => (
                        <button
                          key={trailer.key}
                          onClick={() => setMovieActiveTrailerKey(trailer.key)}
                          className="relative flex-none w-56 sm:w-72 aspect-video group cursor-pointer transition-transform duration-200 active:scale-95 text-left"
                        >
                          <div className="relative w-full h-full rounded-2xl overflow-hidden bg-black/20 border border-white/5 transition-all duration-300 group-hover:scale-105 group-hover:ring-1 group-hover:ring-white/30 shadow-lg shadow-black/40">
                            <img
                              src={`https://img.youtube.com/vi/${trailer.key}/mqdefault.jpg`}
                              alt={trailer.name}
                              className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-all"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                              <div className="bg-white/10 hover:bg-white/20 rounded-full p-2.5 backdrop-blur-md border border-white/20 transition-all scale-90 group-hover:scale-105">
                                <Play className="h-6 w-6 text-white fill-current" />
                              </div>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
                              <p className="text-xs font-bold text-white line-clamp-1">{trailer.name}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                {/* Download panel details */}
                {movieShowDownloadPanel && (
                  <section className="rounded-[2rem] border border-white/10 bg-[#0c0f16]/90 p-6 backdrop-blur-xl animate-fade-in text-left">
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-red-500 fill-current animate-bounce" viewBox="0 0 24 24">
                          <path d="M5 20h14v-2H5v2zM19 9h-4V3H9v6H5l7 7 7-7z" />
                        </svg>
                        <span className="font-mono text-xs uppercase tracking-widest text-zinc-100 font-bold">Offline Download Cabinet</span>
                      </div>
                      <button onClick={() => setMovieShowDownloadPanel(false)} className="text-zinc-500 hover:text-white text-xs font-mono">CLOSE ✕</button>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      {(() => {
                        const isTv = selectedMedia.type === "tv";
                        const sizeTable = isTv
                          ? [
                              { quality: "720p HD", size: "280–450 MB", format: "MP4 (H.264)" },
                              { quality: "1080p Full HD", size: "600–900 MB", format: "MKV (HEVC)" },
                              { quality: "2160p 4K Ultra HD", size: "2.0–3.5 GB", format: "MKV (AV1/HDR)" },
                            ]
                          : [
                              { quality: "720p HD", size: "900 MB – 1.4 GB", format: "MP4 (H.264)" },
                              { quality: "1080p Full HD", size: "2.0–3.5 GB", format: "MKV (HEVC)" },
                              { quality: "2160p 4K Ultra HD", size: "6.5–12 GB", format: "MKV (AV1/HDR)" },
                            ];
                        return sizeTable.map(({ quality, size, format }) => {
                          const key = `${selectedMedia.id}-${quality}`;
                          const progress = movieDownloadProgress[key] ?? 0;
                          const isActive = movieDownloadActive === key;

                          const triggerDownload = () => {
                            if (progress >= 100 || isActive) return;
                            setMovieDownloadActive(key);
                            let p = 0;
                            const interval = setInterval(() => {
                              p += Math.floor(Math.random() * 8) + 4;
                              if (p >= 100) {
                                p = 100;
                                clearInterval(interval);
                                setMovieDownloadActive(null);
                                toast.success(`${quality} downloaded successfully!`);
                              }
                              setMovieDownloadProgress((prev) => ({ ...prev, [key]: p }));
                            }, 250);
                          };

                          return (
                            <div key={quality} className="rounded-xl border border-white/5 bg-white/[0.02] p-4 flex flex-col justify-between gap-3 hover:border-white/10 hover:bg-white/[0.04] transition-all">
                              <div>
                                <div className="font-bold text-sm text-zinc-100">{quality}</div>
                                <div className="text-xs text-zinc-500 font-mono mt-1">{format} · {size}</div>
                              </div>

                              {progress > 0 && (
                                <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden">
                                  <div className="bg-red-500 h-full rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                                </div>
                              )}

                              <button
                                onClick={triggerDownload}
                                disabled={isActive}
                                className={cn(
                                  "w-full rounded-lg py-2 font-mono text-[10px] uppercase font-bold tracking-wider transition-all cursor-pointer",
                                  progress >= 100
                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                    : isActive
                                    ? "bg-red-500/20 text-red-400 animate-pulse"
                                    : "bg-white/5 text-zinc-300 hover:bg-white/10 border border-white/5"
                                )}
                              >
                                {progress >= 100 ? "Completed ✓" : isActive ? `Downloading ${progress}%...` : "Request Download"}
                              </button>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </section>
                )}

                {/* Trailer Lightbox Modal */}
                {movieActiveTrailerKey && (
                  <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 backdrop-blur-md animate-fade-in"
                    onClick={() => setMovieActiveTrailerKey(null)}
                  >
                    <div
                      className="relative w-full max-w-4xl aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <iframe
                        src={`https://www.youtube.com/embed/${movieActiveTrailerKey}?autoplay=1`}
                        title="Trailer Player"
                        className="w-full h-full"
                        allowFullScreen
                        allow="autoplay"
                      />
                      <button
                        onClick={() => setMovieActiveTrailerKey(null)}
                        className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 border border-white/10 transition-colors font-bold w-9 h-9 flex items-center justify-center cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-8 p-4 font-mono text-[9px] leading-relaxed text-zinc-600 text-center uppercase tracking-wider border-t border-white/5">
                  Disclaimer: This app indexes third party streaming APIs for educational research. No files are stored locally.
                </div>
              </div>
            </div>
          ) : (
            <>
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
          </>
        )}
      </div>

        <Guide
          open={guideOpen}
          mode={mode === "movies" ? "yt" : mode}
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
