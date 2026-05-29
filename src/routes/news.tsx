import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Newspaper,
  TrendingUp,
  Cpu,
  Globe,
  Film,
  BookOpen,
  Tv2,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Clock,
  MessageSquare,
  ArrowUp,
  Gamepad2,
  Music2,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/news')({
  head: () => ({
    meta: [
      { title: 'News — TubeTV' },
      {
        name: 'description',
        content: 'Live news aggregator — HackerNews, Tech, World, Movies, Books, Anime.',
      },
    ],
  }),
  component: NewsPage,
});

// ─── Types ────────────────────────────────────────────────────────────────────

interface HNItem {
  id: number;
  title: string;
  url?: string;
  score: number;
  by: string;
  time: number;
  descendants?: number;
  type: string;
}

interface NewsItem {
  id: string | number;
  title: string;
  url: string;
  domain?: string;
  score: number;
  commentCount: number;
  author: string;
  time: number;
  thumbnail?: string;
}

// ─── Tabs config ──────────────────────────────────────────────────────────────

type TabId = 'hn' | 'tech' | 'world' | 'movies' | 'books' | 'anime';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  accent: string;
  glowClass: string;
  borderClass: string;
  bgGradient: string;
  heroGradient: string;
  subreddit?: string;
}

const TABS: Tab[] = [
  {
    id: 'hn',
    label: 'HN',
    icon: <TrendingUp className="h-3.5 w-3.5" />,
    accent: 'oklch(0.86 0.16 72)',
    glowClass: 'neon-border-amber',
    borderClass: 'border-amber-400/40',
    bgGradient: 'from-amber-500/10 via-orange-500/5 to-transparent',
    heroGradient:
      'from-amber-500/20 via-orange-600/10 to-transparent',
  },
  {
    id: 'tech',
    label: 'Tech',
    icon: <Cpu className="h-3.5 w-3.5" />,
    accent: 'oklch(0.84 0.14 205)',
    glowClass: 'neon-border-cyan',
    borderClass: 'border-cyan-400/40',
    bgGradient: 'from-cyan-500/10 via-blue-500/5 to-transparent',
    heroGradient: 'from-cyan-500/20 via-blue-600/10 to-transparent',
    subreddit: 'technology',
  },
  {
    id: 'world',
    label: 'World',
    icon: <Globe className="h-3.5 w-3.5" />,
    accent: 'oklch(0.82 0.18 152)',
    glowClass: 'neon-border-green',
    borderClass: 'border-green-400/40',
    bgGradient: 'from-green-500/10 via-emerald-500/5 to-transparent',
    heroGradient: 'from-green-500/20 via-emerald-600/10 to-transparent',
    subreddit: 'worldnews',
  },
  {
    id: 'movies',
    label: 'Movies',
    icon: <Film className="h-3.5 w-3.5" />,
    accent: 'oklch(0.74 0.18 335)',
    glowClass: 'neon-border-pink',
    borderClass: 'border-pink-400/40',
    bgGradient: 'from-pink-500/10 via-rose-500/5 to-transparent',
    heroGradient: 'from-pink-500/20 via-rose-600/10 to-transparent',
    subreddit: 'movies',
  },
  {
    id: 'books',
    label: 'Books',
    icon: <BookOpen className="h-3.5 w-3.5" />,
    accent: 'oklch(0.82 0.14 60)',
    glowClass: 'neon-border-amber',
    borderClass: 'border-yellow-400/40',
    bgGradient: 'from-yellow-500/10 via-amber-500/5 to-transparent',
    heroGradient: 'from-yellow-500/20 via-amber-600/10 to-transparent',
    subreddit: 'books',
  },
  {
    id: 'anime',
    label: 'Anime',
    icon: <Zap className="h-3.5 w-3.5" />,
    accent: 'oklch(0.72 0.16 305)',
    glowClass: 'neon-border-purple',
    borderClass: 'border-purple-400/40',
    bgGradient: 'from-purple-500/10 via-violet-500/5 to-transparent',
    heroGradient: 'from-purple-500/20 via-violet-600/10 to-transparent',
    subreddit: 'anime',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(unixSeconds: number): string {
  const diff = Math.floor(Date.now() / 1000) - unixSeconds;
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

// ─── Data fetching ────────────────────────────────────────────────────────────

async function fetchHN(): Promise<NewsItem[]> {
  const res = await fetch(
    'https://hacker-news.firebaseio.com/v0/topstories.json',
  );
  if (!res.ok) throw new Error('Failed to load HN stories');
  const ids: number[] = await res.json();
  const top30 = ids.slice(0, 30);

  const items = await Promise.allSettled(
    top30.map((id) =>
      fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(
        (r) => r.json() as Promise<HNItem>,
      ),
    ),
  );

  return items
    .filter(
      (r): r is PromiseFulfilledResult<HNItem> =>
        r.status === 'fulfilled' && r.value?.title != null,
    )
    .map((r) => {
      const item = r.value;
      const url = item.url ?? `https://news.ycombinator.com/item?id=${item.id}`;
      return {
        id: item.id,
        title: item.title,
        url,
        domain: getDomain(url),
        score: item.score,
        commentCount: item.descendants ?? 0,
        author: item.by,
        time: item.time,
      };
    });
}

async function fetchReddit(subreddit: string): Promise<NewsItem[]> {
  const url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=25&raw_json=1`;
  let res: Response;
  try {
    res = await fetch(url);
    if (!res.ok) throw new Error('cors');
  } catch {
    // Fallback to allorigins proxy
    res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`);
    if (!res.ok) throw new Error(`Failed to load r/${subreddit}`);
  }
  const data = await res.json();
  const posts = data?.data?.children ?? [];

  return posts
    .filter((c: any) => c?.data?.title)
    .map((c: any) => {
      const p = c.data;
      const thumb =
        p.thumbnail &&
        p.thumbnail !== 'self' &&
        p.thumbnail !== 'default' &&
        p.thumbnail !== 'nsfw' &&
        p.thumbnail !== 'spoiler' &&
        p.thumbnail.startsWith('http')
          ? p.thumbnail
          : undefined;
      return {
        id: p.id,
        title: p.title,
        url: p.url,
        domain: getDomain(p.url),
        score: p.score,
        commentCount: p.num_comments,
        author: p.author,
        time: p.created_utc,
        thumbnail: thumb,
      } satisfies NewsItem;
    });
}

// ─── Components ───────────────────────────────────────────────────────────────

function SkeletonCard({ wide = false }: { wide?: boolean }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-white/8 bg-white/[0.03] p-5',
        wide ? 'col-span-full' : '',
      )}
    >
      <div className="flex flex-col gap-3 animate-pulse">
        <div className="h-3 w-16 rounded-full bg-white/10" />
        <div className="h-5 w-full rounded-lg bg-white/10" />
        <div className="h-4 w-3/4 rounded-lg bg-white/8" />
        <div className="flex gap-4">
          <div className="h-3 w-10 rounded-full bg-white/8" />
          <div className="h-3 w-10 rounded-full bg-white/8" />
          <div className="h-3 w-14 rounded-full bg-white/8" />
        </div>
      </div>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <div className="rounded-full border border-red-500/30 bg-red-500/10 p-4">
        <RefreshCw className="h-6 w-6 text-red-400" />
      </div>
      <div>
        <p className="text-sm font-medium text-zinc-300">Failed to load</p>
        <p className="mt-1 text-xs text-zinc-500">{message}</p>
      </div>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-zinc-100 transition-colors hover:bg-white/10 active:scale-95"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Retry
      </button>
    </div>
  );
}

function HeroCard({ item, tab }: { item: NewsItem; tab: Tab }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative col-span-full block overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] transition-all duration-300 hover:border-white/20 hover:shadow-2xl"
      style={{
        boxShadow: `0 0 0 1px oklch(1 0 0 / 0.08), 0 8px 48px oklch(0 0 0 / 0.5)`,
      }}
    >
      {/* Animated gradient border shimmer */}
      <div
        className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `conic-gradient(from 0deg, transparent 60%, ${tab.accent} 75%, transparent 90%)`,
          animation: 'spin-slow 4s linear infinite',
          WebkitMask:
            'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          padding: '1px',
        }}
      />

      {/* Background gradient */}
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-br opacity-60',
          tab.heroGradient,
        )}
      />

      {/* Shimmer sweep */}
      <div
        className="pointer-events-none absolute inset-0 translate-x-[-100%] rounded-3xl bg-gradient-to-r from-transparent via-white/5 to-transparent transition-transform duration-1000 group-hover:translate-x-[100%]"
        style={{ transitionTimingFunction: 'ease-in-out' }}
      />

      <div className="relative flex flex-col gap-4 p-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex-1">
          <div
            className="mb-3 inline-flex items-center gap-2 rounded-full border bg-black/20 px-3 py-1 backdrop-blur-sm"
            style={{ borderColor: `${tab.accent}40` }}
          >
            <span style={{ color: tab.accent }} className="flex items-center">
              {tab.icon}
            </span>
            <span
              className="font-mono-tv text-[10px] uppercase tracking-[0.35em]"
              style={{ color: tab.accent }}
            >
              Featured · {tab.label}
            </span>
          </div>

          <h2 className="text-lg font-bold leading-snug tracking-tight text-zinc-50 sm:text-2xl">
            {item.title}
          </h2>

          {item.domain && (
            <p className="mt-2 text-xs text-zinc-400">{item.domain}</p>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-zinc-300 backdrop-blur-sm">
            <ArrowUp className="h-3 w-3" style={{ color: tab.accent }} />
            <span className="font-medium">
              {item.score.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-zinc-300 backdrop-blur-sm">
            <MessageSquare className="h-3 w-3" />
            <span className="font-medium">
              {item.commentCount.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-zinc-300 backdrop-blur-sm">
            <Clock className="h-3 w-3" />
            <span>{timeAgo(item.time)}</span>
          </div>
          <div
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-black transition-transform group-hover:scale-105"
            style={{ backgroundColor: tab.accent }}
          >
            <ExternalLink className="h-3 w-3" />
            Open
          </div>
        </div>
      </div>
    </a>
  );
}

function NewsCard({
  item,
  tab,
  index,
}: {
  item: NewsItem;
  tab: Tab;
  index: number;
}) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-white/8 bg-white/[0.03] p-4 transition-all duration-200',
        'hover:border-white/16 hover:bg-white/[0.055]',
      )}
      style={{
        ['--hover-glow' as string]: `0 0 24px ${tab.accent}20`,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.boxShadow =
          `0 0 0 1px ${tab.accent}25, 0 4px 24px oklch(0 0 0 / 0.4)`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.boxShadow = '';
      }}
    >
      <div className="flex items-start gap-3">
        {/* Index badge */}
        <div
          className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
          style={{
            backgroundColor: `${tab.accent}18`,
            color: tab.accent,
            border: `1px solid ${tab.accent}30`,
          }}
        >
          {index + 1}
        </div>

        <div className="flex flex-1 flex-col gap-1.5">
          {/* Domain */}
          {item.domain && (
            <span className="text-[10px] uppercase tracking-widest text-zinc-500">
              {item.domain}
            </span>
          )}

          {/* Title */}
          <h3 className="text-sm font-semibold leading-snug text-zinc-100 transition-colors group-hover:text-white">
            {item.title}
          </h3>
        </div>

        {/* Thumbnail */}
        {item.thumbnail && (
          <img
            src={item.thumbnail}
            alt=""
            className="h-12 w-12 shrink-0 rounded-xl object-cover opacity-70 transition-opacity group-hover:opacity-90"
            loading="lazy"
          />
        )}
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-3 border-t border-white/6 pt-2.5 text-xs text-zinc-500">
        <span className="flex items-center gap-1">
          <ArrowUp className="h-3 w-3" style={{ color: tab.accent }} />
          <span className="font-medium text-zinc-300">
            {item.score.toLocaleString()}
          </span>
        </span>
        <span className="flex items-center gap-1">
          <MessageSquare className="h-3 w-3" />
          <span>{item.commentCount.toLocaleString()}</span>
        </span>
        <span className="flex items-center gap-1 ml-auto">
          <Clock className="h-3 w-3" />
          {timeAgo(item.time)}
        </span>
        <ExternalLink
          className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100"
          style={{ color: tab.accent }}
        />
      </div>
    </a>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

function NewsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('hn');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cache = useRef<Map<TabId, NewsItem[]>>(new Map());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentTab = TABS.find((t) => t.id === activeTab)!;

  const loadTab = useCallback(async (tabId: TabId) => {
    if (cache.current.has(tabId)) {
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      let items: NewsItem[];
      if (tabId === 'hn') {
        items = await fetchHN();
      } else {
        const tab = TABS.find((t) => t.id === tabId)!;
        items = await fetchReddit(tab.subreddit!);
      }
      cache.current.set(tabId, items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  const switchTab = useCallback(
    (tabId: TabId) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setActiveTab(tabId);
        void loadTab(tabId);
      }, 80);
    },
    [loadTab],
  );

  const retry = useCallback(() => {
    cache.current.delete(activeTab);
    void loadTab(activeTab);
  }, [activeTab, loadTab]);

  // Initial load
  useEffect(() => {
    void loadTab('hn');
  }, [loadTab]);

  const items = cache.current.get(activeTab) ?? [];
  const [featured, ...rest] = items;

  return (
    <main
      className="relative min-h-screen overflow-hidden text-zinc-100"
      style={{
        background: `
          radial-gradient(ellipse at top left, oklch(0.25 0.08 205 / 0.12), transparent 35%),
          radial-gradient(ellipse at bottom right, oklch(0.22 0.06 305 / 0.1), transparent 30%),
          radial-gradient(ellipse at top right, oklch(0.24 0.06 72 / 0.08), transparent 28%),
          oklch(0.072 0.012 255)
        `,
      }}
    >
      {/* Grid overlay */}
      <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:48px_48px]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">

        {/* ── Header / Nav ─────────────────────────────────────────────── */}
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <div className="font-mono-tv text-[10px] uppercase tracking-[0.45em] text-neon-cyan opacity-80">
              TubeTV · News
            </div>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-zinc-50 sm:text-5xl">
              The Feed.
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-400">
              HackerNews, Reddit's best — world, tech, cinema, literature & anime — in one dark aggregator.
            </p>
          </div>

          {/* Nav links */}
          <nav className="flex flex-wrap items-center gap-2" aria-label="TubeTV navigation">
            {[
              { to: '/', label: 'TV', icon: <Tv2 className="h-3.5 w-3.5" /> },
              { to: '/discover', label: 'Discover', icon: <Newspaper className="h-3.5 w-3.5" /> },
              { to: '/playground', label: 'Play', icon: <Gamepad2 className="h-3.5 w-3.5" /> },
              { to: '/vibes', label: 'Vibes', icon: <Music2 className="h-3.5 w-3.5" /> },
              { to: '/wordle', label: 'Wordle', icon: <Zap className="h-3.5 w-3.5" /> },
            ].map(({ to, label, icon }) => (
              <Link
                key={to}
                to={to}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-medium text-zinc-200 transition-colors hover:border-white/20 hover:bg-white/10"
              >
                {icon}
                {label}
              </Link>
            ))}
            <Link
              to="/news"
              className="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition-all"
              style={{
                borderColor: `oklch(0.84 0.14 205 / 0.6)`,
                backgroundColor: `oklch(0.84 0.14 205 / 0.12)`,
                color: `oklch(0.84 0.14 205)`,
                boxShadow: `0 0 12px oklch(0.84 0.14 205 / 0.2)`,
              }}
            >
              <Newspaper className="h-3.5 w-3.5" />
              News
            </Link>
          </nav>
        </header>

        {/* ── Tab bar ──────────────────────────────────────────────────── */}
        <div className="mt-6 flex gap-1 overflow-x-auto rounded-2xl border border-white/8 bg-white/[0.03] p-1.5 backdrop-blur-sm">
          {TABS.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                id={`news-tab-${tab.id}`}
                aria-selected={isActive}
                role="tab"
                onClick={() => switchTab(tab.id)}
                className={cn(
                  'flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.15em] transition-all duration-200 active:scale-95',
                  isActive ? 'text-black shadow-lg' : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5',
                )}
                style={
                  isActive
                    ? {
                        backgroundColor: tab.accent,
                        boxShadow: `0 0 16px ${tab.accent}50, 0 0 32px ${tab.accent}20`,
                      }
                    : {}
                }
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── Content ──────────────────────────────────────────────────── */}
        <section
          className="mt-6 animate-fade-in"
          role="tabpanel"
          aria-labelledby={`news-tab-${activeTab}`}
        >
          {/* Loading state */}
          {loading && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <SkeletonCard wide />
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <ErrorState message={error} onRetry={retry} />
          )}

          {/* Data */}
          {!loading && !error && items.length > 0 && (
            <>
              {/* Hero featured card */}
              {featured && (
                <div className="mb-5">
                  <HeroCard item={featured} tab={currentTab} />
                </div>
              )}

              {/* Cards grid */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((item, i) => (
                  <NewsCard
                    key={item.id}
                    item={item}
                    tab={currentTab}
                    index={i + 1}
                  />
                ))}
              </div>

              {/* Footer attribution */}
              <div className="mt-8 flex items-center justify-between border-t border-white/8 pt-4 text-xs text-zinc-600">
                <span>
                  {activeTab === 'hn'
                    ? 'Data from Hacker News · Firebase API'
                    : `Data from r/${currentTab.subreddit} · Reddit JSON`}
                </span>
                <button
                  onClick={retry}
                  className="flex items-center gap-1.5 text-zinc-500 transition-colors hover:text-zinc-300"
                >
                  <RefreshCw className="h-3 w-3" />
                  Refresh
                </button>
              </div>
            </>
          )}

          {/* Empty state (shouldn't normally happen) */}
          {!loading && !error && items.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center text-zinc-500">
              <Newspaper className="h-8 w-8 opacity-40" />
              <p className="text-sm">No stories yet — try refreshing.</p>
              <button
                onClick={retry}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-zinc-300 transition-colors hover:bg-white/10"
              >
                <RefreshCw className="h-3 w-3" />
                Refresh
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
