import { CATEGORIES, CHANNELS, type Channel } from "@/lib/channels";
import { IPTV_COUNTRIES, loadCountryChannels, type IptvChannel } from "@/lib/iptv";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Loader2, Globe2, Tv } from "lucide-react";

type Props = {
  open: boolean;
  mode: "yt" | "iptv";
  onModeChange: (m: "yt" | "iptv") => void;
  currentId: string;
  onPick: (c: Channel) => void;
  onPickIptv: (country: string, ch: IptvChannel) => void;
  iptvCountry: string;
  onCountryChange: (code: string) => void;
  iptvCurrentUrl: string | null;
  onClose: () => void;
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
  onClose,
}: Props) {
  const [cat, setCat] = useState<string>("All");
  const [iptvList, setIptvList] = useState<IptvChannel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (mode !== "iptv" || !open) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    loadCountryChannels(iptvCountry)
      .then((list) => { if (!cancelled) setIptvList(list); })
      .catch((e) => { if (!cancelled) setError(e.message || "Failed to load"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [mode, open, iptvCountry]);

  if (!open) return null;
  const cats = ["All", ...CATEGORIES];
  const list = cat === "All" ? CHANNELS : CHANNELS.filter((c) => c.category === cat);
  const filteredIptv = search
    ? iptvList.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    : iptvList;

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-background/85 backdrop-blur-md animate-flicker">
      <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
        <div>
          <div className="font-mono-tv text-xs uppercase tracking-[0.3em] text-primary text-glow">
            ▎ Channel Guide
          </div>
          <div className="mt-1 text-2xl font-bold tracking-tight">
            {mode === "yt" ? "Pick a channel" : "Live TV — worldwide"}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border border-border/60 bg-card/40 p-0.5">
            <button
              onClick={() => onModeChange("yt")}
              className={cn(
                "flex items-center gap-1.5 rounded px-3 py-1.5 font-mono-tv text-[10px] uppercase tracking-widest transition-colors",
                mode === "yt" ? "bg-primary/20 text-primary text-glow" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Tv className="h-3.5 w-3.5" /> YouTube
            </button>
            <button
              onClick={() => onModeChange("iptv")}
              className={cn(
                "flex items-center gap-1.5 rounded px-3 py-1.5 font-mono-tv text-[10px] uppercase tracking-widest transition-colors",
                mode === "iptv" ? "bg-accent/20 text-accent text-glow" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Globe2 className="h-3.5 w-3.5" /> Live TV
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

      {mode === "yt" ? (
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
                : "border-border/60 text-muted-foreground hover:border-foreground/40 hover:text-foreground"
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid flex-1 gap-3 overflow-y-auto p-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {list.map((ch) => {
          const active = ch.id === currentId;
          return (
            <button
              key={ch.id}
              onClick={() => onPick(ch)}
              className={cn(
                "group relative overflow-hidden rounded-xl border bg-card/60 p-5 text-left transition-all hover:-translate-y-0.5 hover:bg-card",
                active ? "border-primary shadow-glow" : "border-border/60 hover:border-foreground/30"
              )}
              style={{ ["--ch-color" as string]: ch.color }}
            >
              <div className="bg-scanlines pointer-events-none absolute inset-0 opacity-30" />
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
      ) : (
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
                        active ? "border-accent shadow-glow" : "border-border/60"
                      )}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded bg-black/50">
                        {ch.logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={ch.logo} alt="" className="h-full w-full object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                        ) : (
                          <Tv className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold tracking-tight">{ch.name}</div>
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
    </div>
  );
}