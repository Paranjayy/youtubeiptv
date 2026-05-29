import { createFileRoute, Link } from '@tanstack/react-router';
import { useState, useEffect, useRef } from 'react';

export const Route = createFileRoute('/roadmap')({
  head: () => ({
    meta: [
      { title: 'Roadmap — TubeTV' },
      { name: 'description', content: 'Feature roadmap and saturation tracker for TubeTV.' },
    ],
  }),
  component: RoadmapPage,
});

// ─── Nav links ───────────────────────────────────────────────────────────────
const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/discover', label: 'Discover' },
  { to: '/playground', label: 'Playground' },
  { to: '/focus', label: 'Focus' },
  { to: '/vibes', label: 'Vibes' },
  { to: '/wordle', label: 'Wordle' },
  { to: '/roadmap', label: 'Roadmap' },
  { to: '/reader', label: 'Reader' },
];

// ─── Saturation data ──────────────────────────────────────────────────────────
type SaturationItem = {
  label: string;
  value: number;
  color: string;
  isNew?: boolean;
};

const SATURATION_ITEMS: SaturationItem[] = [
  { label: 'Core TV / IPTV / Radio', value: 95, color: '#00ff88' },
  { label: 'YouTube Channels (40 curated)', value: 100, color: '#00ff88' },
  { label: 'Discovery Desk', value: 65, color: '#00eeff' },
  { label: 'Playground Games', value: 75, color: '#ff44cc' },
  { label: 'Focus Room', value: 90, color: '#ffbb00' },
  { label: 'News Aggregator', value: 100, color: '#00eeff', isNew: true },
  { label: 'Wordle Daily', value: 100, color: '#ff44cc', isNew: true },
  { label: 'Vibes Explorer', value: 100, color: '#ff44cc', isNew: true },
  { label: 'Roadmap Page', value: 100, color: '#a855f7', isNew: true },
  { label: 'Reader Mode', value: 80, color: '#00eeff', isNew: true },
  { label: 'Mobile Experience', value: 20, color: '#ffbb00' },
  { label: 'Overall', value: 75, color: '#ffffff' },
];

// ─── Feature card data ────────────────────────────────────────────────────────
type Category = 'tv' | 'discovery' | 'games' | 'focus' | 'future';

const CATEGORY_COLORS: Record<Category, string> = {
  tv:        '#00ff88',
  discovery: '#00eeff',
  games:     '#ff44cc',
  focus:     '#ffbb00',
  future:    '#a855f7',
};

type FeatureCard = {
  name: string;
  detail: string;
  category: Category;
  emoji: string;
};

const SHIPPED: FeatureCard[] = [
  { name: 'TV / IPTV / Radio', detail: 'Live streams from 150+ countries & genre radio', category: 'tv', emoji: '📺' },
  { name: 'YouTube 40 Channels', detail: 'Curated set across news, edu, music & more', category: 'tv', emoji: '▶️' },
  { name: 'Discovery Desk', detail: 'Wikipedia rabbit-holes + MusicBrainz lookups', category: 'discovery', emoji: '🔭' },
  { name: 'News Aggregator', detail: 'Live headlines from global RSS feeds', category: 'discovery', emoji: '📰' },
  { name: 'Playground (5 categories)', detail: 'Trivia, Snake, Memory, Math Blitz, Reaction', category: 'games', emoji: '🕹️' },
  { name: 'Wordle Daily', detail: 'Classic 6-try word game, refreshes at midnight', category: 'games', emoji: '🟩' },
  { name: 'Vibes Explorer', detail: 'Mood-based music discovery across 12 vibes', category: 'focus', emoji: '🎵' },
  { name: 'Focus Room', detail: 'Pomodoro + ambient sounds + task list', category: 'focus', emoji: '🧘' },
  { name: 'Roadmap Page', detail: 'This very page you\'re reading right now', category: 'future', emoji: '🗺️' },
];

const IN_PROGRESS: FeatureCard[] = [
  { name: 'Mobile Responsiveness', detail: 'Full touch-first layout across all pages', category: 'tv', emoji: '📱' },
  { name: 'Reader Mode', detail: 'Wikipedia deep-reading with annotations', category: 'discovery', emoji: '📖' },
  { name: 'RSS Feeds', detail: 'Subscribe to custom RSS inside Discovery', category: 'discovery', emoji: '📡' },
  { name: 'Artist Discography Albums', detail: 'Full discography explorer via MusicBrainz', category: 'discovery', emoji: '💿' },
  { name: 'Movies / Series Search', detail: 'TMDB-powered search with trailers', category: 'tv', emoji: '🎬' },
  { name: 'Score Streaks', detail: 'Wordle + Playground daily streaks & leaderboard', category: 'games', emoji: '🔥' },
];

const PARKING_LOT: FeatureCard[] = [
  { name: 'Real-Debrid Torrent Player', detail: 'Stream cached torrents instantly by converting magnet links to HTTPS streams using Real-Debrid API (Highly feasible; uses HTML5 / Hls.js player).', category: 'tv', emoji: '⚡' },
  { name: 'Polymarket & Kalshi Tickers', detail: 'Real-time prediction market probability tracking for sports, tech, elections, and macro news using public REST APIs.', category: 'discovery', emoji: '📈' },
  { name: 'Mock AI Stock Simulator', detail: 'A trading playground allowing user-configured AI agents to paper-trade live stock tickers without real money.', category: 'games', emoji: '📊' },
  { name: 'Google News RSS Panel', detail: 'Feed topics from Google News RSS categories styled in a sleek console grid layout.', category: 'discovery', emoji: '📰' },
  { name: '123movies-style Catalog', detail: 'Movie catalog indexing TMDb metadata with integrated direct source player streams (e.g. vidsrc.to, superembed) in custom player shell.', category: 'tv', emoji: '🎬' },
  { name: 'Study-with-me Co-presence', detail: 'Real-time shared focus sessions', category: 'focus', emoji: '👥' },
  { name: 'GeoGuessr-style Game', detail: 'Guess location from street-view screenshots', category: 'games', emoji: '🌍' },
  { name: 'Daily Crossword', detail: 'NYT-style crossword with auto-check', category: 'games', emoji: '✏️' },
  { name: 'Social Sharing', detail: 'Share clips, playlists & scores', category: 'future', emoji: '🔗' },
  { name: 'Offline PWA', detail: 'Service worker for offline games + notes', category: 'future', emoji: '📦' },
];

// ─── Timeline milestones ──────────────────────────────────────────────────────
type Milestone = { quarter: string; label: string; done: boolean };
const MILESTONES: Milestone[] = [
  { quarter: 'Q1 2025', label: 'TV + IPTV + Radio MVP', done: true },
  { quarter: 'Q2 2025', label: 'YouTube Channels + Discovery Desk', done: true },
  { quarter: 'Q2 2025', label: 'Playground Games (5 categories)', done: true },
  { quarter: 'Q3 2025', label: 'Focus Room + Wordle + Vibes', done: true },
  { quarter: 'Q3 2025', label: 'News Aggregator + Reader Mode', done: true },
  { quarter: 'Q4 2025', label: 'Mobile Polish + Score Streaks', done: false },
  { quarter: 'Q1 2026', label: 'Movies / Series + RSS Feeds', done: false },
  { quarter: 'Q2 2026', label: 'Offline PWA + Social Sharing', done: false },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SaturationBar({ item, animate }: { item: SaturationItem; animate: boolean }) {
  const isOverall = item.label === 'Overall';
  return (
    <div className={`${isOverall ? 'mt-2 pt-4 border-t border-white/10' : ''}`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-white/80 flex items-center gap-2">
          {item.label}
          {item.isNew && (
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: `${item.color}30`, color: item.color, border: `1px solid ${item.color}66` }}
            >
              NEW
            </span>
          )}
        </span>
        <span className="text-sm font-bold tabular-nums" style={{ color: item.color }}>
          {item.value}%
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-[1.4s] ease-out"
          style={{
            width: animate ? `${item.value}%` : '0%',
            background: `linear-gradient(90deg, ${item.color}cc, ${item.color})`,
            boxShadow: animate ? `0 0 8px ${item.color}88` : 'none',
          }}
        />
      </div>
    </div>
  );
}

function FeatureCardComp({ card }: { card: FeatureCard }) {
  const color = CATEGORY_COLORS[card.category];
  return (
    <div
      className="group relative flex items-start gap-3 p-4 rounded-xl border border-white/10 backdrop-blur-sm transition-all duration-200 hover:border-white/20 hover:-translate-y-0.5"
      style={{
        background: 'rgba(255,255,255,0.03)',
        borderLeft: `3px solid ${color}`,
      }}
    >
      {/* Subtle glow on hover */}
      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 0 50%, ${color}0e 0%, transparent 60%)` }}
      />
      <span className="text-2xl shrink-0 relative z-10">{card.emoji}</span>
      <div className="relative z-10 min-w-0">
        <div className="font-semibold text-white/90 text-sm leading-tight">{card.name}</div>
        <div className="text-white/40 text-xs mt-0.5 leading-relaxed">{card.detail}</div>
      </div>
    </div>
  );
}

function Column({
  title,
  icon,
  cards,
  accentColor,
}: {
  title: string;
  icon: string;
  cards: FeatureCard[];
  accentColor: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">{icon}</span>
        <h2 className="text-base font-bold text-white/90">{title}</h2>
        <span
          className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ background: `${accentColor}20`, color: accentColor }}
        >
          {cards.length}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {cards.map((card) => (
          <FeatureCardComp key={card.name} card={card} />
        ))}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
function RoadmapPage() {
  const [animate, setAnimate] = useState(false);
  const barsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setAnimate(true); },
      { threshold: 0.1 },
    );
    if (barsRef.current) observer.observe(barsRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen text-white" style={{ background: 'oklch(0.08 0.010 255)' }}>
      {/* Ambient glow blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #a855f7, transparent 70%)' }} />
        <div className="absolute top-1/2 -right-48 w-96 h-96 rounded-full opacity-8" style={{ background: 'radial-gradient(circle, #00ff88, transparent 70%)' }} />
      </div>

      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b border-white/10 backdrop-blur-xl bg-black/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <Link to="/" className="font-black text-lg tracking-tight text-white/90 hover:text-white transition-colors">
              Tube<span className="text-red-500">TV</span>
            </Link>
            <div className="flex items-center gap-0.5 text-sm flex-wrap justify-end">
              {NAV_LINKS.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className="px-2.5 py-1.5 rounded-lg text-white/55 hover:text-white hover:bg-white/10 transition-all text-xs"
                  activeProps={{ className: 'px-2.5 py-1.5 rounded-lg text-white bg-white/15 text-xs' }}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* Hero */}
        <div className="pt-14 pb-10 text-center">
          <p className="text-white/40 text-xs font-bold tracking-[0.35em] uppercase mb-3">Feature Tracker</p>
          <h1 className="text-5xl sm:text-6xl font-black tracking-tight mb-4 bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(135deg, #ffffff 30%, #a855f7)' }}>
            Roadmap
          </h1>
          <p className="text-white/50 max-w-xl mx-auto text-base leading-relaxed">
            What's shipped, what's cooking, and what's parked. Built in the open, one feature at a time.
          </p>
        </div>

        {/* ── Timeline ribbon ─────────────────────────────────────────────── */}
        <section className="mb-12 overflow-x-auto pb-2 scrollbar-thin">
          <div className="min-w-max flex items-center gap-0">
            {MILESTONES.map((m, i) => (
              <div key={i} className="flex items-center">
                {/* Node */}
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className="w-3 h-3 rounded-full border-2 transition-all duration-300"
                    style={{
                      borderColor: m.done ? '#00ff88' : '#ffffff30',
                      background: m.done ? '#00ff88' : 'transparent',
                      boxShadow: m.done ? '0 0 8px #00ff8888' : 'none',
                    }}
                  />
                  <div className="text-center">
                    <div className="text-[10px] font-bold text-white/40">{m.quarter}</div>
                    <div className={`text-xs font-medium mt-0.5 max-w-[110px] text-center leading-tight ${m.done ? 'text-white/80' : 'text-white/35'}`}>
                      {m.label}
                    </div>
                  </div>
                </div>
                {/* Connector */}
                {i < MILESTONES.length - 1 && (
                  <div
                    className="w-14 h-[2px] mx-1 shrink-0"
                    style={{
                      background: m.done && MILESTONES[i + 1].done
                        ? 'linear-gradient(90deg, #00ff88, #00ff88)'
                        : m.done
                        ? 'linear-gradient(90deg, #00ff88, #ffffff20)'
                        : '#ffffff15',
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── Saturation bars ──────────────────────────────────────────────── */}
        <section
          ref={barsRef}
          className="mb-12 p-6 rounded-2xl border border-white/10"
          style={{ background: 'rgba(255,255,255,0.03)' }}
        >
          <h2 className="text-xs font-bold tracking-widest text-white/40 uppercase mb-5">Saturation — how complete each area feels</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-4">
            {SATURATION_ITEMS.map((item) => (
              <SaturationBar key={item.label} item={item} animate={animate} />
            ))}
          </div>
        </section>

        {/* ── Legend ───────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          {(Object.entries(CATEGORY_COLORS) as [Category, string][]).map(([cat, color]) => (
            <div key={cat} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
              <span className="text-xs text-white/50 capitalize">
                {cat === 'tv' ? 'TV / Streaming' : cat === 'discovery' ? 'Discovery / News' : cat === 'games' ? 'Games' : cat === 'focus' ? 'Focus' : 'Future'}
              </span>
            </div>
          ))}
        </div>

        {/* ── Three-column board ───────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Column title="Shipped" icon="✓" cards={SHIPPED} accentColor="#00ff88" />
          <Column title="In Progress" icon="⚡" cards={IN_PROGRESS} accentColor="#ffbb00" />
          <Column title="Parking Lot" icon="💡" cards={PARKING_LOT} accentColor="#a855f7" />
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-white/20 text-xs">
          Last updated May 2025 · {SHIPPED.length + IN_PROGRESS.length + PARKING_LOT.length} features tracked
        </div>
      </main>
    </div>
  );
}
