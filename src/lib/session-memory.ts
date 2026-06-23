import { useEffect, useRef } from "react";
import { Channel } from "@/lib/channels";

type SessionState = {
  lastChannelId: string;
  lastVideoIndex: number;
  lastMode: "yt" | "iptv" | "radio" | "movies";
  lastTimestamp: number;
  viewCount: number;
  totalWatchTime: number; // seconds
  favoriteChannels: string[];
  recentChannels: string[]; // last 10 channel IDs
};

const STORAGE_KEY = "tubetv:session-memory";
const SAVE_INTERVAL = 10_000; // save every 10 seconds

const DEFAULT_STATE: SessionState = {
  lastChannelId: "",
  lastVideoIndex: 0,
  lastMode: "yt",
  lastTimestamp: 0,
  viewCount: 0,
  totalWatchTime: 0,
  favoriteChannels: [],
  recentChannels: [],
};

export function loadSession(): SessionState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SessionState>;
      return { ...DEFAULT_STATE, ...parsed };
    }
  } catch {}
  return { ...DEFAULT_STATE };
}

export function saveSession(state: SessionState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export function useSessionMemory(options: {
  channel: Channel;
  videoIndex: number;
  mode: "yt" | "iptv" | "radio" | "movies";
}) {
  const stateRef = useRef<SessionState>(loadSession());
  const watchStartRef = useRef(Date.now());

  // Track watch time
  useEffect(() => {
    const handleUnload = () => {
      const elapsed = Math.floor((Date.now() - watchStartRef.current) / 1000);
      const state = stateRef.current;
      state.totalWatchTime += elapsed;
      saveSession(state);
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      handleUnload();
    };
  }, []);

  // Auto-save periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const state = stateRef.current;
      state.lastChannelId = options.channel.id;
      state.lastVideoIndex = options.videoIndex;
      state.lastMode = options.mode;
      state.lastTimestamp = Date.now();
      state.viewCount += 1;
      saveSession(state);
    }, SAVE_INTERVAL);

    return () => clearInterval(interval);
  }, [options.channel.id, options.videoIndex, options.mode]);

  // Update on channel change
  useEffect(() => {
    const state = stateRef.current;
    state.lastChannelId = options.channel.id;
    state.lastVideoIndex = options.videoIndex;
    state.lastMode = options.mode;
    state.lastTimestamp = Date.now();
    state.viewCount += 1;

    // Track recent channels (deduplicated, max 10)
    state.recentChannels = [
      options.channel.id,
      ...state.recentChannels.filter((id) => id !== options.channel.id),
    ].slice(0, 10);

    saveSession(state);
    watchStartRef.current = Date.now();
  }, [options.channel.id, options.videoIndex, options.mode]);

  const toggleFavorite = (channelId: string) => {
    const state = stateRef.current;
    if (state.favoriteChannels.includes(channelId)) {
      state.favoriteChannels = state.favoriteChannels.filter((id) => id !== channelId);
    } else {
      state.favoriteChannels.push(channelId);
    }
    saveSession(state);
  };

  const isFavorite = (channelId: string) => stateRef.current.favoriteChannels.includes(channelId);

  const getStats = () => {
    const state = stateRef.current;
    const hours = Math.floor(state.totalWatchTime / 3600);
    const minutes = Math.floor((state.totalWatchTime % 3600) / 60);
    return {
      totalWatchTime: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`,
      viewCount: state.viewCount,
      favoriteCount: state.favoriteChannels.length,
      recentChannels: state.recentChannels,
    };
  };

  const getResumeInfo = () => {
    const state = stateRef.current;
    if (!state.lastChannelId || Date.now() - state.lastTimestamp > 24 * 60 * 60 * 1000) {
      return null; // too old or no session
    }
    return {
      channelId: state.lastChannelId,
      videoIndex: state.lastVideoIndex,
      mode: state.lastMode,
      ago: formatTimeAgo(state.lastTimestamp),
    };
  };

  return { toggleFavorite, isFavorite, getStats, getResumeInfo, session: stateRef.current };
}

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}
