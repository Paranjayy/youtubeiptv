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

## Left For Later

- Full deep links for IPTV/radio station selection
- Search/filter for YouTube channels in the guide
- Mobile-first UI tuning and tighter space usage on small screens
- More route-level metadata for sharing and social previews
- Optional server-side state if we ever want cross-device resume
