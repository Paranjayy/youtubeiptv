import { useEffect, useRef } from "react";

type Props = {
  src: string;
  muted?: boolean;
  onError?: (msg: string) => void;
  onReady?: () => void;
};

export function RadioPlayer({ src, muted, onError, onReady }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.src = src;
    audio.load();
    const handleReady = () => {
      onReady?.();
      audio.play().catch(() => {
        audio.muted = true;
        audio.play().catch(() => {});
      });
    };
    const handleError = () => onError?.("Stream offline");
    audio.addEventListener("loadedmetadata", handleReady, { once: true });
    audio.addEventListener("canplay", handleReady, { once: true });
    audio.addEventListener("error", handleError, { once: true });
    return () => {
      audio.removeEventListener("loadedmetadata", handleReady);
      audio.removeEventListener("canplay", handleReady);
      audio.removeEventListener("error", handleError);
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    };
  }, [src, onError, onReady]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = !!muted;
  }, [muted]);

  return <audio ref={audioRef} muted={muted} preload="auto" className="hidden" />;
}
