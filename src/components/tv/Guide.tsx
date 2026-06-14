import { CATEGORIES, CHANNELS, type Channel } from "@/lib/channels";
import { IPTV_COUNTRIES, loadCountryChannels, loadCategoryChannels, searchGlobally, type IptvChannel } from "@/lib/iptv";
import { RADIO_COUNTRIES, loadCountryRadio, type RadioStation } from "@/lib/radio";
import { type TvHistoryEntry } from "@/lib/tv-routes";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Loader2, Globe2, Tv, Radio as RadioIcon, Star } from "lucide-react";

type Props = {
  open: boolean;
  mode: "yt" | "iptv" | "radio";
  onModeChange: (m: "yt" | "iptv" | "radio") => void;
  currentId: string;
  onPick: (c: Channel) => void;
  onPickIptv: (country: string, ch: IptvChannel) => void;
  iptvCountry: string;
  onCountryChange: (code: string) => void;
  iptvCurrentUrl: string | null;
  onPickRadio: (country: string, st: RadioStation) => void;
  radioCountry: string;
  onRadioCountryChange: (code: string) => void;
  radioCurrentUrl: string | null;
  onClose: () => void;
  favorites?: string[];
  onToggleFavorite?: (id: string) => void;
  history?: TvHistoryEntry[];
  onPickHistory?: (entry: TvHistoryEntry) => void;
};

export function Guide({
  open,
  mode,
  onModeChange,
  currentId,
  onPick,
  onPickIptv,
  iptvCountry,
  onCountryChange,
  iptvCurrentUrl,
  onPickRadio,
  radioCountry,
  onRadioCountryChange,
  radioCurrentUrl,
  onClose,
  favorites = [],
  onToggleFavorite,
  history = [],
  onPickHistory,
}: Props) {
  const [cat, setCat] = useState<string>("All");
  const [iptvList, setIptvList] = useState<IptvChannel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState<string>("All");
  const [sort, setSort] = useState<"default" | "name">("default");
  const [radioList, setRadioList] = useState<RadioStation[]>([]);
  const [radioLoading, setRadioLoading] = useState(false);
  const [radioError, setRadioError] = useState<string | null>(null);
  const [radioSearch, setRadioSearch] = useState("");
  const [radioTag, setRadioTag] = useState<string>("All");

  const [iptvSearchMode, setIptvSearchMode] = useState<"country" | "category" | "global">("country");
  const [iptvCategory, setIptvCategory] = useState<string>("movies");
  const [globalResults, setGlobalResults] = useState<IptvChannel[]>([]);
  const [globalLoading, setGlobalLoading] = useState(false);

  useEffect(() => {
    if (mode !== "iptv" || !open) return;
    if (iptvSearchMode === "global") return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setGroup("All");

    const promise = iptvSearchMode === "country"
      ? loadCountryChannels(iptvCountry)
      : loadCategoryChannels(iptvCategory);

    promise
      .then((list) => {
        if (!cancelled) setIptvList(list);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mode, open, iptvCountry, iptvSearchMode, iptvCategory]);

  useEffect(() => {
    if (mode !== "iptv" || !open || iptvSearchMode !== "global") return;
    if (!search.trim()) {
      setGlobalResults([]);
      return;
    }
    let cancelled = false;
    setGlobalLoading(true);
    setError(null);

    const timer = setTimeout(() => {
      searchGlobally(search)
        .then((res) => {
          if (!cancelled) setGlobalResults(res);
        })
        .catch((e) => {
          if (!cancelled) setError(e.message || "Global search failed");
        })
        .finally(() => {
          if (!cancelled) setGlobalLoading(false);
        });
    }, 450);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search, iptvSearchMode, mode, open]);

  useEffect(() => {
    if (mode !== "radio" || !open) return;
    let cancelled = false;
    setRadioLoading(true);
    setRadioError(null);
    setRadioTag("All");
    loadCountryRadio(radioCountry)
      .then((list) => {
        if (!cancelled) setRadioList(list);
      })
      .catch((e) => {
        if (!cancelled) setRadioError(e.message || "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setRadioLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mode, open, radioCountry]);

  const iptvGroups = useMemo(() => {
    const set = new Set<string>();
    for (const c of iptvList) if (c.group) set.add(c.group);
    return ["All", ...Array.from(set).sort()];
  }, [iptvList]);

  const radioTags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of radioList) {
      (s.tags || "")
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean)
        .forEach((t) => counts.set(t, (counts.get(t) || 0) + 1));
    }
    const top = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 16)
      .map(([t]) => t);
    return ["All", ...top];
  }, [radioList]);

  if (!open) return null;
  const hasFavs = favorites.length > 0;
  const cats = ["All", ...(hasFavs ? ["★ Favs"] : []), ...CATEGORIES];
  const list =
    cat === "All"
      ? CHANNELS
      : cat === "★ Favs"
        ? CHANNELS.filter((c) => favorites.includes(c.id))
        : CHANNELS.filter((c) => c.category === cat);
  const displayedIptvChannels = useMemo(() => {
    if (iptvSearchMode === "global") {
      return globalResults;
    }
    let filtered = iptvList;
    if (group !== "All") {
      filtered = filtered.filter((c) => (c.group || "") === group);
    }
    if (search) {
      filtered = filtered.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
    }
    if (sort === "name") {
      return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    }
    return filtered;
  }, [iptvSearchMode, globalResults, iptvList, group, search, sort]);

  let filteredRadio = radioList;
  if (radioTag !== "All")
    filteredRadio = filteredRadio.filter((s) => (s.tags || "").toLowerCase().includes(radioTag));
  if (radioSearch)
    filteredRadio = filteredRadio.filter((s) =>
      s.name.toLowerCase().includes(radioSearch.toLowerCase()),
    );
  const recentHistory = history.slice(0, 8);

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-[linear-gradient(180deg,rgba(10,13,16,0.93),rgba(7,9,12,0.98))] backdrop-blur-md animate-flicker">
      <div className="flex flex-col gap-3 border-b border-border/60 bg-[linear-gradient(90deg,rgba(79,174,123,0.05),rgba(226,174,74,0.04),transparent)] px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
        <div>
          <div className="font-mono-tv text-xs uppercase tracking-[0.3em] text-primary text-glow">
            ▎ Channel Guide
          </div>
          <div className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">
            {mode === "yt"
              ? "Pick a channel"
              : mode === "iptv"
                ? "Live TV — worldwide"
                : "Radio — worldwide"}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex flex-1 rounded-md border border-border/60 bg-background/30 p-0.5 sm:flex-none">
            <button
              onClick={() => onModeChange("yt")}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 font-mono-tv text-[10px] uppercase tracking-widest transition-colors sm:flex-none sm:px-3",
                mode === "yt"
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Tv className="h-3.5 w-3.5" /> YouTube
            </button>
            <button
              onClick={() => onModeChange("iptv")}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 font-mono-tv text-[10px] uppercase tracking-widest transition-colors sm:flex-none sm:px-3",
                mode === "iptv"
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Globe2 className="h-3.5 w-3.5" /> Live TV
            </button>
            <button
              onClick={() => onModeChange("radio")}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 font-mono-tv text-[10px] uppercase tracking-widest transition-colors sm:flex-none sm:px-3",
                mode === "radio"
                  ? "bg-accent/15 text-accent"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <RadioIcon className="h-3.5 w-3.5" /> Radio
            </button>
          </div>
          <button
            onClick={onClose}
            className="hidden font-mono-tv text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground sm:block"
          >
            [ESC] close
          </button>
        </div>
      </div>

      {recentHistory.length > 0 && (
        <div className="border-b border-border/60 px-3 py-3 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-mono-tv text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                Recent
              </div>
              <div className="mt-1 hidden text-sm text-muted-foreground sm:block">
                Jump back to the last places you were watching or listening.
              </div>
            </div>
            <div className="font-mono-tv text-[10px] uppercase tracking-widest text-muted-foreground">
              {recentHistory.length} saved
            </div>
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {recentHistory.map((entry) => {
              const modeLabel =
                entry.mode === "yt" ? "YouTube" : entry.mode === "iptv" ? "Live TV" : "Radio";
              return (
                <button
                  key={entry.path}
                  onClick={() => onPickHistory?.(entry)}
                  className={cn(
                    "min-w-[190px] rounded-md border border-l-4 bg-background/25 p-3 text-left transition-colors hover:bg-background/40 sm:min-w-[220px]",
                    entry.mode === "yt"
                      ? "border-l-primary/40 hover:border-l-primary/70"
                      : entry.mode === "iptv"
                        ? "border-l-accent/40 hover:border-l-accent/70"
                        : "border-l-secondary/40 hover:border-l-secondary/70",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="truncate text-sm font-semibold tracking-tight">
                      {entry.title}
                    </div>
                    <div className="rounded-full border border-border/60 px-2 py-0.5 font-mono-tv text-[9px] uppercase tracking-widest text-muted-foreground">
                      {modeLabel}
                    </div>
                  </div>
                  <div className="mt-1 truncate text-xs text-muted-foreground">
                    {entry.subtitle}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {mode === "yt" && (
        <>
          <div className="flex gap-2 overflow-x-auto border-b border-border/60 px-3 py-2.5 sm:px-6 sm:py-3">
            {cats.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={cn(
                  "shrink-0 rounded-md border px-3 py-1.5 font-mono-tv text-[10px] uppercase tracking-widest transition-colors sm:px-4 sm:text-xs",
                  cat === c
                    ? "border-primary bg-primary/12 text-primary"
                    : "border-border/60 text-muted-foreground hover:border-foreground/40 hover:text-foreground",
                )}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="grid flex-1 gap-2 overflow-y-auto p-3 sm:grid-cols-2 sm:gap-3 sm:p-6 lg:grid-cols-3 xl:grid-cols-4">
            {list.map((ch) => {
              const active = ch.id === currentId;
              const fav = favorites.includes(ch.id);
              return (
                <button
                  key={ch.id}
                  onClick={() => onPick(ch)}
                  className={cn(
                    "group relative overflow-hidden rounded-sm border border-border/60 bg-background/25 p-4 text-left transition-colors hover:bg-background/40 sm:p-5",
                    active
                      ? "border-l-4 border-l-primary bg-primary/10"
                      : "hover:border-foreground/30",
                  )}
                >
                  <div className="bg-scanlines pointer-events-none absolute inset-0 opacity-30" />
                  {onToggleFavorite && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(ch.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.stopPropagation();
                          onToggleFavorite(ch.id);
                        }
                      }}
                      className={cn(
                        "absolute right-3 top-3 z-10 rounded-md border border-border/60 bg-background/45 p-1.5 transition-colors hover:border-foreground/40",
                        fav ? "text-accent" : "text-muted-foreground",
                      )}
                      aria-label={fav ? "Unfavorite" : "Favorite"}
                    >
                      <Star className={cn("h-3.5 w-3.5", fav && "fill-current")} />
                    </span>
                  )}
                  <div className="flex items-start justify-between">
                    <div className="font-mono-tv text-2xl font-bold leading-none text-foreground/85 sm:text-3xl">
                      {ch.number}
                    </div>
                    {active && (
                      <div className="flex items-center gap-1.5 font-mono-tv text-[10px] uppercase tracking-widest text-primary">
                        <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-primary shadow-glow" />
                        on air
                      </div>
                    )}
                  </div>
                  <div className="mt-4 text-lg font-bold tracking-tight">{ch.name}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{ch.tagline}</div>
                  <div className="mt-4 font-mono-tv text-[10px] uppercase tracking-widest text-muted-foreground">
                    {ch.category} · {ch.videos.length} in rotation
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {mode === "iptv" && (
        <>
          {/* Sub-mode Selection Bar */}
          <div className="flex border-b border-border/40 px-3 py-1.5 sm:px-6 gap-2 bg-background/20">
            {[
              { id: "country", label: "🗺️ Countries" },
              { id: "category", label: "🎬 Categories & Movies" },
              { id: "global", label: "🌐 Global Search" }
            ].map((subMode) => (
              <button
                key={subMode.id}
                onClick={() => {
                  setIptvSearchMode(subMode.id as any);
                  setError(null);
                }}
                className={cn(
                  "rounded-md px-3 py-1 font-mono-tv text-[10px] uppercase tracking-wider transition-all border",
                  iptvSearchMode === subMode.id
                    ? "bg-accent/15 text-accent border-accent/40 shadow-[0_0_8px_rgba(226,174,74,0.15)]"
                    : "border-transparent text-muted-foreground hover:bg-white/5 hover:text-foreground"
                )}
              >
                {subMode.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 border-b border-border/60 px-3 py-2.5 sm:px-6 sm:py-3">
            {iptvSearchMode === "country" && (
              <select
                value={iptvCountry}
                onChange={(e) => onCountryChange(e.target.value)}
                className="min-w-0 flex-1 rounded-md border border-border/60 bg-background/40 px-3 py-1.5 font-mono-tv text-xs uppercase tracking-widest text-foreground hover:border-accent/60 sm:flex-none"
              >
                {IPTV_COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name}
                  </option>
                ))}
              </select>
            )}

            {iptvSearchMode === "category" && (
              <select
                value={iptvCategory}
                onChange={(e) => setIptvCategory(e.target.value)}
                className="min-w-0 flex-1 rounded-md border border-border/60 bg-background/40 px-3 py-1.5 font-mono-tv text-xs uppercase tracking-widest text-foreground hover:border-accent/60 sm:flex-none"
              >
                <option value="movies">🎬 Movies & Cinema</option>
                <option value="auto">🏎️ F1 & Motor Sports</option>
                <option value="sports">⚽ Sports Live</option>
                <option value="news">📰 Live News</option>
                <option value="documentary">🧬 Science & Nature</option>
                <option value="music">🎵 Music & Entertainment</option>
              </select>
            )}

            {iptvSearchMode !== "global" && (
              <select
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                className="min-w-0 flex-1 rounded-md border border-border/60 bg-background/40 px-3 py-1.5 font-mono-tv text-xs uppercase tracking-widest text-foreground hover:border-accent/60 sm:flex-none"
              >
                {iptvGroups.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            )}

            {iptvSearchMode !== "global" && (
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as "default" | "name")}
                className="min-w-0 flex-1 rounded-md border border-border/60 bg-background/40 px-3 py-1.5 font-mono-tv text-xs uppercase tracking-widest text-foreground hover:border-accent/60 sm:flex-none"
              >
                <option value="default">Sort: default</option>
                <option value="name">Sort: A–Z</option>
              </select>
            )}

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={iptvSearchMode === "global" ? "Type 'f1' or 'movies' to search globally..." : "Search channels…"}
              className="min-w-full flex-1 rounded-md border border-border/60 bg-background/40 px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:border-accent/60 focus:outline-none sm:min-w-[220px]"
            />

            <span className="font-mono-tv text-[10px] uppercase tracking-widest text-muted-foreground">
              {loading || globalLoading ? "loading…" : `${displayedIptvChannels.length} streams`}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 sm:p-6">
            {error && (
              <div className="rounded-md border border-destructive/60 bg-destructive/10 p-4 text-sm text-destructive font-mono-tv">
                {error}
              </div>
            )}
            {(loading || globalLoading) && (
              <div className="flex items-center gap-2 text-muted-foreground font-mono-tv text-sm">
                <Loader2 className="h-4 w-4 animate-spin text-accent" /> Loading playlist from iptv-org…
              </div>
            )}
            {!(loading || globalLoading) && !error && (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {displayedIptvChannels.slice(0, 300).map((ch) => {
                  const active = ch.url === iptvCurrentUrl;
                  const countryObj = IPTV_COUNTRIES.find((c) => c.code === ch.countryCode);
                  const flag = countryObj ? countryObj.flag : "";
                  return (
                    <button
                      key={ch.id + ch.url}
                      onClick={() => onPickIptv(ch.countryCode || iptvCountry, ch)}
                      className={cn(
                        "flex items-center gap-3 rounded-sm border border-border/60 bg-background/25 p-3 text-left transition-colors hover:bg-background/40",
                        active
                          ? "border-l-4 border-l-primary bg-primary/10"
                          : "hover:border-foreground/30",
                      )}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-background/40">
                        {ch.logo ? (
                          <img
                            src={ch.logo}
                            alt=""
                            className="h-full w-full object-contain"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <Tv className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold tracking-tight">
                          {flag} {ch.name}
                        </div>
                        <div className="truncate font-mono-tv text-[10px] uppercase tracking-widest text-muted-foreground">
                          {ch.group || "general"}
                        </div>
                      </div>
                      {active && (
                        <span className="h-2 w-2 animate-pulse-dot rounded-full bg-primary shadow-glow" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {mode === "radio" && (
        <>
          <div className="flex flex-wrap items-center gap-2 border-b border-border/60 px-3 py-2.5 sm:px-6 sm:py-3">
            <select
              value={radioCountry}
              onChange={(e) => onRadioCountryChange(e.target.value)}
              className="min-w-0 flex-1 rounded-md border border-border/60 bg-background/40 px-3 py-1.5 font-mono-tv text-xs uppercase tracking-widest text-foreground hover:border-foreground/60 sm:flex-none"
            >
              {RADIO_COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.name}
                </option>
              ))}
            </select>
            <select
              value={radioTag}
              onChange={(e) => setRadioTag(e.target.value)}
              className="min-w-0 flex-1 rounded-md border border-border/60 bg-background/40 px-3 py-1.5 font-mono-tv text-xs uppercase tracking-widest text-foreground hover:border-foreground/60 sm:flex-none"
            >
              {radioTags.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <input
              value={radioSearch}
              onChange={(e) => setRadioSearch(e.target.value)}
              placeholder="Search stations…"
              className="min-w-full flex-1 rounded-md border border-border/60 bg-background/40 px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:border-foreground/60 focus:outline-none sm:min-w-[180px]"
            />
            <span className="font-mono-tv text-[10px] uppercase tracking-widest text-muted-foreground">
              {radioLoading ? "loading…" : `${filteredRadio.length} stations`}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 sm:p-6">
            {radioError && (
              <div className="rounded-md border border-destructive/60 bg-destructive/10 p-4 text-sm text-destructive">
                {radioError}
              </div>
            )}
            {radioLoading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading stations from radio-browser…
              </div>
            )}
            {!radioLoading && !radioError && (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredRadio.slice(0, 300).map((st) => {
                  const url = st.url_resolved || st.url;
                  const active = url === radioCurrentUrl;
                  return (
                    <button
                      key={st.stationuuid}
                      onClick={() => onPickRadio(radioCountry, st)}
                      className={cn(
                        "flex items-center gap-3 rounded-sm border border-border/60 bg-background/25 p-3 text-left transition-colors hover:bg-background/40",
                        active
                          ? "border-l-4 border-l-primary bg-primary/10"
                          : "hover:border-foreground/30",
                      )}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-background/40">
                        {st.favicon ? (
                          <img
                            src={st.favicon}
                            alt=""
                            className="h-full w-full object-contain"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <RadioIcon className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold tracking-tight">
                          {st.name}
                        </div>
                        <div className="truncate font-mono-tv text-[10px] uppercase tracking-widest text-muted-foreground">
                          {(st.tags || "general").split(",")[0]} · {st.bitrate || "?"}kbps
                        </div>
                      </div>
                      {active && (
                        <span className="h-2 w-2 animate-pulse-dot rounded-full bg-primary shadow-glow" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
