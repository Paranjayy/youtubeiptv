import { useCallback, useEffect, useRef, useState } from "react";
import { CloudRain, Coffee, Keyboard, Wind, Volume2, VolumeX, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type AmbientSound = {
  id: string;
  label: string;
  icon: typeof CloudRain;
  // Web Audio API oscillator/noise config
  type: "noise" | "oscillator";
  noiseColor?: "white" | "pink" | "brown";
  frequency?: number;
  gain: number;
};

const AMBIENT_SOUNDS: AmbientSound[] = [
  {
    id: "rain",
    label: "Rain",
    icon: CloudRain,
    type: "noise",
    noiseColor: "pink",
    gain: 0.12,
  },
  {
    id: "cafe",
    label: "Cafe",
    icon: Coffee,
    type: "noise",
    noiseColor: "brown",
    gain: 0.08,
  },
  {
    id: "keyboard",
    label: "Keyboard",
    icon: Keyboard,
    type: "noise",
    noiseColor: "white",
    gain: 0.04,
  },
  {
    id: "wind",
    label: "Wind",
    icon: Wind,
    type: "noise",
    noiseColor: "brown",
    gain: 0.06,
  },
];

function createNoiseBuffer(ctx: AudioContext, color: string): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * 4; // 4 seconds loopable
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  let lastOut = 0;
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;

    if (color === "white") {
      data[i] = white * 0.5;
    } else if (color === "pink") {
      // Pink noise via Paul Kellet's algorithm
      const b0 = (lastOut + 0.02 * white) / 1.02;
      lastOut = b0;
      data[i] = b0 * 3.5;
    } else {
      // Brown noise
      const b0 = (lastOut + 0.02 * white) / 1.02;
      lastOut = b0;
      data[i] = b0 * 2.5;
    }
  }
  return buffer;
}

type AmbientEngine = {
  ctx: AudioContext | null;
  nodes: Map<string, { source: AudioBufferSourceNode; gain: GainNode; gainValue: number }>;
};

const engineRef: AmbientEngine = { ctx: null, nodes: new Map() };

function getCtx(): AudioContext {
  if (!engineRef.ctx) {
    engineRef.ctx = new AudioContext();
  }
  return engineRef.ctx;
}

export function AmbientSounds() {
  const [activeSounds, setActiveSounds] = useState<Record<string, boolean>>({});
  const [volumes, setVolumes] = useState<Record<string, number>>({});
  const [expanded, setExpanded] = useState(false);
  const [masterMuted, setMasterMuted] = useState(false);
  const masterGainRef = useRef<GainNode | null>(null);

  const toggleSound = useCallback((sound: AmbientSound) => {
    const ctx = getCtx();
    setActiveSounds((prev) => {
      const wasActive = prev[sound.id];

      if (wasActive) {
        // Stop
        const entry = engineRef.nodes.get(sound.id);
        if (entry) {
          entry.gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
          setTimeout(() => {
            try { entry.source.stop(); } catch {}
          }, 350);
          engineRef.nodes.delete(sound.id);
        }
        return { ...prev, [sound.id]: false };
      } else {
        // Start
        const buffer = createNoiseBuffer(ctx, sound.noiseColor || "white");
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        const gain = ctx.createGain();
        const vol = volumes[sound.id] ?? sound.gain;
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.5);

        // Master gain
        if (!masterGainRef.current) {
          masterGainRef.current = ctx.createGain();
          masterGainRef.current.connect(ctx.destination);
        }

        source.connect(gain);
        gain.connect(masterGainRef.current);
        source.start();

        engineRef.nodes.set(sound.id, { source, gain, gainValue: vol });
        return { ...prev, [sound.id]: true };
      }
    });
  }, [volumes]);

  const updateVolume = useCallback((soundId: string, value: number) => {
    setVolumes((prev) => ({ ...prev, [soundId]: value }));
    const entry = engineRef.nodes.get(soundId);
    if (entry) {
      const ctx = getCtx();
      entry.gain.gain.linearRampToValueAtTime(value, ctx.currentTime + 0.1);
      entry.gainValue = value;
    }
  }, []);

  const toggleMaster = useCallback(() => {
    const ctx = getCtx();
    if (!masterGainRef.current) {
      masterGainRef.current = ctx.createGain();
      masterGainRef.current.connect(ctx.destination);
    }
    if (masterMuted) {
      masterGainRef.current.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.2);
    } else {
      masterGainRef.current.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
    }
    setMasterMuted(!masterMuted);
  }, [masterMuted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      engineRef.nodes.forEach((entry) => {
        try { entry.source.stop(); } catch {}
      });
      engineRef.nodes.clear();
    };
  }, []);

  const activeCount = Object.values(activeSounds).filter(Boolean).length;

  return (
    <div className="relative">
      {/* Compact toggle button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[10px] font-mono-tv uppercase tracking-wider transition-all",
          activeCount > 0
            ? "border-primary/40 bg-primary/10 text-primary"
            : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
        )}
        title="Ambient Sounds"
      >
        {masterMuted ? (
          <VolumeX className="h-3 w-3" />
        ) : (
          <Volume2 className="h-3 w-3" />
        )}
        <span className="hidden sm:inline">Ambient</span>
        {activeCount > 0 && (
          <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
        )}
        <ChevronDown className={cn("h-2.5 w-2.5 transition-transform", expanded && "rotate-180")} />
      </button>

      {/* Expanded panel */}
      {expanded && (
        <div className="absolute top-full right-0 mt-2 w-64 rounded-2xl border border-white/10 bg-[#0a0c10]/95 backdrop-blur-xl p-3 shadow-2xl shadow-black/50 z-50 animate-scale-in">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono-tv text-[9px] uppercase tracking-widest text-muted-foreground">
              Ambient Layer
            </span>
            <button
              onClick={toggleMaster}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {masterMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
            </button>
          </div>

          <div className="space-y-1.5">
            {AMBIENT_SOUNDS.map((sound) => {
              const Icon = sound.icon;
              const isActive = activeSounds[sound.id] ?? false;
              return (
                <div key={sound.id} className="flex items-center gap-2">
                  <button
                    onClick={() => toggleSound(sound)}
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-all",
                      isActive
                        ? "border-primary/40 bg-primary/15 text-primary"
                        : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono-tv text-foreground/80">{sound.label}</span>
                      <span className="text-[9px] font-mono-tv text-muted-foreground">
                        {Math.round((volumes[sound.id] ?? sound.gain) * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="0.3"
                      step="0.01"
                      value={volumes[sound.id] ?? sound.gain}
                      onChange={(e) => updateVolume(sound.id, parseFloat(e.target.value))}
                      className="w-full h-1 appearance-none bg-white/10 rounded-full cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3 pt-2 border-t border-white/5 text-[9px] font-mono-tv text-muted-foreground text-center">
            Layer sounds for focus · Rain + Keyboard is popular
          </div>
        </div>
      )}
    </div>
  );
}
