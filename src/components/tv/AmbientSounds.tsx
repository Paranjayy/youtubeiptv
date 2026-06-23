import { useCallback, useEffect, useRef, useState } from "react";
import {
  CloudRain, Coffee, Keyboard, Wind, Volume2, VolumeX, ChevronDown,
  Flame, Waves, Bird, CloudLightning, Type, TreePine,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type AmbientSound = {
  id: string;
  label: string;
  icon: typeof CloudRain;
  type: "noise" | "oscillator" | "hythmic";
  noiseColor?: "white" | "pink" | "brown";
  frequency?: number;
  gain: number;
  description?: string;
};

export const AMBIENT_SOUNDS: AmbientSound[] = [
  {
    id: "rain",
    label: "Rain",
    icon: CloudRain,
    type: "noise",
    noiseColor: "pink",
    gain: 0.12,
    description: "steady rainfall",
  },
  {
    id: "heavy-rain",
    label: "Heavy Rain",
    icon: CloudRain,
    type: "noise",
    noiseColor: "brown",
    gain: 0.18,
    description: "downpour & thunder",
  },
  {
    id: "thunder",
    label: "Thunder",
    icon: CloudLightning,
    type: "hythmic",
    gain: 0.06,
    description: "distant rumbling",
  },
  {
    id: "ocean",
    label: "Ocean Waves",
    icon: Waves,
    type: "hythmic",
    gain: 0.1,
    description: "shoreline waves",
  },
  {
    id: "fire",
    label: "Fireplace",
    icon: Flame,
    type: "hythmic",
    gain: 0.08,
    description: "crackling fire",
  },
  {
    id: "cafe",
    label: "Cafe",
    icon: Coffee,
    type: "noise",
    noiseColor: "brown",
    gain: 0.07,
    description: "murmur & clatter",
  },
  {
    id: "keyboard",
    label: "Keyboard",
    icon: Keyboard,
    type: "hythmic",
    gain: 0.03,
    description: "mechanical typing",
  },
  {
    id: "wind",
    label: "Wind",
    icon: Wind,
    type: "noise",
    noiseColor: "brown",
    gain: 0.06,
    description: "gentle breeze",
  },
  {
    id: "birds",
    label: "Birds",
    icon: Bird,
    type: "hythmic",
    gain: 0.04,
    description: "morning chirping",
  },
  {
    id: "forest",
    label: "Forest",
    icon: TreePine,
    type: "noise",
    noiseColor: "pink",
    gain: 0.05,
    description: "deep woods ambience",
  },
  {
    id: "whitenoise",
    label: "White Noise",
    icon: Type,
    type: "noise",
    noiseColor: "white",
    gain: 0.04,
    description: "pure static",
  },
];

function createNoiseBuffer(ctx: AudioContext, color: string): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * 4;
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  let lastOut = 0;
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;

    if (color === "white") {
      data[i] = white * 0.5;
    } else if (color === "pink") {
      const b0 = (lastOut + 0.02 * white) / 1.02;
      lastOut = b0;
      data[i] = b0 * 3.5;
    } else {
      const b0 = (lastOut + 0.02 * white) / 1.02;
      lastOut = b0;
      data[i] = b0 * 2.5;
    }
  }
  return buffer;
}

// Rhythmic sound generators using oscillators + noise modulation
function createRhythmicNode(ctx: AudioContext, soundId: string, masterGain: GainNode): { source: GainNode; cleanup: () => void } {
  const outputGain = ctx.createGain();
  outputGain.gain.value = 0;
  outputGain.connect(masterGain);

  const nodes: AudioNode[] = [outputGain];

  if (soundId === "fire") {
    // Fire: brown noise modulated by slow random gain + crackle pops
    const buf = createNoiseBuffer(ctx, "brown");
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const fireGain = ctx.createGain();
    fireGain.gain.value = 0.8;
    src.connect(fireGain);
    fireGain.connect(outputGain);
    src.start();
    nodes.push(src, fireGain);

    // Crackle: random white noise bursts
    const crackle = () => {
      if (outputGain.context.state === "closed") return;
      const popBuf = ctx.createBuffer(1, ctx.sampleRate * 0.02, ctx.sampleRate);
      const popData = popBuf.getChannelData(0);
      for (let i = 0; i < popData.length; i++) popData[i] = (Math.random() * 2 - 1) * 0.3;
      const popSrc = ctx.createBufferSource();
      popSrc.buffer = popBuf;
      const popGain = ctx.createGain();
      popGain.gain.setValueAtTime(0.15, ctx.currentTime);
      popGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      popSrc.connect(popGain);
      popGain.connect(outputGain);
      popSrc.start();
      setTimeout(crackle, 200 + Math.random() * 800);
    };
    setTimeout(crackle, 300);

  } else if (soundId === "ocean") {
    // Ocean: brown noise with slow LFO volume modulation
    const buf = createNoiseBuffer(ctx, "brown");
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.08; // very slow wave
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.5;
    lfo.connect(lfoGain);
    const wetGain = ctx.createGain();
    wetGain.gain.value = 0.6;
    lfoGain.connect(wetGain.gain);
    src.connect(wetGain);
    wetGain.connect(outputGain);
    lfo.start();
    src.start();
    nodes.push(src, lfo, lfoGain, wetGain);

  } else if (soundId === "thunder") {
    // Thunder: random brown noise bursts
    const rumble = () => {
      if (outputGain.context.state === "closed") return;
      const len = 1 + Math.random() * 2;
      const buf = createNoiseBuffer(ctx, "brown");
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const env = ctx.createGain();
      env.gain.setValueAtTime(0, ctx.currentTime);
      env.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.3);
      env.gain.linearRampToValueAtTime(0.2, ctx.currentTime + len * 0.5);
      env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + len);
      src.connect(env);
      env.connect(outputGain);
      src.start();
      src.stop(ctx.currentTime + len);
      setTimeout(rumble, 4000 + Math.random() * 12000);
    };
    setTimeout(rumble, 1000);

  } else if (soundId === "keyboard") {
    // Keyboard: random click bursts
    const click = () => {
      if (outputGain.context.state === "closed") return;
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.01, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.2;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.3, ctx.currentTime);
      env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.015);
      src.connect(env);
      env.connect(outputGain);
      src.start();
      // Burst of 2-5 keystrokes
      const burst = 2 + Math.floor(Math.random() * 4);
      for (let i = 1; i < burst; i++) {
        setTimeout(() => {
          try {
            const b2 = ctx.createBuffer(1, ctx.sampleRate * 0.008, ctx.sampleRate);
            const d2 = b2.getChannelData(0);
            for (let j = 0; j < d2.length; j++) d2[j] = (Math.random() * 2 - 1) * 0.15;
            const s2 = ctx.createBufferSource();
            s2.buffer = b2;
            const e2 = ctx.createGain();
            e2.gain.setValueAtTime(0.2, ctx.currentTime);
            e2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.012);
            s2.connect(e2);
            e2.connect(outputGain);
            s2.start();
          } catch {}
        }, i * (30 + Math.random() * 60));
      }
      setTimeout(click, 80 + Math.random() * 300);
    };
    setTimeout(click, 200);

  } else if (soundId === "birds") {
    // Birds: random chirp oscillators
    const chirp = () => {
      if (outputGain.context.state === "closed") return;
      const osc = ctx.createOscillator();
      osc.type = "sine";
      const baseFreq = 2000 + Math.random() * 2000;
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(baseFreq + 500, ctx.currentTime + 0.05);
      osc.frequency.linearRampToValueAtTime(baseFreq - 200, ctx.currentTime + 0.1);
      const env = ctx.createGain();
      env.gain.setValueAtTime(0, ctx.currentTime);
      env.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.02);
      env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(env);
      env.connect(outputGain);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
      setTimeout(chirp, 300 + Math.random() * 2000);
    };
    setTimeout(chirp, 500);
  }

  return {
    source: outputGain,
    cleanup: () => {
      nodes.forEach((n) => {
        try { if ("stop" in n) (n as AudioBufferSourceNode).stop(); } catch {}
        try { n.disconnect(); } catch {}
      });
    },
  };
}

type AmbientEngine = {
  ctx: AudioContext | null;
  nodes: Map<string, { gain: GainNode; gainValue: number; cleanup?: () => void }>;
};

const engineRef: AmbientEngine = { ctx: null, nodes: new Map() };

function getCtx(): AudioContext {
  if (!engineRef.ctx) {
    engineRef.ctx = new AudioContext();
  }
  return engineRef.ctx;
}

// ─── Presets ──────────────────────────────────────────────────────────────────
export type AmbientPreset = {
  id: string;
  label: string;
  emoji: string;
  description: string;
  sounds: { id: string; volume: number }[];
};

export const AMBIENT_PRESETS: AmbientPreset[] = [
  {
    id: "study",
    label: "Study Mode",
    emoji: "📚",
    description: "Rain + keyboard + cafe murmur",
    sounds: [
      { id: "rain", volume: 0.1 },
      { id: "keyboard", volume: 0.03 },
      { id: "cafe", volume: 0.04 },
    ],
  },
  {
    id: "sleep",
    label: "Sleep Mode",
    emoji: "🌙",
    description: "Gentle rain + distant thunder",
    sounds: [
      { id: "rain", volume: 0.08 },
      { id: "thunder", volume: 0.03 },
      { id: "wind", volume: 0.03 },
    ],
  },
  {
    id: "cozy",
    label: "Cozy Fireplace",
    emoji: "🔥",
    description: "Crackling fire + rain on windows",
    sounds: [
      { id: "fire", volume: 0.1 },
      { id: "rain", volume: 0.05 },
    ],
  },
  {
    id: "nature",
    label: "Forest Morning",
    emoji: "🌲",
    description: "Birds + wind through trees",
    sounds: [
      { id: "birds", volume: 0.05 },
      { id: "forest", volume: 0.06 },
      { id: "wind", volume: 0.03 },
    ],
  },
  {
    id: "deep-work",
    label: "Deep Work",
    emoji: "🧠",
    description: "White noise + keyboard",
    sounds: [
      { id: "whitenoise", volume: 0.04 },
      { id: "keyboard", volume: 0.02 },
    ],
  },
  {
    id: "ocean",
    label: "Beach Vibes",
    emoji: "🏖️",
    description: "Waves + gentle breeze",
    sounds: [
      { id: "ocean", volume: 0.12 },
      { id: "wind", volume: 0.03 },
      { id: "birds", volume: 0.02 },
    ],
  },
  {
    id: "storm",
    label: "Thunderstorm",
    emoji: "⛈️",
    description: "Heavy rain + thunder + wind",
    sounds: [
      { id: "heavy-rain", volume: 0.15 },
      { id: "thunder", volume: 0.06 },
      { id: "wind", volume: 0.05 },
    ],
  },
  {
    id: "cyberpunk",
    label: "Cyberpunk Night",
    emoji: "🌃",
    description: "Rain + thunder + distant cafe",
    sounds: [
      { id: "rain", volume: 0.08 },
      { id: "thunder", volume: 0.03 },
      { id: "cafe", volume: 0.03 },
    ],
  },
];

// ─── Exported engine control for Places page ──────────────────────────────────
export function getAmbientEngine() {
  return {
    toggle(soundId: string, volume?: number) {
      const ctx = getCtx();
      const sound = AMBIENT_SOUNDS.find((s) => s.id === soundId);
      if (!sound) return;

      const existing = engineRef.nodes.get(soundId);
      if (existing) {
        // Stop
        existing.gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
        const cleanup = existing.cleanup;
        setTimeout(() => {
          cleanup?.();
          engineRef.nodes.delete(soundId);
        }, 350);
        return false;
      } else {
        // Start
        if (!engineRef.ctx) getCtx();
        const master = ctx.createGain();
        master.gain.value = 1;
        master.connect(ctx.destination);

        const vol = volume ?? sound.gain;

        if (sound.type === "noise") {
          const buf = createNoiseBuffer(ctx, sound.noiseColor || "white");
          const src = ctx.createBufferSource();
          src.buffer = buf;
          src.loop = true;
          const gain = ctx.createGain();
          gain.gain.setValueAtTime(0, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.5);
          src.connect(gain);
          gain.connect(master);
          src.start();
          engineRef.nodes.set(soundId, { gain, gainValue: vol, cleanup: () => { try { src.stop(); } catch {} } });
        } else {
          const { source: out, cleanup } = createRhythmicNode(ctx, soundId, master);
          out.gain.setValueAtTime(0, ctx.currentTime);
          out.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.5);
          engineRef.nodes.set(soundId, { gain: out, gainValue: vol, cleanup });
        }
        return true;
      }
    },
    setVolume(soundId: string, value: number) {
      const entry = engineRef.nodes.get(soundId);
      if (entry) {
        const ctx = getCtx();
        entry.gain.gain.linearRampToValueAtTime(value, ctx.currentTime + 0.1);
        entry.gainValue = value;
      }
    },
    isActive(soundId: string) {
      return engineRef.nodes.has(soundId);
    },
    getActiveSounds() {
      return Array.from(engineRef.nodes.keys());
    },
    stopAll() {
      const ctx = getCtx();
      engineRef.nodes.forEach((entry, id) => {
        entry.gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
        const cleanup = entry.cleanup;
        setTimeout(() => {
          cleanup?.();
          engineRef.nodes.delete(id);
        }, 350);
      });
    },
    applyPreset(presetId: string) {
      const preset = AMBIENT_PRESETS.find((p) => p.id === presetId);
      if (!preset) return;
      // Stop all first
      const ctx = getCtx();
      engineRef.nodes.forEach((entry, id) => {
        entry.gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
        const cleanup = entry.cleanup;
        setTimeout(() => {
          cleanup?.();
          engineRef.nodes.delete(id);
        }, 250);
      });
      // Start preset sounds after brief delay
      setTimeout(() => {
        preset.sounds.forEach(({ id, volume }) => {
          const sound = AMBIENT_SOUNDS.find((s) => s.id === id);
          if (!sound) return;
          if (sound.type === "noise") {
            const buf = createNoiseBuffer(ctx, sound.noiseColor || "white");
            const src = ctx.createBufferSource();
            src.buffer = buf;
            src.loop = true;
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.5);
            const master = ctx.createGain();
            master.gain.value = 1;
            master.connect(ctx.destination);
            src.connect(gain);
            gain.connect(master);
            src.start();
            engineRef.nodes.set(id, { gain, gainValue: volume, cleanup: () => { try { src.stop(); } catch {} } });
          } else {
            const master = ctx.createGain();
            master.gain.value = 1;
            master.connect(ctx.destination);
            const { source: out, cleanup } = createRhythmicNode(ctx, id, master);
            out.gain.setValueAtTime(0, ctx.currentTime);
            out.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.5);
            engineRef.nodes.set(id, { gain: out, gainValue: volume, cleanup });
          }
        });
      }, 300);
    },
  };
}

// ─── UI Component ─────────────────────────────────────────────────────────────
export function AmbientSounds() {
  const [activeSounds, setActiveSounds] = useState<Record<string, boolean>>({});
  const [volumes, setVolumes] = useState<Record<string, number>>({});
  const [expanded, setExpanded] = useState(false);
  const [masterMuted, setMasterMuted] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const engine = useRef(getAmbientEngine());

  const toggleSound = useCallback((sound: AmbientSound) => {
    const result = engine.current.toggle(sound.id, volumes[sound.id]);
    setActiveSounds((prev) => ({ ...prev, [sound.id]: !!result }));
    setActivePreset(null);
  }, [volumes]);

  const updateVolume = useCallback((soundId: string, value: number) => {
    setVolumes((prev) => ({ ...prev, [soundId]: value }));
    engine.current.setVolume(soundId, value);
  }, []);

  const applyPreset = useCallback((presetId: string) => {
    engine.current.applyPreset(presetId);
    const preset = AMBIENT_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      const next: Record<string, boolean> = {};
      const nextVol: Record<string, number> = {};
      AMBIENT_SOUNDS.forEach((s) => { next[s.id] = false; });
      preset.sounds.forEach(({ id, volume }) => {
        next[id] = true;
        nextVol[id] = volume;
      });
      setActiveSounds(next);
      setVolumes((prev) => ({ ...prev, ...nextVol }));
      setActivePreset(presetId);
    }
  }, []);

  const toggleMaster = useCallback(() => {
    if (masterMuted) {
      engine.current.getActiveSounds().forEach((id) => {
        const entry = engineRef.nodes.get(id);
        if (entry) {
          const ctx = getCtx();
          entry.gain.gain.linearRampToValueAtTime(entry.gainValue, ctx.currentTime + 0.2);
        }
      });
    } else {
      const ctx = getCtx();
      engineRef.nodes.forEach((entry) => {
        entry.gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
      });
    }
    setMasterMuted(!masterMuted);
  }, [masterMuted]);

  useEffect(() => {
    return () => {
      engine.current.stopAll();
    };
  }, []);

  const activeCount = Object.values(activeSounds).filter(Boolean).length;

  return (
    <div className="relative">
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

      {expanded && (
        <div className="absolute top-full right-0 mt-2 w-72 rounded-2xl border border-white/10 bg-[#0a0c10]/95 backdrop-blur-xl p-3 shadow-2xl shadow-black/50 z-50 animate-scale-in max-h-[80vh] overflow-y-auto">
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

          {/* Presets */}
          <div className="mb-3">
            <div className="font-mono-tv text-[8px] uppercase tracking-widest text-muted-foreground/60 mb-1.5">Quick Presets</div>
            <div className="grid grid-cols-2 gap-1">
              {AMBIENT_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset.id)}
                  className={cn(
                    "rounded-lg border px-2 py-1.5 text-left transition-all text-[10px]",
                    activePreset === preset.id
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-white/5 bg-white/[0.02] text-foreground/70 hover:bg-white/[0.05]"
                  )}
                >
                  <span className="text-xs">{preset.emoji}</span>{" "}
                  <span className="font-semibold">{preset.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Individual sounds */}
          <div className="border-t border-white/5 pt-2">
            <div className="font-mono-tv text-[8px] uppercase tracking-widest text-muted-foreground/60 mb-1.5">Individual Sounds</div>
            <div className="space-y-1">
              {AMBIENT_SOUNDS.map((sound) => {
                const Icon = sound.icon;
                const isActive = activeSounds[sound.id] ?? false;
                return (
                  <div key={sound.id} className="flex items-center gap-2">
                    <button
                      onClick={() => toggleSound(sound)}
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition-all",
                        isActive
                          ? "border-primary/40 bg-primary/15 text-primary"
                          : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10"
                      )}
                    >
                      <Icon className="h-3 w-3" />
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
          </div>

          <div className="mt-3 pt-2 border-t border-white/5 text-[9px] font-mono-tv text-muted-foreground text-center">
            Layer sounds for focus · Try presets for instant vibes
          </div>
        </div>
      )}
    </div>
  );
}
