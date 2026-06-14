// Shared Movies/Series Types & Helpers

export interface MediaItem {
  id: string; // tmdb id
  title: string;
  year: string;
  type: "movie" | "tv";
  rating: string;
  votes: string;
  genres: string[];
  duration: string;
  ageRating: string;
  synopsis: string;
  backdropUrl: string;
  posterUrl: string;
  // Fallback rich details when no API key is present
  director?: string;
  budget?: string;
  revenue?: string;
  cast?: { name: string; character: string; profileUrl: string | null }[];
  trailers?: { name: string; key: string }[];
}

export function getGenreName(id: number): string {
  const genres: Record<number, string> = {
    28: "Action",
    12: "Adventure",
    16: "Animation",
    35: "Comedy",
    80: "Crime",
    99: "Documentary",
    18: "Drama",
    10751: "Family",
    14: "Fantasy",
    36: "History",
    27: "Horror",
    10402: "Music",
    9648: "Mystery",
    10749: "Romance",
    878: "Sci-Fi",
    10770: "TV Movie",
    53: "Thriller",
    10752: "War",
    37: "Western",
    10759: "Action & Adventure",
    10762: "Kids",
    10763: "News",
    10764: "Reality",
    10765: "Sci-Fi & Fantasy",
    10766: "Soap",
    10767: "Talk",
    10768: "War & Politics",
  };
  return genres[id] || "Genre";
}

export const TRENDING_MEDIA: MediaItem[] = [
  {
    id: "803796",
    title: "KPop Demon Hunters",
    year: "2025",
    type: "movie",
    rating: "7.5",
    votes: "3,911",
    genres: ["Action", "Animation", "Comedy", "Fantasy", "Music"],
    duration: "96 Min",
    ageRating: "PG",
    synopsis: "When K-pop superstars Rumi, Mira, and Zoey aren't selling out stadiums, they're using their secret powers to protect their fans from supernatural threats.",
    backdropUrl: "https://image.tmdb.org/t/p/w1280/1At1GfA23eS5H4Qx8WdY9L5VU5s.jpg",
    posterUrl: "https://image.tmdb.org/t/p/w500/kC5H3l2e40Gv75t6tJgHhUHhD4.jpg",
    director: "Chris Appelhans",
    budget: "$45,000,000",
    revenue: "$112,000,000",
    cast: [
      { name: "Rumi", character: "Lead Vocalist / Hunter", profileUrl: null },
      { name: "Mira", character: "Visual / Swordmaster", profileUrl: null },
      { name: "Zoey", character: "Main Rapper / Tech Specialist", profileUrl: null },
    ],
    trailers: [
      { name: "Official Announcement Trailer", key: "dQw4w9WgXcQ" }
    ]
  },
  {
    id: "27205",
    title: "Inception",
    year: "2010",
    type: "movie",
    rating: "8.8",
    votes: "2.4M",
    genres: ["Action", "Sci-Fi", "Adventure"],
    duration: "148 Min",
    ageRating: "PG-13",
    synopsis: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
    backdropUrl: "https://image.tmdb.org/t/p/w1280/8ZTVqv2tCN1Ogp0u42f3uY343hX.jpg",
    posterUrl: "https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg",
    director: "Christopher Nolan",
    budget: "$160,000,000",
    revenue: "$836,836,967",
    cast: [
      { name: "Leonardo DiCaprio", character: "Cobb", profileUrl: "https://image.tmdb.org/t/p/w185/wo2hJpnayHmr4pa08O7oP0icjOI.jpg" },
      { name: "Joseph Gordon-Levitt", character: "Arthur", profileUrl: "https://image.tmdb.org/t/p/w185/4tQae2G2Gw59RLgM3tBAd863ZIK.jpg" },
      { name: "Elliot Page", character: "Ariadne", profileUrl: "https://image.tmdb.org/t/p/w185/pS7H2l2e40Gv75t6tJgHhUHhD4.jpg" },
      { name: "Tom Hardy", character: "Eames", profileUrl: "https://image.tmdb.org/t/p/w185/4xwXP5w0j5v6TjG6p7lAAd863ZI.jpg" }
    ],
    trailers: [
      { name: "Official Trailer", key: "YoHD9XEInc0" }
    ]
  },
  {
    id: "157336",
    title: "Interstellar",
    year: "2014",
    type: "movie",
    rating: "8.7",
    votes: "2.1M",
    genres: ["Adventure", "Drama", "Sci-Fi"],
    duration: "169 Min",
    ageRating: "PG-13",
    synopsis: "The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel and conquer the vast distances involved in an interstellar voyage.",
    backdropUrl: "https://image.tmdb.org/t/p/w1280/xJHokZBljvj27hp07co6g5icLGa.jpg",
    posterUrl: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    director: "Christopher Nolan",
    budget: "$165,000,000",
    revenue: "$701,729,206",
    cast: [
      { name: "Matthew McConaughey", character: "Cooper", profileUrl: null },
      { name: "Anne Hathaway", character: "Brand", profileUrl: null },
      { name: "Jessica Chastain", character: "Murph", profileUrl: null }
    ],
    trailers: [
      { name: "Official Trailer", key: "zSWdZAeeCgs" }
    ]
  },
  {
    id: "693134",
    title: "Dune: Part Two",
    year: "2024",
    type: "movie",
    rating: "8.6",
    votes: "420K",
    genres: ["Action", "Adventure", "Sci-Fi"],
    duration: "166 Min",
    ageRating: "PG-13",
    synopsis: "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.",
    backdropUrl: "https://image.tmdb.org/t/p/w1280/xOMo8mGWszwV6g4487J6colHd9C.jpg",
    posterUrl: "https://image.tmdb.org/t/p/w500/6izwz7rsy95ARzTR3poZ8H6c5pp.jpg",
    director: "Denis Villeneuve",
    budget: "$190,000,000",
    revenue: "$712,000,000",
    cast: [
      { name: "Timothée Chalamet", character: "Paul Atreides", profileUrl: "https://image.tmdb.org/t/p/w185/BE7642giGf59RLgM3tBAd863ZIK.jpg" },
      { name: "Zendaya", character: "Chani", profileUrl: "https://image.tmdb.org/t/p/w185/u2H2l2e40Gv75t6tJgHhUHhD4.jpg" }
    ],
    trailers: [
      { name: "Official Trailer 3", key: "Way9DexvX_s" }
    ]
  },
  {
    id: "155",
    title: "The Dark Knight",
    year: "2008",
    type: "movie",
    rating: "9.0",
    votes: "2.8M",
    genres: ["Action", "Crime", "Drama", "Thriller"],
    duration: "152 Min",
    ageRating: "PG-13",
    synopsis: "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.",
    backdropUrl: "https://image.tmdb.org/t/p/w1280/nMKdUU5685i64Nm19K46kYyZ5tq.jpg",
    posterUrl: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    director: "Christopher Nolan",
    budget: "$185,000,000",
    revenue: "$1,006,234,167",
    cast: [
      { name: "Christian Bale", character: "Bruce Wayne / Batman", profileUrl: null },
      { name: "Heath Ledger", character: "Joker", profileUrl: null },
      { name: "Gary Oldman", character: "Jim Gordon", profileUrl: null }
    ],
    trailers: [
      { name: "Official Trailer", key: "EXeTwQWrcwY" }
    ]
  },
  {
    id: "496243",
    title: "Parasite",
    year: "2019",
    type: "movie",
    rating: "8.5",
    votes: "930K",
    genres: ["Drama", "Thriller", "Comedy"],
    duration: "132 Min",
    ageRating: "R",
    synopsis: "Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.",
    backdropUrl: "https://image.tmdb.org/t/p/w1280/7ryg15V9t9u2Asjo2n5028453.jpg",
    posterUrl: "https://image.tmdb.org/t/p/w500/jjHccoFjbqlfr4VGLVLT7yek0Xn.jpg",
    director: "Bong Joon Ho",
    budget: "$11,400,000",
    revenue: "$263,000,000",
    cast: [
      { name: "Song Kang-ho", character: "Ki-taek", profileUrl: null },
      { name: "Lee Sun-kyun", character: "Mr. Park", profileUrl: null }
    ],
    trailers: [
      { name: "Official Trailer", key: "5xH0HfM5tBAd" }
    ]
  },
  {
    id: "872585",
    title: "Oppenheimer",
    year: "2023",
    type: "movie",
    rating: "8.9",
    votes: "680K",
    genres: ["Drama", "History"],
    duration: "180 Min",
    ageRating: "R",
    synopsis: "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.",
    backdropUrl: "https://image.tmdb.org/t/p/w1280/fm6KqX2DhbvNz84J1EX9XRhX3AO.jpg",
    posterUrl: "https://image.tmdb.org/t/p/w500/8Gxv1U41qZgKqS2W75r7wzQe22M.jpg",
    director: "Christopher Nolan",
    budget: "$100,000,000",
    revenue: "$957,000,000",
    cast: [
      { name: "Cillian Murphy", character: "J. Robert Oppenheimer", profileUrl: null },
      { name: "Emily Blunt", character: "Kitty Oppenheimer", profileUrl: null },
      { name: "Matt Damon", character: "Leslie Groves", profileUrl: null }
    ],
    trailers: [
      { name: "Official Trailer", key: "uYPbbksJxIg" }
    ]
  },
  {
    id: "1396",
    title: "Breaking Bad",
    year: "2008",
    type: "tv",
    rating: "9.5",
    votes: "2.1M",
    genres: ["Crime", "Drama", "Thriller"],
    duration: "5 Seasons",
    ageRating: "TV-MA",
    synopsis: "A chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine with a former student in order to secure his family's future.",
    backdropUrl: "https://image.tmdb.org/t/p/w1280/84gC2357422g0tIEeh7LVlG70Fl.jpg",
    posterUrl: "https://image.tmdb.org/t/p/w500/ztkgnFjVf10V8yG1vW2Pj132w1q.jpg",
    director: "Vince Gilligan",
    budget: "N/A",
    revenue: "N/A",
    cast: [
      { name: "Bryan Cranston", character: "Walter White", profileUrl: "https://image.tmdb.org/t/p/w185/wo2hJpnayHmr4pa08O7oP0icjOI.jpg" },
      { name: "Aaron Paul", character: "Jesse Pinkman", profileUrl: "https://image.tmdb.org/t/p/w185/4tQae2G2Gw59RLgM3tBAd863ZIK.jpg" }
    ],
    trailers: [
      { name: "Series Trailer", key: "HhesaQXH9HE" }
    ]
  },
  {
    id: "117078",
    title: "Severance",
    year: "2022",
    type: "tv",
    rating: "8.7",
    votes: "180K",
    genres: ["Drama", "Mystery", "Sci-Fi"],
    duration: "2 Seasons",
    ageRating: "TV-MA",
    synopsis: "Mark leads a team of office workers whose memories have been surgically divided between their work and personal lives. When a mysterious colleague appears outside of work, it begins a journey to discover the truth about their jobs.",
    backdropUrl: "https://image.tmdb.org/t/p/w1280/l5K4vXQzS1nUu5eUa71rV7YJd8C.jpg",
    posterUrl: "https://image.tmdb.org/t/p/w500/uXDfbCgq9Zweep2B1QiDKuh.jpg",
    director: "Ben Stiller",
    budget: "N/A",
    revenue: "N/A",
    cast: [
      { name: "Adam Scott", character: "Mark Scout", profileUrl: null },
      { name: "Patricia Arquette", character: "Harmony Cobel", profileUrl: null }
    ],
    trailers: [
      { name: "Official Trailer", key: "xKTgRaR_t40" }
    ]
  },
  {
    id: "2316",
    title: "The Office",
    year: "2005",
    type: "tv",
    rating: "9.0",
    votes: "620K",
    genres: ["Comedy"],
    duration: "9 Seasons",
    ageRating: "TV-14",
    synopsis: "A mockumentary on a group of typical office workers, where the workday consists of ego clashes, inappropriate behavior, and tedium.",
    backdropUrl: "https://image.tmdb.org/t/p/w1280/dgx1p07rT8pLhU36U148UeX3d8B.jpg",
    posterUrl: "https://image.tmdb.org/t/p/w500/qWvGsvi24H7m6X7lV8C1a6M38jE.jpg",
    director: "Greg Daniels",
    budget: "N/A",
    revenue: "N/A",
    cast: [
      { name: "Steve Carell", character: "Michael Scott", profileUrl: null },
      { name: "Rainn Wilson", character: "Dwight Schrute", profileUrl: null },
      { name: "John Krasinski", character: "Jim Halpert", profileUrl: null }
    ],
    trailers: [
      { name: "Pilot Trailer", key: "gO8N3L_aERg" }
    ]
  },
  {
    id: "87108",
    title: "Chernobyl",
    year: "2019",
    type: "tv",
    rating: "9.4",
    votes: "850K",
    genres: ["Drama", "History"],
    duration: "1 Season",
    ageRating: "TV-MA",
    synopsis: "In April 1986, an explosion at the Chernobyl nuclear power plant in the Union of Soviet Socialist Republics becomes one of the world's worst man-made catastrophes.",
    backdropUrl: "https://image.tmdb.org/t/p/w1280/9N64d50t8NUXFjSntFhV4l3QvY.jpg",
    posterUrl: "https://image.tmdb.org/t/p/w500/hlLXt2tOPT6RRnjiUmoxyG1LTFi.jpg",
    director: "Craig Mazin",
    budget: "N/A",
    revenue: "N/A",
    cast: [
      { name: "Jared Harris", character: "Valery Legasov", profileUrl: null },
      { name: "Stellan Skarsgård", character: "Boris Shcherbina", profileUrl: null }
    ],
    trailers: [
      { name: "Official Trailer", key: "s9APLXM9Ei8" }
    ]
  },
  {
    id: "66732",
    title: "Stranger Things",
    year: "2016",
    type: "tv",
    rating: "8.7",
    votes: "1.3M",
    genres: ["Sci-Fi & Fantasy", "Drama", "Mystery"],
    duration: "5 Seasons",
    ageRating: "TV-14",
    synopsis: "When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces and one strange little girl.",
    backdropUrl: "https://image.tmdb.org/t/p/w1280/56v2wYuvm12dz795a3146w3z2V.jpg",
    posterUrl: "https://image.tmdb.org/t/p/w500/49WJz0S6z45v1HjYJkFk620S15p.jpg",
    director: "The Duffer Brothers",
    budget: "N/A",
    revenue: "N/A",
    cast: [
      { name: "Millie Bobby Brown", character: "Eleven", profileUrl: null },
      { name: "Winona Ryder", character: "Joyce Byers", profileUrl: null },
      { name: "David Harbour", character: "Jim Hopper", profileUrl: null }
    ],
    trailers: [
      { name: "Official Trailer", key: "b9EkMc79ZSU" }
    ]
  }
];

export interface VideoSource {
  name: string;
  getUrl: (id: string, imdbId: string | null, type: "movie" | "tv", season?: number, episode?: number) => string;
}

export const VIDEO_SOURCES: VideoSource[] = [
  {
    name: "LordFlix (Premium)",
    getUrl: (id, imdbId, type, season = 1, episode = 1) =>
      type === "movie"
        ? `https://lordflix.org/watch/movie/${id}`
        : `https://lordflix.org/watch/tv/${id}/${season}/${episode}`,
  },
  {
    name: "StreamIMDb (123Movies 1)",
    getUrl: (id, imdbId, type, season = 1, episode = 1) => {
      const targetId = imdbId || "tt37287335";
      return type === "movie"
        ? `https://streamimdb.me/embed/movie/${targetId}`
        : `https://streamimdb.me/embed/tv/${targetId}/${season}/${episode}`;
    }
  },
  {
    name: "XPass (123Movies 2)",
    getUrl: (id, imdbId, type, season = 1, episode = 1) => {
      const targetId = imdbId || "tt37287335";
      return type === "movie"
        ? `https://play.xpass.top/e/movie/${targetId}`
        : `https://play.xpass.top/e/tv/${targetId}/${season}/${episode}`;
    }
  },
  {
    name: "NxSha (123Movies 3)",
    getUrl: (id, imdbId, type, season = 1, episode = 1) => {
      const targetId = imdbId || "tt37287335";
      return type === "movie"
        ? `https://web.nxsha.app/embed/movie/${targetId}`
        : `https://web.nxsha.app/embed/tv/${targetId}/${season}/${episode}`;
    }
  },
  {
    name: "VidApi (123Movies 4)",
    getUrl: (id, imdbId, type, season = 1, episode = 1) =>
      type === "movie"
        ? `https://vidapi.xyz/embed/movie/${id}`
        : `https://vidapi.xyz/embed/tv/${id}/${season}/${episode}`,
  },
  {
    name: "Orion",
    getUrl: (id, imdbId, type, season = 1, episode = 1) =>
      type === "movie"
        ? `https://vidsrc.to/embed/movie/${id}`
        : `https://vidsrc.to/embed/tv/${id}/${season}/${episode}`,
  },
  {
    name: "Elysium",
    getUrl: (id, imdbId, type, season = 1, episode = 1) =>
      type === "movie"
        ? `https://vidsrc.me/embed/movie?tmdb=${id}`
        : `https://vidsrc.me/embed/tv?tmdb=${id}&season=${season}&episode=${episode}`,
  },
  {
    name: "Vega",
    getUrl: (id, imdbId, type, season = 1, episode = 1) =>
      type === "movie"
        ? `https://embed.su/embed/movie/${id}`
        : `https://embed.su/embed/tv/${id}/${season}/${episode}`,
  },
  {
    name: "Sirius",
    getUrl: (id, imdbId, type, season = 1, episode = 1) =>
      type === "movie"
        ? `https://multiembed.to/emulator.php?video_id=${id}&tmdb=1`
        : `https://multiembed.to/emulator.php?video_id=${id}&tmdb=1&s=${season}&e=${episode}`,
  },
  {
    name: "Capella",
    getUrl: (id, imdbId, type, season = 1, episode = 1) =>
      type === "movie"
        ? `https://play2.vidapi.pro/movie/${id}`
        : `https://play2.vidapi.pro/tv/${id}/${season}/${episode}`,
  },
  {
    name: "Nova",
    getUrl: (id, imdbId, type, season = 1, episode = 1) =>
      type === "movie"
        ? `https://2embed.cc/embed/${id}`
        : `https://2embed.cc/embedtv/${id}&s=${season}&e=${episode}`,
  },
  {
    name: "Lyra",
    getUrl: (id, imdbId, type, season = 1, episode = 1) =>
      type === "movie"
        ? `https://vidsrc.cc/v2/embed/movie/${id}`
        : `https://vidsrc.cc/v2/embed/tv/${id}/${season}/${episode}`,
  },
];
