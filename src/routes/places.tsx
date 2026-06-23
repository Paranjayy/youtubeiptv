import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Tv, Sparkles, Timer, Compass, MapPin, Cloud, Sun, CloudRain,
  CloudSnow, CloudLightning, CloudFog, Moon, Thermometer,
  Volume2, VolumeX, Maximize2, Minimize2, RotateCcw, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getAmbientEngine, AMBIENT_PRESETS, type AmbientPreset } from "@/components/tv/AmbientSounds";

export const Route = createFileRoute("/places")({
  head: () => ({
    meta: [
      { title: "Places — TubeTV" },
      { name: "description", content: "Study-with-me environments. Window views, ambient sounds, and virtual rooms." },
      { property: "og:title", content: "Places — TubeTV" },
      { property: "og:description", content: "Inhabit a place instead of choosing a video. Study, work, sleep — with ambient sounds." },
    ],
  }),
  component: PlacesPage,
});

// ─── Window views from public webcam sources ─────────────────────────────────
type WindowView = {
  id: string;
  title: string;
  location: string;
  emoji: string;
  // YouTube embed IDs for ambient "window" videos
  videoId: string;
  tagline: string;
  mood: string[];
};

const WINDOW_VIEWS: WindowView[] = [
  { id: "tokyo-rain", title: "Tokyo Rain", location: "Shibuya, Japan", emoji: "🌧️", videoId: "FjHGZj2IjBk", tagline: "neon reflections on wet pavement", mood: ["rain", "night", "urban"] },
  { id: "paris-cafe", title: "Paris Cafe", location: "Montmartre, France", emoji: "☕", videoId: "VMAPTo7RtDQ", tagline: "morning light through café windows", mood: ["cafe", "morning", "cozy"] },
  { id: "london-library", title: "British Library", location: "London, UK", emoji: "📚", videoId: "a6dL3ZJhNMc", tagline: "old books and quiet halls", mood: ["study", "quiet", "focus"] },
  { id: "nyc-park", title: "Central Park", location: "New York, USA", emoji: "🌳", videoId: "LXb3EKWsInQ", tagline: "squirrels, joggers, autumn leaves", mood: ["nature", "morning", "peaceful"] },
  { id: "space-station", title: "ISS Live", location: "Low Earth Orbit", emoji: "🚀", videoId: "21X5lGlDOfg", tagline: "earth from 400km up", mood: ["space", "night", "wonder"] },
  { id: "japan-train", title: "Japanese Train", location: "Kyoto → Tokyo", emoji: "🚄", videoId: "IjCK9D0Bx2c", tagline: "countryside blurs past", mood: ["travel", "focus", "motion"] },
  { id: "cozy-fireplace", title: "Cozy Fireplace", location: "Cabin, Norway", emoji: "🔥", videoId: "VMAPTo7RtDQ", tagline: "crackling logs and warm glow", mood: ["fire", "sleep", "cozy"] },
  { id: "beach-waves", title: "Bali Beach", location: "Uluwatu, Indonesia", emoji: "🏖️", videoId: "K4TOrB7at0Y", tagline: "turquoise water and palm trees", mood: ["ocean", "chill", "sunny"] },
  { id: "rainy-window", title: "Rainy Window", location: "Seoul, Korea", emoji: "🪟", videoId: "h2zkV-l_TfgM", tagline: "drops racing down glass", mood: ["rain", "sleep", "cozy"] },
  { id: "cyberpunk-city", title: "Neo Tokyo", location: "2049, Fiction", emoji: "🌃", videoId: "MV_3Dpw-BRY", tagline: "neon signs and flying cars", mood: ["cyber", "night", "focus"] },
  { id: "alpine-cabin", title: "Alpine Cabin", location: "Swiss Alps", emoji: "🏔️", videoId: "iqz0qVcPDB4", tagline: "snow-capped peaks through the window", mood: ["snow", "quiet", "focus"] },
  { id: "japanese-garden", title: "Zen Garden", location: "Kyoto, Japan", emoji: "🎋", videoId: "6sDvAVZGuJk", tagline: "bamboo, koi ponds, stone paths", mood: ["nature", "calm", "study"] },
];

// ─── Weather mapping ──────────────────────────────────────────────────────────
const WMO_TO_PRESET: Record<number, { preset: string; icon: typeof Sun; label: string }> = {
  0: { preset: "nature", icon: Sun, label: "Clear" },
  1: { preset: "nature", icon: Sun, label: "Mostly Clear" },
  2: { preset: "nature", icon: Sun, label: "Partly Cloudy" },
  3: { preset: "deep-work", icon: Cloud, label: "Overcast" },
  45: { preset: "cozy", icon: CloudFog, label: "Foggy" },
  48: { preset: "cozy", icon: CloudFog, label: "Rime Fog" },
  51: { preset: "study", icon: CloudRain, label: "Light Drizzle" },
  53: { preset: "study", icon: CloudRain, label: "Drizzle" },
  55: { preset: "study", icon: CloudRain, label: "Heavy Drizzle" },
  61: { preset: "study", icon: CloudRain, label: "Light Rain" },
  63: { preset: "study", icon: CloudRain, label: "Rain" },
  65: { preset: "storm", icon: CloudRain, label: "Heavy Rain" },
  71: { preset: "cozy", icon: CloudSnow, label: "Light Snow" },
  73: { preset: "cozy", icon: CloudSnow, label: "Snow" },
  75: { preset: "cozy", icon: CloudSnow, label: "Heavy Snow" },
  80: { preset: "storm", icon: CloudRain, label: "Rain Showers" },
  81: { preset: "storm", icon: CloudRain, label: "Moderate Showers" },
  82: { preset: "storm", icon: CloudRain, label: "Violent Showers" },
  95: { preset: "storm", icon: CloudLightning, label: "Thunderstorm" },
  96: { preset: "storm", icon: CloudLightning, label: "Thunderstorm + Hail" },
  99: { preset: "storm", icon: CloudLightning, label: "Heavy Thunderstorm" },
};

// ─── Component ────────────────────────────────────────────────────────────────
function PlacesPage() {
  const [selectedView, setSelectedView] = useState<WindowView>(WINDOW_VIEWS[0]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [weather, setWeather] = useState<{ temp: number; code: number; description: string } | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [ambientActive, setAmbientActive] = useState(false);

  const engine = useMemo(() => getAmbientEngine(), []);

  // Fetch weather
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setWeatherLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`)
          .then((r) => r.json())
          .then((data) => {
            if (data.current_weather) {
              const wmo = data.current_weather.weathercode;
              const mapped = WMO_TO_PRESET[wmo] || WMO_TO_PRESET[0];
              setWeather({
                temp: Math.round(data.current_weather.temperature),
                code: wmo,
                description: mapped.label,
              });
            }
          })
          .catch(() => {})
          .finally(() => setWeatherLoading(false));
      },
      () => setWeatherLoading(false),
      { timeout: 5000 }
    );
  }, []);

  const applyPreset = useCallback((presetId: string) => {
    engine.applyPreset(presetId);
    setActivePreset(presetId);
    setAmbientActive(true);
  }, [engine]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  const timeOfDay = useMemo(() => {
    const h = new Date().getHours();
    if (h >= 5 && h < 9) return "morning";
    if (h >= 9 && h < 17) return "day";
    if (h >= 17 && h < 21) return "evening";
    return "night";
  }, []);

  const greeting = useMemo(() => {
    switch (timeOfDay) {
      case "morning": return "rise & focus";
      case "day": return "deep work mode";
      case "evening": return "winding down";
      case "night": return "late night session";
    }
  }, [timeOfDay]);

  const WeatherIcon = weather ? (WMO_TO_PRESET[weather.code]?.icon || Sun) : Sun;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050608] text-zinc-100">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(79,174,123,0.08),transparent_40%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(226,174,74,0.05),transparent_35%)]" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1400px] flex-col px-4 py-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="font-mono-tv text-[10px] uppercase tracking-[0.45em] text-primary/80">
              Places
            </div>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-white sm:text-5xl">
              Inhabit a place.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-300 sm:text-base">
              {greeting}. Pick a window, layer some ambient sounds, and just <em>be somewhere</em>.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-100 transition-colors hover:bg-white/10">
              <Tv className="h-4 w-4" /> TV
            </Link>
            <Link to="/focus" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-100 transition-colors hover:bg-white/10">
              <Timer className="h-4 w-4" /> Focus
            </Link>
            <Link to="/discover" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-100 transition-colors hover:bg-white/10">
              <Compass className="h-4 w-4" /> Discover
            </Link>
          </div>
        </header>

        {/* Main content */}
        <section className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px] flex-1 min-h-0">
          {/* Left: Window view */}
          <div className="flex flex-col gap-4">
            {/* Video player */}
            <div className="relative aspect-video w-full overflow-hidden rounded-3xl border border-white/10 bg-black shadow-2xl shadow-black/50 group">
              {/* Ambient glow behind player */}
              <div
                className="absolute inset-0 z-0 bg-cover bg-center opacity-10 blur-3xl scale-110 pointer-events-none"
                style={{ backgroundImage: `url(https://img.youtube.com/vi/${selectedView.videoId}/maxresdefault.jpg)` }}
              />
              <iframe
                src={`https://www.youtube.com/embed/${selectedView.videoId}?autoplay=1&loop=1&mute=1&controls=0&rel=0&showinfo=0`}
                className="relative z-10 h-full w-full border-none"
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
              {/* Overlay info */}
              <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6">
                <div className="flex items-end justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="h-3 w-3 text-primary" />
                      <span className="font-mono-tv text-[10px] uppercase tracking-widest text-primary">{selectedView.location}</span>
                    </div>
                    <h2 className="text-2xl font-black text-white tracking-tight">{selectedView.title}</h2>
                    <p className="text-sm text-zinc-400 mt-1">{selectedView.tagline}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={toggleFullscreen} className="rounded-full bg-white/10 p-2 backdrop-blur-md hover:bg-white/20 transition-colors" title="Fullscreen">
                      {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    </button>
                    <button onClick={() => applyPreset(activePreset || "study")} className="rounded-full bg-white/10 p-2 backdrop-blur-md hover:bg-white/20 transition-colors" title="Refresh ambient">
                      <RotateCcw className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
              {/* Weather badge */}
              {weather && (
                <div className="absolute top-4 right-4 z-20 flex items-center gap-2 rounded-full bg-black/60 backdrop-blur-md px-3 py-1.5 border border-white/10">
                  <WeatherIcon className="h-3.5 w-3.5 text-primary" />
                  <span className="font-mono-tv text-[10px] text-zinc-300">{weather.temp}°C</span>
                  <span className="font-mono-tv text-[9px] text-zinc-500">{weather.description}</span>
                </div>
              )}
            </div>

            {/* Window view selector */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono-tv text-[10px] uppercase tracking-widest text-muted-foreground">Window Views</span>
                <span className="font-mono-tv text-[9px] text-muted-foreground/60">{WINDOW_VIEWS.length} locations</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {WINDOW_VIEWS.map((view) => (
                  <button
                    key={view.id}
                    onClick={() => setSelectedView(view)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-xl border p-2.5 transition-all duration-200",
                      selectedView.id === view.id
                        ? "border-primary/40 bg-primary/10 shadow-[0_0_12px_rgba(79,174,123,0.15)]"
                        : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10"
                    )}
                  >
                    <span className="text-xl">{view.emoji}</span>
                    <span className="text-[9px] font-mono-tv text-foreground/80 text-center leading-tight">{view.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right sidebar: ambient controls */}
          <aside className="flex flex-col gap-4">
            {/* Ambient presets */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-3">
                <Volume2 className="h-3.5 w-3.5 text-primary" />
                <span className="font-mono-tv text-[10px] uppercase tracking-widest text-muted-foreground">Ambient Presets</span>
              </div>
              <div className="space-y-1.5">
                {AMBIENT_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => applyPreset(preset.id)}
                    className={cn(
                      "w-full flex items-center gap-3 rounded-xl border p-3 text-left transition-all",
                      activePreset === preset.id
                        ? "border-primary/40 bg-primary/10"
                        : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05]"
                    )}
                  >
                    <span className="text-lg">{preset.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-foreground/90">{preset.label}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{preset.description}</div>
                    </div>
                    {activePreset === preset.id && (
                      <span className="h-2 w-2 rounded-full bg-primary animate-pulse shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick weather actions */}
            {weather && (
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Cloud className="h-3.5 w-3.5 text-cyan-400" />
                  <span className="font-mono-tv text-[10px] uppercase tracking-widest text-muted-foreground">Weather Match</span>
                </div>
                <div className="rounded-xl bg-black/20 border border-white/5 p-3">
                  <div className="flex items-center gap-3">
                    <WeatherIcon className="h-8 w-8 text-primary" />
                    <div>
                      <div className="text-sm font-semibold text-white">{weather.description}</div>
                      <div className="text-xs text-zinc-400">{weather.temp}°C outside · {weather.description.toLowerCase().includes("rain") || weather.description.toLowerCase().includes("drizzle") || weather.description.toLowerCase().includes("shower") ? "try Study Mode" : weather.description.toLowerCase().includes("snow") ? "try Cozy Fireplace" : "try Forest Morning"}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const w = WMO_TO_PRESET[weather.code];
                      if (w) applyPreset(w.preset);
                    }}
                    className="mt-3 w-full rounded-lg bg-primary/20 border border-primary/30 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/30 transition-colors"
                  >
                    Match Weather → Auto-Set Ambience
                  </button>
                </div>
              </div>
            )}

            {/* Focus timer mini */}
            <FocusTimerMini />

            {/* Keyboard shortcuts */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm">
              <div className="font-mono-tv text-[9px] uppercase tracking-widest text-muted-foreground/60 mb-2">Quick Tips</div>
              <div className="space-y-1.5 text-[10px] text-zinc-400">
                <div>🔇 Videos start muted — unmute for full immersion</div>
                <div>🌧️ Match weather for real-world ambience sync</div>
                <div>🔥 Cozy Fireplace + Rainy Window = peak cozy</div>
                <div>🧠 Deep Work preset for maximum focus</div>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

// ─── Mini Focus Timer for Places page ─────────────────────────────────────────
function FocusTimerMini() {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [preset, setPreset] = useState(25);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setRunning(false);
          return preset * 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [running, preset]);

  const format = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  const progress = 1 - timeLeft / (preset * 60);

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-3">
        <Timer className="h-3.5 w-3.5 text-amber-400" />
        <span className="font-mono-tv text-[10px] uppercase tracking-widest text-muted-foreground">Focus Timer</span>
      </div>
      <div className="flex flex-col items-center">
        <div
          className="relative flex h-28 w-28 items-center justify-center rounded-full border-4 border-white/10"
          style={{
            background: `conic-gradient(rgba(79,174,123,0.8) ${Math.round(progress * 360)}deg, rgba(255,255,255,0.05) 0deg)`,
          }}
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#0a0c10]">
            <span className="font-mono-tv text-xl font-bold tabular-nums">{format(timeLeft)}</span>
          </div>
        </div>
        <div className="mt-3 flex gap-1.5">
          {[15, 25, 45, 60].map((min) => (
            <button
              key={min}
              onClick={() => { setPreset(min); setTimeLeft(min * 60); setRunning(false); }}
              className={cn(
                "rounded-full px-2.5 py-1 text-[10px] font-mono-tv transition-all",
                preset === min ? "bg-primary/20 text-primary border border-primary/30" : "bg-white/5 text-muted-foreground border border-white/5 hover:bg-white/10"
              )}
            >
              {min}m
            </button>
          ))}
        </div>
        <button
          onClick={() => setRunning(!running)}
          className="mt-3 w-full rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-black hover:bg-primary/90 transition-colors"
        >
          {running ? "Pause" : "Start Focus"}
        </button>
      </div>
    </div>
  );
}
