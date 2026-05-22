import { useEffect, useRef } from "react";
import Hls from "hls.js";

type Props = {
  src: string;
  muted?: boolean;
  onError?: (msg: string) => void;
  onReady?: () => void;
};

export function HlsPlayer({ src, muted, onError, onReady }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let hls: Hls | null = null;

    const handleReady = () => {
      onReady?.();
      video.play().catch(() => {
        // Autoplay may be blocked unless muted; retry muted.
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
        if (data.fatal) onError?.(`Stream error: ${data.type}`);
      });
    } else {
      video.src = src;
      video.addEventListener("loadedmetadata", handleReady, { once: true });
      video.addEventListener("error", () => onError?.("Cannot play stream"), { once: true });
    }

    return () => {
      try { hls?.destroy(); } catch {}
      video.removeAttribute("src");
      video.load();
    };
  }, [src, onError, onReady]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = !!muted;
  }, [muted]);

  return (
    <video
      ref={videoRef}
      className="absolute inset-0 h-full w-full bg-black"
      autoPlay
      playsInline
      controls={false}
      muted={muted}
    />
  );
}