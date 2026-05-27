# Implementation Notes

## What We Added

- Canonical channel slugs at `/channels/:slug`
- Shared TV page shell for the root and slugged routes
- Better YouTube fallback behavior when a video/embed fails
- Random channel jump for faster discovery
- Copy-link action with toast feedback
- Query-param restoration for shared IPTV/radio links
- Persistent notes file so future changes do not lose context

## Decisions Made

- I kept the existing retro-TV UI language intact instead of redesigning the shell.
- I used the channel ID as the slug because it is stable, short, and safe for URLs.
- I did not try to deep-link a specific IPTV or radio stream URL because those are ephemeral and can change or disappear.
- I did allow IPTV/radio share links to restore mode and country because those are stable enough to be useful and do not depend on one live stream.
- I used localStorage for lightweight persistence because it matches the current app style and avoids introducing backend state.

## Tradeoffs

- The share link is canonical for YouTube channels, but IPTV and radio only serialize mode and country, not a specific stream.
- The share link now restores IPTV/radio mode and country, but still does not pin a single stream because that would be fragile.
- The shared page component is larger now, but it keeps the behavior in one place and avoids route-specific duplication.
- The app still ships a large client bundle because the existing player stack is heavy and feature-rich.
- Vercel deployment protection is currently part of the project setup, so the `.vercel.app` hostname can behave like a protected deployment instead of a public preview. I verified the project and alias wiring, but the live hostname still depends on the team/project protection settings outside the repo.
- Vercel needed the Nitro `vercel` preset because the app is TanStack Start SSR, not a plain SPA, and the hand-written server shim could not resolve TanStack's generated router entry at runtime.
- The first Vercel attempt used a hand-written server shim and route rewrite, but the real fix was switching to TanStack Start's official `tanstackStart()` + `nitro({ preset: "vercel" })` flow so the generated `#tanstack-router-entry` import resolves correctly.
- A render-time crash showed up in `TubeTVPage` because `changeChannel` and `openRandomChannel` read `openChannel` before it was initialized. Reordering those callbacks fixed the TDZ crash and allowed the page to render normally again.
- IPTV and radio were originally state-only, so I added canonical `/iptv/:country` and `/radio/:country` routes and made old `?mode=&country=` links self-canonicalize when they appear.
- Radio uses uppercase country codes in app state because the existing country labels and API helpers expect that shape, but the public URL stays lowercase for consistency with the other slugs.
- IPTV and radio item selection now has a canonical second slug segment too, so exact picks can live at `/iptv/:country/:stream` and `/radio/:country/:station` while still falling back cleanly to the country-level page if the item can no longer be resolved.
- I added a persistent recent-history stack so YouTube, IPTV, and radio picks can be resumed across sessions from localStorage, with a visible recent strip in the guide and a quick Resume action in the bottom bar.
- I added a separate `/discover` route for a timepass / discovery desk with Wikipedia on-this-day items, random article cards, and MusicBrainz artist search so the app can grow into news/wiki/music exploration without bloating the TV shell.
- I added a `/playground` route with a daily pack of Geo, Music, Screen, Anime, and Books guesser rounds so the mini-game idea has a real home and the future game lanes stay modular.
- I saved the broader feature direction in [feature-roadmap.md](/Users/paranjay/Developer/youtubeiptv/feature-roadmap.md) so the GeoGuessr / Wordle / music guesser ideas do not get lost between sessions.
- I kept the discovery surface on public endpoints that do not need a backend or auth for the first pass, which makes it easy to ship but means the experience can still be a little rate-limit or network dependent.
- I could not complete a local Vite production build in this shell because the Rollup native binary in `node_modules` hit a macOS code-signing mismatch. TypeScript and ESLint still pass for the touched files, and Vercel remote builds should be able to validate the production bundle once the commit is pushed.

## Left For Later

- More history affordances, like filtering or clearing recent items
- Discovery Desk follow-ups: curated topics, richer news view, and a mini-game launcher
- Playground follow-ups: streaks, harder difficulty modes, daily shares, and more categories like shows and comics
- Mobile-first UI tuning and tighter space usage on small screens
- More route-level metadata for sharing and social previews
- Optional server-side state if we ever want cross-device resume
