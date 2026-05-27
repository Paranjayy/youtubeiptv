export type PlaygroundCategoryId = "geo" | "music" | "screen" | "anime" | "books";

export type PlaygroundChoice = {
  label: string;
  detail?: string;
};

export type PlaygroundRound = {
  id: string;
  category: PlaygroundCategoryId;
  title: string;
  prompt: string;
  hint: string;
  sourceLabel: string;
  choices: PlaygroundChoice[];
  answerIndex: number;
  explanation: string;
};

export type PlaygroundCategory = {
  id: PlaygroundCategoryId;
  label: string;
  accent: string;
  blurb: string;
};

export const PLAYGROUND_CATEGORIES: PlaygroundCategory[] = [
  {
    id: "geo",
    label: "Geo",
    accent: "var(--neon-cyan)",
    blurb: "Places, landmarks, capitals, and map instincts.",
  },
  {
    id: "music",
    label: "Music",
    accent: "var(--neon-pink)",
    blurb: "Artists, eras, records, and sonic identities.",
  },
  {
    id: "screen",
    label: "Screen",
    accent: "var(--neon-amber)",
    blurb: "Movies and shows with a clean clue-first loop.",
  },
  {
    id: "anime",
    label: "Anime",
    accent: "var(--neon-purple)",
    blurb: "Series, studios, and iconic character arcs.",
  },
  {
    id: "books",
    label: "Library",
    accent: "var(--neon-green)",
    blurb: "Books, authors, and literature rabbit holes.",
  },
];

const GEO_ROUNDS: PlaygroundRound[] = [
  {
    id: "geo-oslo",
    category: "geo",
    title: "Nordic capital",
    prompt: "This capital sits at the head of a fjord and is the largest city in Norway.",
    hint: "Think fjords, museums, and modern Scandinavian design.",
    sourceLabel: "World atlas",
    choices: [
      { label: "Oslo" },
      { label: "Bergen" },
      { label: "Stockholm" },
      { label: "Copenhagen" },
    ],
    answerIndex: 0,
    explanation: "Oslo is Norway's capital and the city at the head of the Oslofjord.",
  },
  {
    id: "geo-kyoto",
    category: "geo",
    title: "Old capital",
    prompt:
      "Which city is famous for temples, seasonal gardens, and once served as Japan's imperial capital?",
    hint: "Cherry blossoms and centuries of cultural memory.",
    sourceLabel: "City clue",
    choices: [{ label: "Kyoto" }, { label: "Osaka" }, { label: "Nara" }, { label: "Kobe" }],
    answerIndex: 0,
    explanation: "Kyoto was Japan's imperial capital for more than a thousand years.",
  },
  {
    id: "geo-cape-town",
    category: "geo",
    title: "Mountain city",
    prompt: "This city is known for Table Mountain and sits at the southwestern tip of Africa.",
    hint: "A harbor city with a very famous flat-topped backdrop.",
    sourceLabel: "Landmark clue",
    choices: [
      { label: "Cape Town" },
      { label: "Durban" },
      { label: "Johannesburg" },
      { label: "Port Elizabeth" },
    ],
    answerIndex: 0,
    explanation:
      "Cape Town is on the southwest coast of South Africa and is framed by Table Mountain.",
  },
];

const MUSIC_ROUNDS: PlaygroundRound[] = [
  {
    id: "music-queen",
    category: "music",
    title: "Classic frontman",
    prompt: "Which band was fronted by Freddie Mercury?",
    hint: "One of the most famous live acts of all time.",
    sourceLabel: "Artist trail",
    choices: [{ label: "Queen" }, { label: "The Police" }, { label: "U2" }, { label: "Rush" }],
    answerIndex: 0,
    explanation: "Freddie Mercury was the lead singer of Queen.",
  },
  {
    id: "music-rahman",
    category: "music",
    title: "Composer spotlight",
    prompt: "Which composer is known for the soundtrack of 'Roja' and later global crossover hits?",
    hint: "A sound that moved from local cinema to worldwide stages.",
    sourceLabel: "Score clue",
    choices: [
      { label: "A. R. Rahman" },
      { label: "Ilaiyaraaja" },
      { label: "Anirudh Ravichander" },
      { label: "Hamsalekha" },
    ],
    answerIndex: 0,
    explanation: "A. R. Rahman broke out globally after landmark Indian film soundtracks.",
  },
  {
    id: "music-daftpunk",
    category: "music",
    title: "Robot duo",
    prompt: "Which duo made 'Discovery' and turned house music into a neon myth?",
    hint: "Helmets, samples, and a lot of chrome.",
    sourceLabel: "Electronic lane",
    choices: [
      { label: "Daft Punk" },
      { label: "Justice" },
      { label: "Kraftwerk" },
      { label: "The Chemical Brothers" },
    ],
    answerIndex: 0,
    explanation: "Daft Punk made Discovery and built a huge visual identity around the duo.",
  },
];

const SCREEN_ROUNDS: PlaygroundRound[] = [
  {
    id: "screen-inception",
    category: "screen",
    title: "Mind-bender",
    prompt: "Which film is the dream-heist puzzle directed by Christopher Nolan?",
    hint: "Spinning tops and folded cities.",
    sourceLabel: "Film night",
    choices: [
      { label: "Inception" },
      { label: "Interstellar" },
      { label: "Tenet" },
      { label: "Memento" },
    ],
    answerIndex: 0,
    explanation: "Inception is the 2010 heist film built around layered dreams.",
  },
  {
    id: "screen-breaking-bad",
    category: "screen",
    title: "Prestige TV",
    prompt: "Which series follows Walter White's shift from chemistry teacher to meth kingpin?",
    hint: "A very famous blue-toned crime drama.",
    sourceLabel: "TV clue",
    choices: [
      { label: "Breaking Bad" },
      { label: "Better Call Saul" },
      { label: "Ozark" },
      { label: "Fargo" },
    ],
    answerIndex: 0,
    explanation:
      "Breaking Bad tracks Walter White's transformation and remains one of TV's biggest dramas.",
  },
  {
    id: "screen-miyazaki",
    category: "screen",
    title: "Animated legend",
    prompt: "Which film features a young girl entering a spirit bathhouse and meeting No-Face?",
    hint: "Studio Ghibli, wonder, and a train across water.",
    sourceLabel: "Animation clue",
    choices: [
      { label: "Spirited Away" },
      { label: "Howl's Moving Castle" },
      { label: "Princess Mononoke" },
      { label: "My Neighbor Totoro" },
    ],
    answerIndex: 0,
    explanation: "Spirited Away is Hayao Miyazaki's iconic bathhouse fantasy.",
  },
];

const ANIME_ROUNDS: PlaygroundRound[] = [
  {
    id: "anime-naruto",
    category: "anime",
    title: "Ninja climb",
    prompt: "Which series follows a boy who wants to become Hokage?",
    hint: "Village rivalries, chakra, and long-running shonen energy.",
    sourceLabel: "Shonen lane",
    choices: [
      { label: "Naruto" },
      { label: "Bleach" },
      { label: "One Piece" },
      { label: "Jujutsu Kaisen" },
    ],
    answerIndex: 0,
    explanation: "Naruto centers on Naruto Uzumaki's path to becoming Hokage.",
  },
  {
    id: "anime-fullmetal",
    category: "anime",
    title: "Alchemy road",
    prompt:
      "Which anime follows two brothers searching for the Philosopher's Stone after an alchemy mistake?",
    hint: "Steel limbs and philosophical fallout.",
    sourceLabel: "Brotherhood clue",
    choices: [
      { label: "Fullmetal Alchemist: Brotherhood" },
      { label: "Soul Eater" },
      { label: "Black Clover" },
      { label: "Blue Exorcist" },
    ],
    answerIndex: 0,
    explanation: "Fullmetal Alchemist: Brotherhood follows Edward and Alphonse Elric's quest.",
  },
  {
    id: "anime-aot",
    category: "anime",
    title: "Titan pressure",
    prompt:
      "Which series begins with humanity living behind walls to survive giant humanoid monsters?",
    hint: "Big stakes from episode one.",
    sourceLabel: "Action clue",
    choices: [
      { label: "Attack on Titan" },
      { label: "Demon Slayer" },
      { label: "Tokyo Ghoul" },
      { label: "Blue Lock" },
    ],
    answerIndex: 0,
    explanation: "Attack on Titan opens with a world under siege by Titans beyond the walls.",
  },
];

const BOOK_ROUNDS: PlaygroundRound[] = [
  {
    id: "books-1984",
    category: "books",
    title: "Dystopia",
    prompt: "Which novel follows Winston Smith under a total surveillance state?",
    hint: "Big Brother is always watching.",
    sourceLabel: "Literature clue",
    choices: [
      { label: "1984" },
      { label: "Brave New World" },
      { label: "Fahrenheit 451" },
      { label: "The Trial" },
    ],
    answerIndex: 0,
    explanation: "1984 by George Orwell is the classic surveillance-state dystopia.",
  },
  {
    id: "books-midnight-library",
    category: "books",
    title: "Between lives",
    prompt:
      "Which novel centers on a library that lets the protagonist explore alternate versions of her life?",
    hint: "Modern literary comfort food with a philosophical hook.",
    sourceLabel: "Novel lane",
    choices: [
      { label: "The Midnight Library" },
      { label: "The Book Thief" },
      { label: "Where the Crawdads Sing" },
      { label: "The Vanishing Half" },
    ],
    answerIndex: 0,
    explanation:
      "The Midnight Library by Matt Haig uses an impossible library to explore alternate lives.",
  },
  {
    id: "books-satyajit",
    category: "books",
    title: "Indian literary cinema",
    prompt: "Which author wrote the Feluda stories and also made celebrated films?",
    hint: "Bengal, detective fiction, and cinema in the same mind.",
    sourceLabel: "Reader clue",
    choices: [
      { label: "Satyajit Ray" },
      { label: "Bibhutibhushan Bandyopadhyay" },
      { label: "Bankim Chandra Chatterjee" },
      { label: "Sunil Gangopadhyay" },
    ],
    answerIndex: 0,
    explanation:
      "Satyajit Ray was both a major filmmaker and a writer of detective fiction like Feluda.",
  },
];

export const PLAYGROUND_ROUNDS: Record<PlaygroundCategoryId, PlaygroundRound[]> = {
  geo: GEO_ROUNDS,
  music: MUSIC_ROUNDS,
  screen: SCREEN_ROUNDS,
  anime: ANIME_ROUNDS,
  books: BOOK_ROUNDS,
};

function hashSeed(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function getPlaygroundDayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function getDailyRound(categoryId: PlaygroundCategoryId, dayKey = getPlaygroundDayKey()) {
  const rounds = PLAYGROUND_ROUNDS[categoryId];
  const index = hashSeed(`${dayKey}:${categoryId}`) % rounds.length;
  return rounds[index];
}

export function getDailyPack(dayKey = getPlaygroundDayKey()) {
  return PLAYGROUND_CATEGORIES.map((category) => ({
    category,
    round: getDailyRound(category.id, dayKey),
  }));
}
