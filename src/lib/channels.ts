export type Channel = {
  id: string;
  number: string;
  name: string;
  tagline: string;
  category: string;
  color: string; // CSS color (uses theme tokens)
  videos: string[]; // YouTube video IDs
};

// Curated evergreen, embeddable public videos per channel.
// IDs are well-known long-lived uploads. If one fails to embed the player will skip.
export const CHANNELS: Channel[] = [
  {
    id: "lofi",
    number: "01",
    name: "LOFI BEATS",
    tagline: "beats to relax / study to",
    category: "Music",
    color: "var(--neon-cyan)",
    videos: [
      "jfKfPfyJRdk", // lofi girl
      "rUxyKA_-grg",
      "DWcJFNfaw9c",
      "5qap5aO4i9A",
      "4xDzrJKXOOY",
    ],
  },
  {
    id: "synthwave",
    number: "02",
    name: "NEON DRIVE",
    tagline: "synthwave & retro futures",
    category: "Music",
    color: "var(--neon-pink)",
    videos: [
      "MV_3Dpw-BRY",
      "4xDzrJKXOOY",
      "UedTcufyrHc",
      "ALZHF5UqnU4",
      "9Ip0sNbtFnk",
    ],
  },
  {
    id: "hits",
    number: "03",
    name: "POP HITS",
    tagline: "anthems on repeat",
    category: "Music",
    color: "var(--neon-amber)",
    videos: [
      "kJQP7kiw5Fk", // Despacito
      "JGwWNGJdvx8", // Shape of You
      "fLexgOxsZu0", // Sugar
      "OPf0YbXqDm0", // Uptown Funk
      "RgKAFK5djSk", // See You Again
      "9bZkp7q19f0", // Gangnam Style
    ],
  },
  {
    id: "nature",
    number: "04",
    name: "PLANET LIVE",
    tagline: "earth in 4k",
    category: "Nature",
    color: "var(--neon-green)",
    videos: [
      "BHACKCNDMW8",
      "LXb3EKWsInQ",
      "qochHw8FvWg",
      "eKFTSSKCzWA",
      "K3oxs5UJhBE",
    ],
  },
  {
    id: "space",
    number: "05",
    name: "DEEP SPACE",
    tagline: "cosmos & telescopes",
    category: "Science",
    color: "var(--neon-purple)",
    videos: [
      "0jHsq36_NTU",
      "GoW8Tf7hTGA",
      "Wf6tVqYrjpw",
      "udFxKZRyQt4",
      "libKVRa01L8",
    ],
  },
  {
    id: "comedy",
    number: "06",
    name: "LAUGH TRACK",
    tagline: "stand-up & sketches",
    category: "Comedy",
    color: "var(--neon-amber)",
    videos: [
      "RBumgq5yVrA",
      "QH2-TGUlwu4",
      "ZbZSe6N_BXs",
      "PYylPRX6z4Q",
    ],
  },
  {
    id: "gaming",
    number: "07",
    name: "ARCADE",
    tagline: "trailers, speedruns, glitches",
    category: "Gaming",
    color: "var(--neon-pink)",
    videos: [
      "1O6Qstncpnc",
      "8X2kIfS6fb8",
      "WMweEpGlu_U",
      "0KSOMA3QBU0",
    ],
  },
  {
    id: "tech",
    number: "08",
    name: "TECH WAVE",
    tagline: "talks & teardowns",
    category: "Tech",
    color: "var(--neon-cyan)",
    videos: [
      "kCc8FmEb1nY",
      "VMj-3S1tku0",
      "Lz8oCqo7eGo",
      "8jLOx1hD3_o",
    ],
  },
  {
    id: "jazz",
    number: "09",
    name: "BLUE NOTE",
    tagline: "smooth jazz & late nights",
    category: "Music",
    color: "var(--neon-cyan)",
    videos: [
      "Dx5qFachd3A",
      "neV3EPgvZ3g",
      "MOoIRRkOQrk",
      "DSGyEsJ17cI",
    ],
  },
  {
    id: "workout",
    number: "10",
    name: "PULSE FM",
    tagline: "high-energy workout",
    category: "Music",
    color: "var(--neon-pink)",
    videos: [
      "gCYcHz2k5x0",
      "btPJPFnesV4",
      "RB-RcX5DS5A",
      "papuvlVeZg8",
    ],
  },
  {
    id: "docs",
    number: "11",
    name: "DOC ZONE",
    tagline: "deep-dive documentaries",
    category: "Docs",
    color: "var(--neon-amber)",
    videos: [
      "iYpHJ8FjbBE",
      "rStL7niR7gs",
      "PqEiCu5e8YM",
      "TYPFenJQciw",
    ],
  },
  {
    id: "anime",
    number: "12",
    name: "ANIMEX",
    tagline: "openings & AMVs",
    category: "Anime",
    color: "var(--neon-purple)",
    videos: [
      "QczGoCmX-pI",
      "5wRWniH7rt8",
      "G2GvLEXSPDU",
      "melLnp1FY7Y",
    ],
  },
];

export const CATEGORIES = Array.from(new Set(CHANNELS.map((c) => c.category)));

export function shuffle<T>(arr: T[], seed = Date.now()): T[] {
  const a = arr.slice();
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}