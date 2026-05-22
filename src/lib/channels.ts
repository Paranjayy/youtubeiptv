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

// Extra channels appended below to expand the lineup.
CHANNELS.push(
  {
    id: "classical",
    number: "13",
    name: "CONCERTO",
    tagline: "classical & orchestral",
    category: "Music",
    color: "var(--neon-amber)",
    videos: ["jgpJVI3tDbY", "GRxofEmo3HA", "rOjHhS5MtvA", "fOk8Tm815lE"],
  },
  {
    id: "edm",
    number: "14",
    name: "RAVE FM",
    tagline: "edm, house & festival sets",
    category: "Music",
    color: "var(--neon-pink)",
    videos: ["7wtfhZwyrcc", "5NV6Rdv1a3I", "QK8mJJJvaes", "TYFyHmojNoY"],
  },
  {
    id: "kpop",
    number: "15",
    name: "K-WAVE",
    tagline: "k-pop hits & MVs",
    category: "Music",
    color: "var(--neon-pink)",
    videos: ["gdZLi9oWNZg", "IHNzOHi8sJs", "WPdWvnAAurg", "Amq-qlqbjYA"],
  },
  {
    id: "latin",
    number: "16",
    name: "RITMO",
    tagline: "reggaeton & latin heat",
    category: "Music",
    color: "var(--neon-amber)",
    videos: ["kJQP7kiw5Fk", "TmKh7lAwnBI", "pRpeEdMmmQ0", "fHI8X4OXluQ"],
  },
  {
    id: "news",
    number: "17",
    name: "WORLD WIRE",
    tagline: "global news highlights",
    category: "News",
    color: "var(--neon-cyan)",
    videos: ["9Auq9mYxFEE", "F-TyW8Ub_38", "21X5lGlDOfg", "w_Ma8oQLmSM"],
  },
  {
    id: "sports",
    number: "18",
    name: "STADIUM",
    tagline: "sports highlights & moments",
    category: "Sports",
    color: "var(--neon-green)",
    videos: ["wYx5b1aRTls", "qcF7CmuMjVk", "_LqJ24DEtPM", "rEq1Z0bjdwc"],
  },
  {
    id: "food",
    number: "19",
    name: "FLAVOR",
    tagline: "recipes & food travel",
    category: "Food",
    color: "var(--neon-amber)",
    videos: ["VKfMfMcwq4Y", "JFAR2-iQUW8", "k0RJ8N9rRC8", "BJUuoZ74e2g"],
  },
  {
    id: "travel",
    number: "20",
    name: "JET STREAM",
    tagline: "destinations in motion",
    category: "Travel",
    color: "var(--neon-cyan)",
    videos: ["d3hC4M_OZBI", "K4TOrB7at0Y", "P6AaSMfXHbA", "h1BQPV-iCkU"],
  },
  {
    id: "kids",
    number: "21",
    name: "KIDDO",
    tagline: "songs & stories for kids",
    category: "Kids",
    color: "var(--neon-green)",
    videos: ["XqZsoesa55w", "_OBlgSz8sSM", "D0Ajq682yrA", "L0MK7qz13bU"],
  },
  {
    id: "art",
    number: "22",
    name: "GALLERY",
    tagline: "art, design & creativity",
    category: "Art",
    color: "var(--neon-purple)",
    videos: ["LjbJZWLZpV0", "OuF9HyNHvuc", "uV2P_tcLAh4", "vKgRkH-zCxs"],
  },
  {
    id: "movies",
    number: "23",
    name: "CINEMA 23",
    tagline: "trailers & film vault",
    category: "Movies",
    color: "var(--neon-amber)",
    videos: ["zSWdZVtXT7E", "8g18jFHCLXk", "8hP9D6kZseM", "TcMBFSGVi1c"],
  },
  {
    id: "science",
    number: "24",
    name: "LAB FM",
    tagline: "experiments & explainers",
    category: "Science",
    color: "var(--neon-cyan)",
    videos: ["7m6V12u14CY", "xAUJYP8tnRE", "n3Xv_g3g-mA", "L_jWHffIx5E"],
  },
  {
    id: "history",
    number: "25",
    name: "TIMELINE",
    tagline: "history retold",
    category: "Docs",
    color: "var(--neon-purple)",
    videos: ["xuCn8ux2gbs", "Jy3N0Hb3D6I", "Q78COTwT7nE", "FwqIJ8dr8Hg"],
  },
  {
    id: "asmr",
    number: "26",
    name: "WHISPER",
    tagline: "ambient & asmr",
    category: "Wellness",
    color: "var(--neon-green)",
    videos: ["DWcJFNfaw9c", "1ZYbU82GVz4", "Fpf-IRRRZW8", "8rJ56Oycczs"],
  },
  {
    id: "anime2",
    number: "27",
    name: "OTAKU+",
    tagline: "anime AMVs & lo-fi",
    category: "Anime",
    color: "var(--neon-pink)",
    videos: ["DRS_PpOrUZ4", "TYbnDc8L-r0", "y7ESe-Cd-Wk", "lcSnzysmHV4"],
  },
  {
    id: "cars",
    number: "28",
    name: "OCTANE",
    tagline: "cars, racing & reviews",
    category: "Auto",
    color: "var(--neon-pink)",
    videos: ["MFcVjL3VnZw", "C3dPyEoMRzM", "1NfMOh6Yt7c", "MNl6dz9rxxs"],
  }
);

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