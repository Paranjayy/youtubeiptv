import { useEffect, useRef } from "react";

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<void> | null = null;
function loadApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT && window.YT.Player) return Promise.resolve();
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve) => {
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
    window.onYouTubeIframeAPIReady = () => resolve();
  });
  return apiPromise;
}

type Props = {
  videoId: string;
  onEnded: () => void;
  onReady?: () => void;
  onTitle?: (title: string) => void;
  onProgress?: (elapsed: number, duration: number) => void;
  muted?: boolean;
};

export function YouTubePlayer({ videoId, onEnded, onReady, onTitle, onProgress, muted }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const endedRef = useRef(onEnded);
  const titleRef = useRef(onTitle);
  const progressRef = useRef(onProgress);
  endedRef.current = onEnded;
  titleRef.current = onTitle;
  progressRef.current = onProgress;

  useEffect(() => {
    let cancelled = false;
    loadApi().then(() => {
      if (cancelled || !hostRef.current) return;
      playerRef.current = new window.YT.Player(hostRef.current, {
        videoId,
        host: "https://www.youtube-nocookie.com",
        playerVars: {
          autoplay: 1,
          mute: muted ? 1 : 0,
          modestbranding: 1,
          rel: 0,
          iv_load_policy: 3,
          playsinline: 1,
          origin: typeof window !== "undefined" ? window.location.origin : undefined,
          enablejsapi: 1,
        },
        events: {
          onReady: (e: any) => {
            e.target.playVideo();
            try {
              const data = e.target.getVideoData();
              titleRef.current?.(data?.title ?? "");
            } catch {}
            onReady?.();
          },
          onStateChange: (e: any) => {
            if (e.data === window.YT.PlayerState.ENDED) {
              endedRef.current();
            }
            if (e.data === window.YT.PlayerState.PLAYING) {
              try {
                const data = e.target.getVideoData();
                titleRef.current?.(data?.title ?? "");
              } catch {}
            }
          },
          onError: () => endedRef.current(),
        },
      });
    });
    return () => {
      cancelled = true;
      try { playerRef.current?.destroy?.(); } catch {}
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const p = playerRef.current;
    if (!p || !p.loadVideoById) return;
    p.loadVideoById(videoId);
  }, [videoId]);

  useEffect(() => {
    const id = window.setInterval(() => {
      const p = playerRef.current;
      if (!p || !p.getCurrentTime || !p.getDuration) return;
      try {
        progressRef.current?.(p.getCurrentTime() || 0, p.getDuration() || 0);
      } catch {}
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <div ref={hostRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}