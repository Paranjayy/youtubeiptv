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
  {
    id: "books-dune",
    category: "books",
    title: "Desert epic",
    prompt: "Which sci-fi novel follows Paul Atreides on the desert planet Arrakis?",
    hint: "Spice, sandworms, and prophecy.",
    sourceLabel: "Sci-fi shelf",
    choices: [
      { label: "Dune" },
      { label: "Foundation" },
      { label: "Hyperion" },
      { label: "Ender's Game" },
    ],
    answerIndex: 0,
    explanation: "Dune by Frank Herbert is set on Arrakis and follows Paul Atreides's rise to power.",
  },
  {
    id: "books-kafka",
    category: "books",
    title: "Metamorphosis",
    prompt: "Which author wrote the novella in which Gregor Samsa wakes up as an insect?",
    hint: "Surreal, existential, and very famous opening line.",
    sourceLabel: "Classic shelf",
    choices: [
      { label: "Franz Kafka" },
      { label: "Albert Camus" },
      { label: "Jean-Paul Sartre" },
      { label: "Fyodor Dostoevsky" },
    ],
    answerIndex: 0,
    explanation: "Franz Kafka's The Metamorphosis opens with Gregor Samsa's bizarre transformation.",
  },
];

const MORE_GEO_ROUNDS: PlaygroundRound[] = [
  {
    id: "geo-machu-picchu",
    category: "geo",
    title: "Lost city",
    prompt: "Which ancient Incan citadel sits high in the Andes mountains of Peru?",
    hint: "Clouds, clouds, and a famous citadel.",
    sourceLabel: "World heritage",
    choices: [
      { label: "Machu Picchu" },
      { label: "Chichen Itza" },
      { label: "Petra" },
      { label: "Angkor Wat" },
    ],
    answerIndex: 0,
    explanation: "Machu Picchu is the 15th-century Inca citadel perched high in the Peruvian Andes.",
  },
  {
    id: "geo-iceland",
    category: "geo",
    title: "Northern lights",
    prompt: "Which island nation has the most active volcanoes per capita and the Northern Lights?",
    hint: "It's not as cold as it sounds.",
    sourceLabel: "Nordic clue",
    choices: [
      { label: "Iceland" },
      { label: "Greenland" },
      { label: "Faroe Islands" },
      { label: "Norway" },
    ],
    answerIndex: 0,
    explanation: "Iceland sits on the Mid-Atlantic Ridge and has some of the world's most active volcanic systems.",
  },
];

const MORE_SCREEN_ROUNDS: PlaygroundRound[] = [
  {
    id: "screen-parasite",
    category: "screen",
    title: "Class tension",
    prompt: "Which film by Bong Joon-ho won the Palme d'Or and Best Picture at the 2020 Oscars?",
    hint: "Two families, one house, one unforgettable twist.",
    sourceLabel: "World cinema",
    choices: [
      { label: "Parasite" },
      { label: "Burning" },
      { label: "Oldboy" },
      { label: "The Handmaiden" },
    ],
    answerIndex: 0,
    explanation: "Parasite became the first non-English film to win Best Picture at the Academy Awards.",
  },
  {
    id: "screen-dark",
    category: "screen",
    title: "Time loops",
    prompt: "Which German Netflix series deals with a small town, a wormhole, and four interlinked families across time?",
    hint: "Cycles, caves, and Knoten.",
    sourceLabel: "TV clue",
    choices: [
      { label: "Dark" },
      { label: "1899" },
      { label: "Babylon Berlin" },
      { label: "How to Sell Drugs Online" },
    ],
    answerIndex: 0,
    explanation: "Dark is a German mystery-thriller featuring time travel across multiple generations.",
  },
];

const MORE_MUSIC_ROUNDS: PlaygroundRound[] = [
  {
    id: "music-radiohead",
    category: "music",
    title: "Art rock kings",
    prompt: "Which band released 'OK Computer' in 1997, widely considered one of the greatest albums ever?",
    hint: "Thom Yorke, paranoid android, creep.",
    sourceLabel: "Discoverography",
    choices: [
      { label: "Radiohead" },
      { label: "Portishead" },
      { label: "Massive Attack" },
      { label: "The Verve" },
    ],
    answerIndex: 0,
    explanation: "Radiohead's OK Computer is a landmark album that blended rock with electronic experimentation.",
  },
  {
    id: "music-beethoven",
    category: "music",
    title: "Classical titan",
    prompt: "Which composer wrote the famous 'Ode to Joy' in his Ninth Symphony, while profoundly deaf?",
    hint: "Composed while unable to hear a single note.",
    sourceLabel: "Classical lane",
    choices: [
      { label: "Ludwig van Beethoven" },
      { label: "Wolfgang Amadeus Mozart" },
      { label: "Johann Sebastian Bach" },
      { label: "Franz Schubert" },
    ],
    answerIndex: 0,
    explanation: "Beethoven composed the Ninth Symphony, including 'Ode to Joy', after losing his hearing completely.",
  },
];

const MORE_ANIME_ROUNDS: PlaygroundRound[] = [
  {
    id: "anime-vinland",
    category: "anime",
    title: "Viking saga",
    prompt: "Which anime follows Thorfinn seeking revenge and eventually redemption in medieval Europe?",
    hint: "Norse warriors, Iceland, and the English coast.",
    sourceLabel: "Historical lane",
    choices: [
      { label: "Vinland Saga" },
      { label: "Berserk" },
      { label: "Dororo" },
      { label: "Golden Kamuy" },
    ],
    answerIndex: 0,
    explanation: "Vinland Saga is a historical epic following Viking warrior Thorfinn through revenge and growth.",
  },
  {
    id: "anime-cowboy-bebop",
    category: "anime",
    title: "Space jazz",
    prompt: "Which anime follows bounty hunters aboard the Bebop spaceship through jazz-infused adventures?",
    hint: "See you space cowboy.",
    sourceLabel: "Classic lane",
    choices: [
      { label: "Cowboy Bebop" },
      { label: "Outlaw Star" },
      { label: "Trigun" },
      { label: "Space Dandy" },
    ],
    answerIndex: 0,
    explanation: "Cowboy Bebop is a genre-defining 1998 anime mixing jazz, noir, and sci-fi.",
  },
];

export const PLAYGROUND_ROUNDS: Record<PlaygroundCategoryId, PlaygroundRound[]> = {
  geo: [...GEO_ROUNDS, ...MORE_GEO_ROUNDS],
  music: [...MUSIC_ROUNDS, ...MORE_MUSIC_ROUNDS],
  screen: [...SCREEN_ROUNDS, ...MORE_SCREEN_ROUNDS],
  anime: [...ANIME_ROUNDS, ...MORE_ANIME_ROUNDS],
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
