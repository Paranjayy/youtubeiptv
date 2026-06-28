# Feature Roadmap

## Shipped / Live

```text
Core TV / IPTV / Radio      ████████████████████ 95%
Recent history / resume     ██████████████████░░ 80%
Discovery / timepass        ██████████████████░░ 80%
Playground daily deck       ████████████████████ 90%
Focus Room (Pomodoro)       ████████████████████ 90%
Wordle daily word game      ████████████████████ 100% ✓
Vibes music mood explorer   ████████████████████ 100% ✓
Sharing / SEO               ████████████████░░░░ 80%
Mobile cleanup              ██████████████░░░░░░ 65% ✓ NEW
```

## What We Should Build Next

### Discovery Desk
- Wikipedia random article stream ✓ shipped
- "On this day" news-like feed ✓ shipped
- Artist trail / discoverography ✓ shipped
- Search for topics, people, and bands ✓ shipped
- Trending music / news from external feeds (RSS/HN/Reddit)

### Playground
- Geo daily challenge ✓ shipped
- Music guesser ✓ shipped (5 categories, 25+ rounds)
- Movies / shows clue cards ✓ shipped
- Anime guesser ✓ shipped
- Books / literature rounds ✓ shipped
- Wordle-style daily word game ✓ shipped
- Streaks, saved answers, and daily mode expansion
- Score leaderboard (local-first, no auth required)
- More questions per category (bulk import from trivia APIs)

### Vibes / Music
- Mood-based music explorer ✓ shipped (/vibes)
- Artist discoverography search ✓ shipped
- Song discovery by mood/genre/era
- MusicBrainz artist deep dives

### Focus Room
- Pomodoro / study-with-me room ✓ shipped
- Sticky notes with colors ✓ shipped
- Sketch canvas ✓ shipped
- Session statistics ✓ shipped
- Future shared-room mode with invites and presence once auth/db exists

### Small but High Impact
- Better mobile controls for TV shell
- Jump palette with Wordle + Vibes ✓ shipped
- More vibrant color system + glassmorphism ✓ shipped
- Search history and saved searches
- Compact mobile guide and schedule rails
- Torrent/debrid player (Popcorn-style via Real-Debrid / free sources)

## Ideas Parking Lot

- **Free movie player**: Popcorn-style torrent/debrid (Real-Debrid or open public domain sources)
- **Study-with-me co-presence**: Face bubbles, shared timers, invite links (needs auth)
- **GeoGuessr-style**: Street panorama guessing, distance scoring
- **News feed**: RSS aggregator for tech/culture/world news in a channel-surf UI
- **Quote / trivia rounds**: Random philosophy, science, or pop culture quotes
- **Daily crossword**: Mini 5×5 crossword generated from a word list

## Build Order

1. ~~Discovery Desk~~ ✓ Done
2. ~~Playground daily deck~~ ✓ Done
3. ~~Focus Room / study mode~~ ✓ Done
4. ~~Wordle daily word game~~ ✓ Done
5. ~~Vibes music mood explorer~~ ✓ Done
6. ~~Mobile cleanup~~ ✓ Done
7. ~~Trending news / RSS feeds in Discover~~ ✓ Done
8. Score streaks and daily leaderboard
9. ~~Sports Desk overhaul~~ ✓ Done
10. HLS Player upgrades (subtitles, controls)
11. Torrent/debrid player exploration
12. Sharing and metadata polish

## Notes

- Keep the TV shell and the discovery/games layer distinct so the main experience stays fast.
- Prefer public, low-friction sources over anything that needs auth for the first version.
- If a feature starts feeling heavy, split it into its own route instead of squeezing it into the TV page.
- Color system now uses full oklch neon palette with glow utilities - apply liberally!
