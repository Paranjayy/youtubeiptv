# Feature Roadmap

## Current Saturation

```text
Core TV / IPTV / Radio      ████████████████████ 95%
Recent history / resume     ██████████████████░░ 80%
Discovery / timepass        ███████░░░░░░░░░░░░░ 35%
Playground / mini-games     ██████░░░░░░░░░░░░░░ 30%
Mobile experience           ████████░░░░░░░░░░░░ 40%
Mini-games / experiments    ███░░░░░░░░░░░░░░░░░ 15%
Sharing / SEO               ████████████████░░░░ 80%
```

## What We Should Build Next

### Discovery Desk
- Wikipedia random article stream
- "On this day" news-like feed
- Artist trail / discoverography
- Search for topics, people, and bands
- One-click "surprise me" resurfacing

### Playground
- Geo daily challenge
- Music guesser
- Movies / shows clue cards
- Anime guesser
- Books / literature rounds
- Streaks, saved answers, and future daily mode expansion

### Focus Room
- Pomodoro / study-with-me room with timer, sticky notes, and a sketch canvas
- Local-first persistence for solo prep sessions
- Future shared-room mode with invites, avatars, and co-study presence once auth/db exists

### Timepass Games
- GeoGuessr-style browser game
- Wordle-style daily puzzle
- Music Guesser
- Quote / trivia / obscure fact rounds
- Score streaks and daily resets

### Small but High Impact
- Better mobile controls for the TV shell
- Custom 404 page with a proper way back in
- Sharper social/share previews
- Search history and saved searches
- Searchable jump palette for routes, channels, and recent items

## Build Order

1. Discovery Desk
2. Playground daily deck
3. Focus Room / study mode
4. Wiki/artist search polish
5. Mobile cleanup
6. Sharing and metadata polish

## Notes

- Keep the TV shell and the discovery/games layer distinct so the main experience stays fast.
- Prefer public, low-friction sources over anything that needs auth for the first version.
- If a feature starts feeling heavy, split it into its own route instead of squeezing it into the TV page.
