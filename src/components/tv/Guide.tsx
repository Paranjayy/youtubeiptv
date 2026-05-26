import { CATEGORIES, CHANNELS, type Channel } from "@/lib/channels";
import { IPTV_COUNTRIES, loadCountryChannels, type IptvChannel } from "@/lib/iptv";
import { RADIO_COUNTRIES, loadCountryRadio, type RadioStation } from "@/lib/radio";
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

  useEffect(() => {
    if (mode !== "iptv" || !open) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setGroup("All");
    loadCountryChannels(iptvCountry)
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
  }, [mode, open, iptvCountry]);

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
  let filteredIptv = iptvList;
  if (group !== "All") filteredIptv = filteredIptv.filter((c) => (c.group || "") === group);
  if (search)
    filteredIptv = filteredIptv.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
  if (sort === "name")
    filteredIptv = [...filteredIptv].sort((a, b) => a.name.localeCompare(b.name));

  let filteredRadio = radioList;
  if (radioTag !== "All")
    filteredRadio = filteredRadio.filter((s) => (s.tags || "").toLowerCase().includes(radioTag));
  if (radioSearch)
    filteredRadio = filteredRadio.filter((s) =>
      s.name.toLowerCase().includes(radioSearch.toLowerCase()),
    );

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-background/85 backdrop-blur-md animate-flicker">
      <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
        <div>
          <div className="font-mono-tv text-xs uppercase tracking-[0.3em] text-primary text-glow">
            ▎ Channel Guide
          </div>
          <div className="mt-1 text-2xl font-bold tracking-tight">
            {mode === "yt"
              ? "Pick a channel"
              : mode === "iptv"
                ? "Live TV — worldwide"
                : "Radio — worldwide"}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border border-border/60 bg-card/40 p-0.5">
            <button
              onClick={() => onModeChange("yt")}
              className={cn(
                "flex items-center gap-1.5 rounded px-3 py-1.5 font-mono-tv text-[10px] uppercase tracking-widest transition-colors",
                mode === "yt"
                  ? "bg-primary/20 text-primary text-glow"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Tv className="h-3.5 w-3.5" /> YouTube
            </button>
            <button
              onClick={() => onModeChange("iptv")}
              className={cn(
                "flex items-center gap-1.5 rounded px-3 py-1.5 font-mono-tv text-[10px] uppercase tracking-widest transition-colors",
                mode === "iptv"
                  ? "bg-accent/20 text-accent text-glow"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Globe2 className="h-3.5 w-3.5" /> Live TV
            </button>
            <button
              onClick={() => onModeChange("radio")}
              className={cn(
                "flex items-center gap-1.5 rounded px-3 py-1.5 font-mono-tv text-[10px] uppercase tracking-widest transition-colors",
                mode === "radio"
                  ? "bg-secondary/30 text-foreground text-glow"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <RadioIcon className="h-3.5 w-3.5" /> Radio
            </button>
          </div>
          <button
            onClick={onClose}
            className="font-mono-tv text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
          >
            [ESC] close
          </button>
        </div>
      </div>

      {mode === "yt" && (
        <>
          <div className="flex gap-2 overflow-x-auto border-b border-border/60 px-6 py-3">
            {cats.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={cn(
                  "rounded-full border px-4 py-1.5 font-mono-tv text-xs uppercase tracking-widest transition-colors",
                  cat === c
                    ? "border-primary bg-primary/20 text-primary text-glow"
                    : "border-border/60 text-muted-foreground hover:border-foreground/40 hover:text-foreground",
                )}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="grid flex-1 gap-3 overflow-y-auto p-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {list.map((ch) => {
              const active = ch.id === currentId;
              const fav = favorites.includes(ch.id);
              return (
                <button
                  key={ch.id}
                  onClick={() => onPick(ch)}
                  className={cn(
                    "group relative overflow-hidden rounded-xl border bg-card/60 p-5 text-left transition-all hover:-translate-y-0.5 hover:bg-card",
                    active
                      ? "border-primary shadow-glow"
                      : "border-border/60 hover:border-foreground/30",
                  )}
                  style={{ ["--ch-color" as string]: ch.color }}
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
                        "absolute right-3 top-3 z-10 rounded-md border border-border/60 bg-black/40 p-1.5 transition-colors hover:border-foreground/40",
                        fav ? "text-accent" : "text-muted-foreground",
                      )}
                      aria-label={fav ? "Unfavorite" : "Favorite"}
                    >
                      <Star className={cn("h-3.5 w-3.5", fav && "fill-current")} />
                    </span>
                  )}
                  <div className="flex items-start justify-between">
                    <div
                      className="font-mono-tv text-3xl font-bold leading-none text-glow"
                      style={{ color: ch.color }}
                    >
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
          <div className="flex flex-wrap items-center gap-2 border-b border-border/60 px-6 py-3">
            <select
              value={iptvCountry}
              onChange={(e) => onCountryChange(e.target.value)}
              className="rounded-md border border-border/60 bg-card/60 px-3 py-1.5 font-mono-tv text-xs uppercase tracking-widest text-foreground hover:border-accent/60"
            >
              {IPTV_COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.name}
                </option>
              ))}
            </select>
            <select
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              className="rounded-md border border-border/60 bg-card/60 px-3 py-1.5 font-mono-tv text-xs uppercase tracking-widest text-foreground hover:border-accent/60"
            >
              {iptvGroups.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as "default" | "name")}
              className="rounded-md border border-border/60 bg-card/60 px-3 py-1.5 font-mono-tv text-xs uppercase tracking-widest text-foreground hover:border-accent/60"
            >
              <option value="default">Sort: default</option>
              <option value="name">Sort: A–Z</option>
            </select>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search channels…"
              className="flex-1 min-w-[180px] rounded-md border border-border/60 bg-card/60 px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:border-accent/60 focus:outline-none"
            />
            <span className="font-mono-tv text-[10px] uppercase tracking-widest text-muted-foreground">
              {loading ? "loading…" : `${filteredIptv.length} streams`}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            {error && (
              <div className="rounded-md border border-destructive/60 bg-destructive/10 p-4 text-sm text-destructive">
                {error}
              </div>
            )}
            {loading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading playlist from iptv-org…
              </div>
            )}
            {!loading && !error && (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredIptv.slice(0, 300).map((ch) => {
                  const active = ch.url === iptvCurrentUrl;
                  return (
                    <button
                      key={ch.id + ch.url}
                      onClick={() => onPickIptv(iptvCountry, ch)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border bg-card/50 p-3 text-left transition-all hover:-translate-y-0.5 hover:bg-card",
                        active ? "border-accent shadow-glow" : "border-border/60",
                      )}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded bg-black/50">
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
                          {ch.name}
                        </div>
                        <div className="truncate font-mono-tv text-[10px] uppercase tracking-widest text-muted-foreground">
                          {ch.group || "general"}
                        </div>
                      </div>
                      {active && (
                        <span className="h-2 w-2 animate-pulse-dot rounded-full bg-accent shadow-glow" />
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
          <div className="flex flex-wrap items-center gap-2 border-b border-border/60 px-6 py-3">
            <select
              value={radioCountry}
              onChange={(e) => onRadioCountryChange(e.target.value)}
              className="rounded-md border border-border/60 bg-card/60 px-3 py-1.5 font-mono-tv text-xs uppercase tracking-widest text-foreground hover:border-foreground/60"
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
              className="rounded-md border border-border/60 bg-card/60 px-3 py-1.5 font-mono-tv text-xs uppercase tracking-widest text-foreground hover:border-foreground/60"
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
              className="flex-1 min-w-[180px] rounded-md border border-border/60 bg-card/60 px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:border-foreground/60 focus:outline-none"
            />
            <span className="font-mono-tv text-[10px] uppercase tracking-widest text-muted-foreground">
              {radioLoading ? "loading…" : `${filteredRadio.length} stations`}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
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
                        "flex items-center gap-3 rounded-lg border bg-card/50 p-3 text-left transition-all hover:-translate-y-0.5 hover:bg-card",
                        active ? "border-primary shadow-glow" : "border-border/60",
                      )}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded bg-black/50">
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
