import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Pause,
  Play,
  Plus,
  Sparkles,
  StickyNote,
  TimerReset,
  Tv,
  Layers3,
  Eraser,
} from "lucide-react";
import {
  FOCUS_NOTE_COLORS,
  FOCUS_PRESETS,
  formatFocusTime,
  makeEmptyStroke,
  makeFocusNote,
  type FocusNote,
  type FocusPresetId,
  type FocusStroke,
} from "@/lib/focus";
import { cn } from "@/lib/utils";

type FocusState = {
  presetId: FocusPresetId;
  timeLeft: number;
  running: boolean;
  sessions: number;
  notes: FocusNote[];
  strokes: FocusStroke[][];
};

const STORAGE_KEY = "tubetv:focus-room";
const DEFAULT_PRESET: FocusPresetId = "standard";

export const Route = createFileRoute("/focus")({
  head: () => ({
    meta: [
      { title: "Focus Room - TubeTV" },
      {
        name: "description",
        content:
          "Pomodoro timer, sticky notes, and a sketch canvas for study-with-me style focus sessions.",
      },
      { property: "og:title", content: "Focus Room - TubeTV" },
      {
        property: "og:description",
        content:
          "A local-first study room with timer, notes, and a doodle canvas. Collaboration comes later.",
      },
    ],
  }),
  component: FocusRoomPage,
});

function getPreset(presetId: FocusPresetId) {
  return FOCUS_PRESETS.find((preset) => preset.id === presetId) ?? FOCUS_PRESETS[1];
}

function getInitialState(): FocusState {
  const preset = getPreset(DEFAULT_PRESET);
  return {
    presetId: preset.id,
    timeLeft: preset.minutes * 60,
    running: false,
    sessions: 0,
    notes: [makeFocusNote("What am I finishing today?", FOCUS_NOTE_COLORS[0])],
    strokes: [[], [], []],
  };
}

function FocusRoomPage() {
  const [state, setState] = useState<FocusState>(getInitialState);
  const [hydrated, setHydrated] = useState(false);
  const [draftNote, setDraftNote] = useState("");
  const [activePalette, setActivePalette] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawRef = useRef({
    drawing: false,
    index: 0,
    lastX: 0,
    lastY: 0,
  });

  const preset = getPreset(state.presetId);
  const totalSeconds = preset.minutes * 60;
  const progress = 1 - state.timeLeft / totalSeconds;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<FocusState>;
        const nextPreset =
          typeof parsed.presetId === "string" ? (parsed.presetId as FocusPresetId) : DEFAULT_PRESET;
        const presetInfo = getPreset(nextPreset);
        setState({
          presetId: presetInfo.id,
          timeLeft:
            typeof parsed.timeLeft === "number" && parsed.timeLeft > 0
              ? parsed.timeLeft
              : presetInfo.minutes * 60,
          running: false,
          sessions: typeof parsed.sessions === "number" ? parsed.sessions : 0,
          notes:
            Array.isArray(parsed.notes) && parsed.notes.length > 0
              ? parsed.notes
              : [makeFocusNote("What am I finishing today?", FOCUS_NOTE_COLORS[0])],
          strokes:
            Array.isArray(parsed.strokes) && parsed.strokes.length > 0
              ? parsed.strokes
              : [[], [], []],
        });
      }
    } catch {
      // Ignore storage failures.
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage failures.
    }
  }, [hydrated, state]);

  useEffect(() => {
    if (!state.running) return;
    const timer = window.setInterval(() => {
      setState((current) => {
        if (!current.running) return current;
        if (current.timeLeft <= 1) {
          const nextPreset = getPreset(current.presetId);
          return {
            ...current,
            running: false,
            timeLeft: nextPreset.minutes * 60,
            sessions: current.sessions + 1,
          };
        }
        return { ...current, timeLeft: current.timeLeft - 1 };
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [state.running]);

  const startPause = () => {
    setState((current) => ({ ...current, running: !current.running }));
  };

  const resetTimer = () => {
    const nextPreset = getPreset(state.presetId);
    setState((current) => ({
      ...current,
      running: false,
      timeLeft: nextPreset.minutes * 60,
    }));
  };

  const selectPreset = (presetId: FocusPresetId) => {
    const nextPreset = getPreset(presetId);
    setState((current) => ({
      ...current,
      presetId,
      running: false,
      timeLeft: nextPreset.minutes * 60,
    }));
  };

  const addNote = () => {
    const text = draftNote.trim();
    if (!text) return;
    setState((current) => ({
      ...current,
      notes: [
        ...current.notes,
        makeFocusNote(text, FOCUS_NOTE_COLORS[activePalette % FOCUS_NOTE_COLORS.length]),
      ],
    }));
    setDraftNote("");
    setActivePalette((n) => n + 1);
  };

  const updateNote = (noteId: string, text: string) => {
    setState((current) => ({
      ...current,
      notes: current.notes.map((note) => (note.id === noteId ? { ...note, text } : note)),
    }));
  };

  const deleteNote = (noteId: string) => {
    setState((current) => ({
      ...current,
      notes: current.notes.filter((note) => note.id !== noteId),
    }));
  };

  const clearBoard = () => {
    setState((current) => ({ ...current, strokes: [[], [], []] }));
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const paintStroke = (strokes: FocusStroke[][]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    strokes.forEach((segmentGroup) => {
      segmentGroup.forEach((stroke) => {
        if (stroke.points.length < 2) return;
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.width;
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i += 1) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        ctx.stroke();
      });
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const pixelRatio = window.devicePixelRatio || 1;
      canvas.width = rect.width * pixelRatio;
      canvas.height = rect.height * pixelRatio;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      }
      paintStroke(state.strokes);
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [state.strokes]);

  const beginDraw = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const stroke = makeEmptyStroke(preset.accent, 4);
    stroke.points.push({ x, y });
    const nextIndex = state.strokes.length;
    drawRef.current = { drawing: true, index: nextIndex, lastX: x, lastY: y };
    setState((current) => ({
      ...current,
      strokes: [...current.strokes, [stroke]],
    }));
  };

  const moveDraw = (clientX: number, clientY: number) => {
    if (!drawRef.current.drawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const idx = drawRef.current.index;

    setState((current) => {
      const nextStrokes = current.strokes.map((group, groupIndex) =>
        groupIndex === idx
          ? group.map((stroke, strokeIndex) =>
              strokeIndex === group.length - 1
                ? { ...stroke, points: [...stroke.points, { x, y }] }
                : stroke,
            )
          : group,
      );
      paintStroke(nextStrokes);
      return { ...current, strokes: nextStrokes };
    });

    drawRef.current.lastX = x;
    drawRef.current.lastY = y;
  };

  const endDraw = () => {
    drawRef.current.drawing = false;
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(255,191,92,0.18),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(88,166,255,0.12),_transparent_24%),linear-gradient(180deg,_#0f1114_0%,_#141014_100%)] text-zinc-50">
      <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:44px_44px]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="font-mono-tv text-[10px] uppercase tracking-[0.45em] text-amber-200/80">
              Focus Room
            </div>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-white sm:text-5xl">
              Study-with-me, but local-first.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-300 sm:text-base">
              Pomodoro timer, sticky notes, and a sketch board for prep-mode focus. Sharing faces
              and live co-presence can come later when auth/db makes sense.
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
              <Layers3 className="h-4 w-4" /> Play
            </Link>
          </div>
        </header>

        <section className="mt-4 grid gap-4 lg:grid-cols-[0.95fr_1.1fr_1fr]">
          <article className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5 shadow-2xl shadow-black/30 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-mono-tv text-[10px] uppercase tracking-[0.35em] text-zinc-400">
                  Timer
                </div>
                <div className="mt-2 text-xl font-bold tracking-tight">Pomodoro engine</div>
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono-tv text-[10px] uppercase tracking-widest text-zinc-300">
                {hydrated ? "saved" : "loading"}
              </div>
            </div>

            <div className="mt-5 rounded-[1.75rem] border border-white/10 bg-black/20 p-5 text-center">
              <div
                className="mx-auto flex h-40 w-40 items-center justify-center rounded-full border-8 border-white/10"
                style={{
                  background: `conic-gradient(${preset.accent} ${Math.round(progress * 360)}deg, rgba(255,255,255,0.08) 0deg)`,
                }}
              >
                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-[#111315]">
                  <div>
                    <div className="font-mono-tv text-[10px] uppercase tracking-[0.35em] text-zinc-400">
                      {preset.label}
                    </div>
                    <div className="mt-2 text-4xl font-black tracking-tight">
                      {formatFocusTime(state.timeLeft)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-center gap-2">
                <button
                  onClick={startPause}
                  className="inline-flex items-center gap-2 rounded-full bg-amber-200 px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-amber-100"
                >
                  {state.running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {state.running ? "Pause" : "Start"}
                </button>
                <button
                  onClick={resetTimer}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-100 transition-colors hover:bg-white/10"
                >
                  <TimerReset className="h-4 w-4" />
                  Reset
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                {FOCUS_PRESETS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => selectPreset(option.id)}
                    className={cn(
                      "rounded-2xl border p-3 text-left transition-colors",
                      state.presetId === option.id
                        ? "border-white/20 bg-white/10"
                        : "border-white/10 bg-white/5 hover:bg-white/10",
                    )}
                  >
                    <div className="text-sm font-semibold tracking-tight">{option.label}</div>
                    <div className="mt-1 text-xs text-zinc-400">
                      {option.minutes} / {option.breakMinutes}
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm leading-6 text-zinc-300">
                <span className="font-semibold text-white">Mode:</span> {preset.blurb}
              </div>
            </div>
          </article>

          <article className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5 shadow-2xl shadow-black/30 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 font-mono-tv text-[10px] uppercase tracking-[0.35em] text-zinc-400">
                  <StickyNote className="h-3.5 w-3.5" />
                  Notes
                </div>
                <div className="mt-2 text-xl font-bold tracking-tight">Sticky stack</div>
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono-tv text-[10px] uppercase tracking-widest text-zinc-300">
                {state.notes.length}
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <input
                value={draftNote}
                onChange={(e) => setDraftNote(e.target.value)}
                placeholder="Jot the next move..."
                className="flex-1 rounded-full border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-200/20"
              />
              <button
                onClick={addNote}
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-200"
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {state.notes.map((note) => (
                <div
                  key={note.id}
                  className="rounded-[1.5rem] border border-black/10 p-4 shadow-sm"
                  style={{ backgroundColor: note.color }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-mono-tv text-[10px] uppercase tracking-[0.35em] text-zinc-500">
                      Sticky
                    </div>
                    <button
                      onClick={() => deleteNote(note.id)}
                      className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-600 hover:text-zinc-900"
                    >
                      remove
                    </button>
                  </div>
                  <textarea
                    value={note.text}
                    onChange={(e) => updateNote(note.id, e.target.value)}
                    rows={4}
                    className="mt-2 w-full resize-none bg-transparent text-sm leading-6 text-zinc-950 outline-none placeholder:text-zinc-500"
                  />
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5 shadow-2xl shadow-black/30 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-mono-tv text-[10px] uppercase tracking-[0.35em] text-zinc-400">
                  Canvas
                </div>
                <div className="mt-2 text-xl font-bold tracking-tight">Quick sketch board</div>
              </div>
              <button
                onClick={clearBoard}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-zinc-100 transition-colors hover:bg-white/10"
              >
                <Eraser className="h-4 w-4" />
                Clear
              </button>
            </div>

            <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-[#0b0d10] p-3">
              <canvas
                ref={canvasRef}
                width={800}
                height={900}
                className="h-[34rem] w-full rounded-[1rem] bg-[radial-gradient(circle_at_top_left,_rgba(255,191,92,0.08),_transparent_28%),linear-gradient(180deg,_rgba(255,255,255,0.03),_rgba(255,255,255,0.01))] touch-none"
                onPointerDown={(e) => {
                  (e.currentTarget as HTMLCanvasElement).setPointerCapture(e.pointerId);
                  beginDraw(e.clientX, e.clientY);
                }}
                onPointerMove={(e) => moveDraw(e.clientX, e.clientY)}
                onPointerUp={endDraw}
                onPointerLeave={endDraw}
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <div className="font-mono-tv text-[10px] uppercase tracking-[0.35em] text-zinc-400">
                Palette
              </div>
              {FOCUS_NOTE_COLORS.map((color, index) => (
                <button
                  key={color}
                  onClick={() => setActivePalette(index)}
                  className={cn(
                    "h-8 w-8 rounded-full border-2 transition-transform hover:scale-105",
                    activePalette % FOCUS_NOTE_COLORS.length === index
                      ? "border-white"
                      : "border-white/20",
                  )}
                  style={{ backgroundColor: color }}
                  aria-label={`Set note color ${index + 1}`}
                />
              ))}
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-zinc-300">
              <div className="font-semibold text-white">Future collab lane</div>
              Share links with faces, live co-study presence, and room invites are parked for later.
              That part wants auth, presence, and some backend state so it stays crisp.
            </div>
          </article>
        </section>

        <section className="mt-4 grid gap-3 lg:grid-cols-3">
          {[
            { label: "Sessions", value: state.sessions.toString(), sub: "completed cycles" },
            { label: "Focus", value: state.running ? "Live" : "Idle", sub: "current status" },
            {
              label: "Next",
              value: getPreset(state.presetId).breakMinutes.toString(),
              sub: "minute break",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-[1.5rem] border border-white/10 bg-white/[0.05] px-4 py-4 backdrop-blur-sm"
            >
              <div className="font-mono-tv text-[10px] uppercase tracking-[0.35em] text-zinc-400">
                {item.label}
              </div>
              <div className="mt-2 text-2xl font-black tracking-tight">{item.value}</div>
              <div className="mt-1 text-sm text-zinc-400">{item.sub}</div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
