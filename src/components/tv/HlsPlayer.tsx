import { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import { cn } from "@/lib/utils";
import { Play, Pause, Maximize, Minimize, Subtitles, Volume2, VolumeX } from "lucide-react";

type SubtitleTrack = {
  label: string;
  src: string;
  srclang: string;
};

type Props = {
  src: string;
  muted?: boolean;
  onError?: (msg: string) => void;
  onReady?: () => void;
  subtitles?: SubtitleTrack[];
};

/**
 * Enhanced HLS player with subtitle support, custom controls overlay,
 * and robust error recovery.
 */
export function HlsPlayer({ src, muted: initialMuted, onError, onReady, subtitles }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(initialMuted ?? true);
  const [showSubs, setShowSubs] = useState(false);
  const [subTrackIdx, setSubTrackIdx] = useState(-1);
  const [showControls, setShowControls] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setShowControls(false), 3500);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let hls: Hls | null = null;

    const handleReady = () => {
      onReady?.();
      setPlaying(true);
      video.play().catch(() => {
        video.muted = true;
        video.play().catch(() => {});
      });
    };

    if (Hls.isSupported() && !src.endsWith(".mp4")) {
      hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, handleReady);
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) {
          onError?.(`Stream error: ${data.type}`);
          // Try to recover
          if (hls && data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            hls.startLoad();
          }
        }
      });
      hlsRef.current = hls;
    } else {
      video.src = src;
      video.addEventListener("loadedmetadata", handleReady, { once: true });
      video.addEventListener("error", () => onError?.("Cannot play stream"), { once: true });
    }

    return () => {
      try {
        hls?.destroy();
      } catch {
        /* ignore */
      }
      video.removeAttribute("src");
      video.load();
    };
  }, [src, onError, onReady]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted]);

  // Subtitle tracks
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !subtitles?.length) return;
    // Remove old tracks
    while (video.textTracks.length > 0) {
      const track = video.textTracks[0];
      track.mode = "disabled";
    }
    subtitles.forEach((sub, i) => {
      const track = document.createElement("track");
      track.kind = "subtitles";
      track.label = sub.label;
      track.srclang = sub.srclang;
      track.src = sub.src;
      if (i === subTrackIdx) track.default = true;
      video.appendChild(track);
    });
  }, [subtitles, subTrackIdx]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
      setPlaying(true);
    } else {
      video.pause();
      setPlaying(false);
    }
    showControlsTemporarily();
  }, [showControlsTemporarily]);

  const toggleMute = useCallback(() => {
    setMuted((m) => !m);
    showControlsTemporarily();
  }, [showControlsTemporarily]);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
      setIsFullscreen(false);
    } else {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    }
    showControlsTemporarily();
  }, [showControlsTemporarily]);

  const cycleSubtitles = useCallback(() => {
    if (!subtitles?.length) return;
    setSubTrackIdx((prev) => {
      const next = ((prev + 1) % (subtitles.length + 1)) - 1; // -1 = off
      // Toggle text tracks
      const video = videoRef.current;
      if (video) {
        for (let i = 0; i < video.textTracks.length; i++) {
          video.textTracks[i].mode = i === next ? "showing" : "disabled";
        }
      }
      setShowSubs(next >= 0);
      return next;
    });
    showControlsTemporarily();
  }, [subtitles, showControlsTemporarily]);

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full bg-black group"
      onMouseMove={showControlsTemporarily}
      onTouchStart={showControlsTemporarily}
    >
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full bg-black"
        autoPlay
        playsInline
        muted={muted}
        onClick={togglePlay}
      />

      {/* Subtitle overlay for external .vtt tracks */}
      {subtitles && showSubs && (
        <div className="absolute bottom-16 left-0 right-0 flex justify-center pointer-events-none">
          <track kind="subtitles" srcLang="en" />
        </div>
      )}

      {/* Controls overlay */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-3 sm:p-4 transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0 group-hover:opacity-100",
        )}
      >
        <div className="flex items-center justify-between">
          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            className="flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1.5 text-[10px] font-mono-tv text-white hover:bg-white/20 transition-colors min-h-[32px]"
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </button>

          <div className="flex items-center gap-1.5">
            {/* Subtitles toggle */}
            {subtitles && subtitles.length > 0 && (
              <button
                onClick={cycleSubtitles}
                className={cn(
                  "rounded-lg px-2.5 py-1.5 text-[10px] font-mono-tv transition-colors min-h-[32px]",
                  showSubs
                    ? "bg-primary/20 text-primary"
                    : "bg-white/10 text-white hover:bg-white/20",
                )}
                title={showSubs ? "Disable subtitles" : "Enable subtitles"}
              >
                <Subtitles className="h-3.5 w-3.5" />
              </button>
            )}

            {/* Mute */}
            <button
              onClick={toggleMute}
              className="rounded-lg bg-white/10 px-2.5 py-1.5 text-[10px] font-mono-tv text-white hover:bg-white/20 transition-colors min-h-[32px]"
              title={muted ? "Unmute" : "Mute"}
            >
              {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
            </button>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="rounded-lg bg-white/10 px-2.5 py-1.5 text-[10px] font-mono-tv text-white hover:bg-white/20 transition-colors min-h-[32px]"
            >
              {isFullscreen ? (
                <Minimize className="h-3.5 w-3.5" />
              ) : (
                <Maximize className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
