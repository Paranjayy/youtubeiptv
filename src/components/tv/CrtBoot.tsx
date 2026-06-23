import { useEffect, useState } from "react";

type CrtBootProps = {
  onComplete: () => void;
};

export function CrtBoot({ onComplete }: CrtBootProps) {
  const [phase, setPhase] = useState<"black" | "warmup" | "static" | "logo" | "fadeout">("black");

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Phase 1: Pure black (power off state)
    timers.push(setTimeout(() => setPhase("warmup"), 300));

    // Phase 2: CRT warmup - horizontal line expands
    timers.push(setTimeout(() => setPhase("static"), 900));

    // Phase 3: Static burst
    timers.push(setTimeout(() => setPhase("logo"), 1300));

    // Phase 4: Logo reveal
    timers.push(setTimeout(() => setPhase("fadeout"), 2400));

    // Phase 5: Fade out and hand off
    timers.push(setTimeout(() => onComplete(), 2900));

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
      style={{ background: "#000" }}
    >
      {/* CRT scanlines overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-50"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to bottom, transparent 0, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 3px)",
        }}
      />

      {/* Vignette */}
      <div
        className="pointer-events-none absolute inset-0 z-40"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.7) 100%)",
        }}
      />

      {/* Phase: warmup - horizontal line */}
      {phase === "warmup" && (
        <div className="absolute inset-0 flex items-center justify-center z-30">
          <div
            className="h-[2px] bg-white/90"
            style={{
              width: "0%",
              animation: "crt-line-expand 0.6s ease-out forwards",
              boxShadow:
                "0 0 20px rgba(255,255,255,0.8), 0 0 60px rgba(255,255,255,0.3)",
            }}
          />
        </div>
      )}

      {/* Phase: static burst */}
      {phase === "static" && (
        <div className="absolute inset-0 z-20 overflow-hidden">
          <div
            className="h-full w-full"
            style={{
              backgroundImage:
                "repeating-conic-gradient(rgba(255,255,255,0.85) 0 0.5deg, #000 0.5deg 1deg)",
              backgroundSize: "3px 3px",
              animation: "static-shift 0.08s steps(4) infinite, static-fade 0.4s ease-out forwards",
              mixBlendMode: "screen",
            }}
          />
        </div>
      )}

      {/* Phase: logo */}
      {(phase === "logo" || phase === "fadeout") && (
        <div
          className="relative z-30 flex flex-col items-center gap-4"
          style={{
            animation: phase === "logo" ? "boot-logo-in 0.5s ease-out" : "boot-logo-out 0.5s ease-in forwards",
          }}
        >
          {/* TubeTV Logo */}
          <div className="relative">
            <div
              className="text-6xl font-black tracking-[-0.04em] sm:text-8xl"
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                color: "#fff",
                textShadow:
                  "0 0 10px rgba(79,174,123,0.8), 0 0 30px rgba(79,174,123,0.4), 0 0 60px rgba(79,174,123,0.2)",
              }}
            >
              Tube
              <span
                style={{
                  color: "var(--neon-green, oklch(0.82 0.18 152))",
                  textShadow:
                    "0 0 12px oklch(0.82 0.18 152 / 0.9), 0 0 40px oklch(0.82 0.18 152 / 0.5), 0 0 80px oklch(0.82 0.18 152 / 0.2)",
                }}
              >
                TV
              </span>
            </div>
            {/* Flicker line under logo */}
            <div
              className="mt-3 h-[1px] mx-auto"
              style={{
                width: "60%",
                background:
                  "linear-gradient(90deg, transparent, oklch(0.82 0.18 152 / 0.6), oklch(0.86 0.16 72 / 0.5), transparent)",
                animation: "boot-line-flicker 0.3s ease-in-out 2",
              }}
            />
          </div>

          {/* Tagline */}
          <div
            className="text-[10px] uppercase tracking-[0.5em] sm:text-xs"
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              color: "oklch(0.765 0.008 95 / 0.6)",
              animation: "boot-tagline-in 0.4s ease-out 0.2s both",
            }}
          >
            broadcast desk
          </div>

          {/* Channel number flash */}
          <div
            className="mt-2 text-4xl font-bold tabular-nums"
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              color: "oklch(0.82 0.18 152 / 0.9)",
              textShadow: "0 0 20px oklch(0.82 0.18 152 / 0.6)",
              animation: "boot-channel-flash 0.15s steps(1) 4",
            }}
          >
            CH 01
          </div>
        </div>
      )}

      {/* Inject keyframes */}
      <style>{`
        @keyframes crt-line-expand {
          0% { width: 0%; opacity: 1; }
          60% { width: 80%; opacity: 1; }
          100% { width: 100%; opacity: 0; }
        }
        @keyframes static-shift {
          0% { background-position: 0 0; }
          25% { background-position: 2px 1px; }
          50% { background-position: -1px 2px; }
          75% { background-position: 1px -2px; }
          100% { background-position: 0 0; }
        }
        @keyframes static-fade {
          0% { opacity: 0.9; }
          60% { opacity: 0.7; }
          100% { opacity: 0; }
        }
        @keyframes boot-logo-in {
          0% { opacity: 0; transform: scale(0.8); filter: brightness(3); }
          50% { opacity: 1; transform: scale(1.02); filter: brightness(1.5); }
          100% { opacity: 1; transform: scale(1); filter: brightness(1); }
        }
        @keyframes boot-logo-out {
          0% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.05); filter: brightness(2); }
        }
        @keyframes boot-line-flicker {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        @keyframes boot-tagline-in {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes boot-channel-flash {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
