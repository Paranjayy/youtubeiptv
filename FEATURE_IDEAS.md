# TubeTV Feature Ideas — "Places Not Tools" Vision

> Generated from research on WindowSwap, LifeAt, StudyStream, Radio Garden, and the broader "virtual places" internet. Updated with concrete API sources and integration notes.

---

## Core Philosophy

Most software optimizes for: **Search → Choose → Consume**
TubeTV should optimize for: **Turn on → Surf → Discover → Stay**

The internet rebuilt as a place, not a library.

---

## TIER 1: High Impact, Feasible Now (Next Sprint)

### 1. Window Views (WindowSwap-style)
**What:** Embed live webcam feeds from public cameras worldwide — rain in Tokyo, streets in Paris, beaches in Bali.

**Sources (all free, no API key):**
- **Insecam** — `http://insecam.org/en/bycountry/US/` — Public IP camera MJPEG streams by country. Scrape camera URLs, display as `<img src="...mjpg">` or `<video>` elements.
- **WindowSwap** — `window-swap.com` — Random 10-min user-submitted window clips. Can iframe the embed or extract video URLs from the page.
- **Open source alternative** — `live-earth-view.vercel.app/webcams` — Open-source project with webcam streams on a map.

**Integration approach:**
- New route `/windows` or add to Focus Room
- Grid of webcam thumbnails, click to full-screen
- Random "Surprise Window" button
- Mix with ambient sounds (rain + window view = magic)

**Why it matters:** Turns TubeTV from "watch YouTube" into "inhabit a place."

---

### 2. Virtual Cafe / Room Ambience
**What:** Layer ambient environment videos on top of or alongside the main player. Choose a "place" to study in.

**Sources (all free):**
- **YouTube embeds** — No API key needed for basic iframe embeds:
  ```
  https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1&loop=1
  ```
  Key channels: Lofi Girl, Lofi Fireplace, Study With Me streams, cafe ambience, rainy window, spaceship ambience.
- **Pixabay Music** — `pixabay.com/music/` — Royalty-free ambient/lofi tracks. Download and self-host.
- **Lofi Cafe** — `loficafe.net/embed/[station]` — Embeddable lofi stations (6 moods).

**Integration approach:**
- New "Places" tab or add to Focus Room
- Pick a place (Cafe, Library, Fireplace, Spaceship, Beach, Rainy Window)
- Auto-layer ambient sound + optional video background
- Syncs with existing focus timer

**Why it matters:** LifeAt.io has proven people want to "be somewhere" while working. We can do it without accounts or premium.

---

### 3. Weather-Triggered Ambience
**What:** Detect local weather and auto-switch ambient sounds/views to match.

**Source:**
- **Open-Meteo** — `api.open-meteo.com` — **FREE, no API key, no signup, no rate limits.** Open-source weather API.
  ```
  fetch("https://api.open-meteo.com/v1/forecast?latitude=12.97&longitude=77.59&current_weather=true")
  ```

**Integration approach:**
- On Focus Room load, fetch local weather
- Rain detected → layer rain sounds + show rainy window
- Snow → cozy fireplace
- Sunny → bright cafe
- Night → dim cyberpunk
- User can override/disable

**Why it matters:** Makes the environment feel alive and connected to the real world. "It's raining outside, so your study room is raining too."

---

## TIER 2: Medium Effort, High Delight

### 4. Study-with-me Co-presence
**What:** See who else is currently studying. Simple presence indicators. Optional camera sharing.

**Approach:**
- WebSocket or BroadcastChannel API (same-browser, no server needed for MVP)
- Show "X people studying right now" counter
- Optional: WebRTC peer connections for camera sharing
- Pomodoro sync: everyone's timer ticks together
- Chat: simple text messages during focus sessions

**Free services that do this:**
- StudyStream (`studystream.live`) — Camera-on study rooms
- CSW (`csw.live`) — 24/7 live rooms

**Our angle:** No account needed. No camera required. Just presence. "You're not alone."

---

### 5. Work-with-me Sessions
**What:** Like study-with-me but optimized for remote work / coding.

**Features:**
- Screen share (via `getDisplayMedia` API)
- Focus timer sync
- Background lofi auto-plays
- Task list sync (see what others are working on)
- "Virtual coworking" without the video call anxiety

---

### 6. Draggable Dashboard Widgets
**What:** Let users build their own study desk by arranging widgets on a grid.

**Library:** `react-grid-layout` (MIT, 21.7K stars, used by Grafana)

**Widgets:**
- Focus timer
- Sticky notes
- Ambient sound player
- Webcam window view
- YouTube channel player
- Task list
- Clock
- Weather widget
- Chat (future)

**Integration approach:**
- New `/desk` route
- Use react-grid-layout for drag-and-drop
- Persist layout to localStorage
- Default layout: timer (large) + notes + ambient + webcam

**Why it matters:** Users customize their environment. More ownership = more retention.

---

### 7. Channel Scheduling System
**What:** Fake TV guide with real clock-based programming.

**Approach:**
- Define a schedule per channel (e.g., LOFI channel: 6am-9am = "Morning Beats", 9am-12pm = "Study Focus", 12pm-5pm = "Chill Vibes", 5pm-10pm = "Night Session", 10pm-6am = "Sleep Sounds")
- The guide shows what's "on now" and what's coming up
- Auto-switch videos based on time of day
- Like actual cable TV scheduling

---

## TIER 3: Wild Ideas (Future)

### 8. Radio Garden Integration
Spin globe → jump into radio stations worldwide. Already have radio mode — enhance with a map UI.

### 9. WindowSwap-style "Send a Window"
Let users submit their own window view (record 10s clip, upload). Community-driven.

### 10. Mood-Based Channel Routing
Instead of choosing a category, choose a state:
- "I'm studying" → FOCUS LAB + rain sounds + timer
- "I can't sleep" → MELANCHOLY + ASMR + dim
- "I need energy" → PULSE FM + bright + workout
- "I'm curious" → random discovery channel + wiki drift

### 11. Ambient Sound Mixer (Advanced)
Full mixing board with:
- Multiple sound layers (rain + cafe + keyboard + fire)
- Per-layer volume sliders
- Save presets ("Study Mix", "Sleep Mix", "Work Mix")
- Crossfade between presets

### 12. Virtual Window that Changes with Time
Same webcam feed but the ambient overlay changes:
- Morning: warm orange glow
- Afternoon: bright white
- Evening: golden hour
- Night: blue/purple neon tint

### 13. Collaborative Playlists
Users vote on what plays next in a channel. Democratic TV.

---

## Free API Reference

| Service | URL | Free? | Key Needed? | Rate Limits |
|---------|-----|-------|-------------|-------------|
| Open-Meteo Weather | api.open-meteo.com | Yes | No | None |
| Freesound.org | freesound.org/apiv2 | Yes | Yes (free signup) | Moderate |
| Insecam | insecam.org | Yes | No | None |
| Wikipedia | en.wikipedia.org/api | Yes | No | Standard |
| MusicBrainz | musicbrainz.org/ws/2 | Yes | No | 1 req/sec |
| TMDB | api.themoviedb.org | Yes | Yes (free signup) | 40 req/10s |
| Open-Meteo | api.open-meteo.com | Yes | No | None |
| wttr.in | wttr.in | Yes | No | Rate limited |
| YouTube (embed) | youtube.com/embed | Yes | No | Standard |

---

## Priority Matrix

| Feature | Impact | Effort | Status |
|---------|--------|--------|--------|
| Window Views | High | Medium | Research done |
| Virtual Cafe/Ambience | High | Low | YouTube embeds work |
| Weather Ambience | High | Low | Open-Meteo free |
| Study-with-me | High | High | Needs WebSockets |
| Draggable Dashboard | Medium | Medium | react-grid-layout |
| Channel Scheduling | Medium | Medium | Logic-only |
| Mood Router | Medium | Low | Can use existing channels |
| Ambient Mixer | Medium | Low | Web Audio API |
| Radio Garden Map | Low | High | Need map library |
| Collaborative Playlists | Low | High | Needs backend |

---

## Implementation Notes

### Window Views (Insecam approach)
```
1. Fetch camera list from insecam.org/en/bycountry/{code}/
2. Parse MJPEG stream URLs
3. Display as <img> tags (MJPEG auto-plays)
4. Add random/featured selector
5. Layer ambient sounds on top
```

### Weather Ambience (Open-Meteo)
```
1. Get user geolocation (navigator.geolocation)
2. Fetch: api.open-meteo.com/v1/forecast?lat={lat}&lon={lon}&current_weather=true
3. Map weather codes to ambient presets:
   - 51-67 (drizzle/rain) → rain sounds + rainy window
   - 71-77 (snow) → fireplace + warm glow
   - 80-82 (rain showers) → heavy rain
   - 95-99 (thunderstorm) → storm ambience
   - 0-3 (clear) → sunny cafe
   - 45-48 (fog) → misty library
4. Apply preset to ambient player
```

### Draggable Dashboard
```
1. npm install react-grid-layout
2. Import ResponsiveGridLayout
3. Define widget components (Timer, Notes, Ambient, etc.)
4. Define initial layout: [{i: "timer", x: 0, y: 0, w: 6, h: 4}, ...]
5. Save layout changes to localStorage
6. Restore on page load
```
