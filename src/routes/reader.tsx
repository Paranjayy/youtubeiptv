import { createFileRoute, Link } from '@tanstack/react-router';
import { useState, useEffect, useRef, useCallback } from 'react';

export const Route = createFileRoute('/reader')({
  head: () => ({
    meta: [
      { title: 'Reader — TubeTV' },
      { name: 'description', content: 'Interactive reader — paste any Wikipedia URL to read, highlight, and annotate.' },
    ],
  }),
  component: ReaderPage,
});

// ─── Nav links ────────────────────────────────────────────────────────────────
const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/discover', label: 'Discover' },
  { to: '/movies', label: 'Movies' },
  { to: '/playground', label: 'Playground' },
  { to: '/focus', label: 'Focus' },
  { to: '/vibes', label: 'Vibes' },
  { to: '/wordle', label: 'Wordle' },
  { to: '/roadmap', label: 'Roadmap' },
  { to: '/reader', label: 'Reader' },
];

// ─── Featured articles ────────────────────────────────────────────────────────
const FEATURED = [
  { title: 'Philosophy', emoji: '🧠' },
  { title: 'Quantum mechanics', emoji: '⚛️' },
  { title: 'Jazz', emoji: '🎷' },
  { title: 'Anime', emoji: '🎌' },
  { title: 'Climate change', emoji: '🌍' },
];

// ─── Types ────────────────────────────────────────────────────────────────────
type WikiSummary = {
  title: string;
  extract: string;
  thumbnail?: { source: string };
  description?: string;
};

type Note = {
  paragraphIndex: number;
  text: string;
};

type TooltipState = {
  visible: boolean;
  x: number;
  y: number;
  paragraphIndex: number;
  paragraphText: string;
};

type SidePanelContent = {
  boldTerms: string[];
  categories: string[];
  related: { title: string; pageid: number }[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function extractTitle(input: string): string {
  input = input.trim();
  try {
    const url = new URL(input);
    const match = url.pathname.match(/\/wiki\/(.+)/);
    if (match) return decodeURIComponent(match[1].replace(/_/g, ' '));
  } catch {
    // not a URL
  }
  return input;
}

function extractProperNouns(text: string): string[] {
  // Match capitalized words (likely proper nouns) and years
  const nouns: string[] = [];
  const yearMatch = text.match(/\b(1[0-9]{3}|20[0-9]{2})\b/g);
  if (yearMatch) nouns.push(...yearMatch.slice(0, 2));
  const wordMatch = text.match(/\b[A-Z][a-z]{2,}\b/g);
  if (wordMatch) {
    const unique = [...new Set(wordMatch.filter((w) => !['The', 'This', 'That', 'These', 'Those', 'It', 'In', 'On', 'At', 'By', 'From'].includes(w)))];
    nouns.push(...unique.slice(0, 3));
  }
  return [...new Set(nouns)].slice(0, 4);
}

function generateFollowUpQuestions(text: string): string[] {
  const nouns = extractProperNouns(text);
  const questions: string[] = [];
  for (const noun of nouns) {
    if (/^\d+$/.test(noun)) {
      questions.push(`What happened in ${noun}?`);
    } else {
      questions.push(`What is ${noun}?`);
    }
  }
  questions.push('Who was involved?');
  questions.push('Why is this significant?');
  return questions.slice(0, 4);
}

function extractBoldTerms(html: string): string[] {
  const div = document.createElement('div');
  div.innerHTML = html;
  const bolds = div.querySelectorAll('b, strong');
  const terms = new Set<string>();
  bolds.forEach((el) => {
    const t = el.textContent?.trim();
    if (t && t.length > 1 && t.length < 60) terms.add(t);
  });
  return [...terms].slice(0, 20);
}

// ─── Storage ──────────────────────────────────────────────────────────────────
function loadHighlights(articleTitle: string): number[] {
  try {
    const raw = localStorage.getItem(`tubetv_reader_highlights_${articleTitle}`);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveHighlights(articleTitle: string, indices: number[]) {
  try {
    localStorage.setItem(`tubetv_reader_highlights_${articleTitle}`, JSON.stringify(indices));
  } catch { /* noop */ }
}

function loadNotes(articleTitle: string): Note[] {
  try {
    const raw = localStorage.getItem(`tubetv_reader_notes_${articleTitle}`);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveNotes(articleTitle: string, notes: Note[]) {
  try {
    localStorage.setItem(`tubetv_reader_notes_${articleTitle}`, JSON.stringify(notes));
  } catch { /* noop */ }
}

// ─── Main component ───────────────────────────────────────────────────────────
function ReaderPage() {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [summary, setSummary] = useState<WikiSummary | null>(null);
  const [paragraphs, setParagraphs] = useState<string[]>([]);
  const [articleTitle, setArticleTitle] = useState('');

  const [highlighted, setHighlighted] = useState<number[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [openNotes, setOpenNotes] = useState<number[]>([]);

  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, x: 0, y: 0, paragraphIndex: -1, paragraphText: '' });
  const [askQuestions, setAskQuestions] = useState<string[]>([]);
  const [showAsk, setShowAsk] = useState(false);
  const [askIndex, setAskIndex] = useState(-1);

  const [sidePanel, setSidePanel] = useState(false);
  const [sidePanelContent, setSidePanelContent] = useState<SidePanelContent>({ boldTerms: [], categories: [], related: [] });
  const [relatedLoading, setRelatedLoading] = useState(false);

  const suggestDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // ── Search suggestions ───────────────────────────────────────────────────
  useEffect(() => {
    if (suggestDebounce.current) clearTimeout(suggestDebounce.current);
    if (inputValue.length < 2) { setSuggestions([]); return; }
    suggestDebounce.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(inputValue)}&limit=5&format=json&origin=*`,
        );
        const data: [string, string[]] = await res.json();
        setSuggestions(data[1] ?? []);
        setShowSuggestions(true);
      } catch { /* noop */ }
    }, 280);
    return () => { if (suggestDebounce.current) clearTimeout(suggestDebounce.current); };
  }, [inputValue]);

  // ── Fetch article ────────────────────────────────────────────────────────
  const fetchArticle = useCallback(async (rawInput: string) => {
    const title = extractTitle(rawInput);
    if (!title) return;
    setLoading(true);
    setError(null);
    setSuggestions([]);
    setShowSuggestions(false);
    try {
      // Summary
      const summaryRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
      if (!summaryRes.ok) throw new Error('Article not found');
      const summaryData: WikiSummary = await summaryRes.json();
      setSummary(summaryData);
      const resolvedTitle = summaryData.title;
      setArticleTitle(resolvedTitle);

      // Full text via MediaWiki API
      const contentRes = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&titles=${encodeURIComponent(resolvedTitle)}&format=json&origin=*&exlimit=1&explaintext=1`,
      );
      const contentData = await contentRes.json();
      const pages = contentData?.query?.pages ?? {};
      const page = Object.values(pages)[0] as { extract?: string } | undefined;
      const rawText = page?.extract ?? summaryData.extract ?? '';
      // Split into paragraphs (non-empty lines)
      const paras = rawText
        .split('\n')
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 60);
      setParagraphs(paras);

      // Restore localStorage state
      setHighlighted(loadHighlights(resolvedTitle));
      setNotes(loadNotes(resolvedTitle));
      setOpenNotes([]);
      setTooltip({ visible: false, x: 0, y: 0, paragraphIndex: -1, paragraphText: '' });

      // Side panel: bold terms + categories + related
      setSidePanelContent({ boldTerms: [], categories: [], related: [] });
      setRelatedLoading(true);
      const catRes = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(resolvedTitle)}&prop=categories&cllimit=8&format=json&origin=*`,
      );
      const catData = await catRes.json();
      const catPages = catData?.query?.pages ?? {};
      const catPage = Object.values(catPages)[0] as { categories?: { title: string }[] } | undefined;
      const categories = (catPage?.categories ?? [])
        .map((c: { title: string }) => c.title.replace('Category:', ''))
        .filter((c: string) => !c.startsWith('Articles') && !c.startsWith('CS1') && !c.startsWith('Pages') && !c.startsWith('Webarchive'))
        .slice(0, 8);

      // Related via HTML for bold extraction
      const htmlRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/html/${encodeURIComponent(resolvedTitle)}`);
      const html = await htmlRes.text();
      const boldTerms = extractBoldTerms(html);

      // Related articles via search
      const relRes = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(resolvedTitle)}&srlimit=6&format=json&origin=*`,
      );
      const relData = await relRes.json();
      const related: { title: string; pageid: number }[] = (relData?.query?.search ?? []).filter(
        (r: { title: string; pageid: number }) => r.title !== resolvedTitle,
      ).slice(0, 5);

      setSidePanelContent({ boldTerms, categories, related });
      setRelatedLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load article');
      setLoading(false);
      return;
    }
    setLoading(false);
  }, []);

  // ── Click-outside close tooltip ──────────────────────────────────────────
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        setTooltip((t) => ({ ...t, visible: false }));
        setShowAsk(false);
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  // ── Paragraph click ──────────────────────────────────────────────────────
  function handleParagraphClick(e: React.MouseEvent<HTMLParagraphElement>, idx: number, text: string) {
    // Toggle highlight
    setHighlighted((prev) => {
      const next = prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx];
      saveHighlights(articleTitle, next);
      return next;
    });
    // Show tooltip near click
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const x = Math.min(e.clientX, window.innerWidth - 200);
    const y = rect.top + window.scrollY - 50;
    setTooltip({ visible: true, x, y, paragraphIndex: idx, paragraphText: text });
    setShowAsk(false);
    setAskIndex(-1);
  }

  function handleTooltipExplore() {
    setSidePanel(true);
    setTooltip((t) => ({ ...t, visible: false }));
  }

  function handleTooltipNote(idx: number) {
    setOpenNotes((prev) => prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]);
    setTooltip((t) => ({ ...t, visible: false }));
  }

  function handleTooltipAsk(idx: number, text: string) {
    setAskQuestions(generateFollowUpQuestions(text));
    setShowAsk(true);
    setAskIndex(idx);
  }

  function handleNoteChange(idx: number, value: string) {
    setNotes((prev) => {
      const existing = prev.find((n) => n.paragraphIndex === idx);
      let next: Note[];
      if (existing) {
        next = prev.map((n) => n.paragraphIndex === idx ? { ...n, text: value } : n);
      } else {
        next = [...prev, { paragraphIndex: idx, text: value }];
      }
      saveNotes(articleTitle, next);
      return next;
    });
  }

  function noteFor(idx: number): string {
    return notes.find((n) => n.paragraphIndex === idx)?.text ?? '';
  }

  return (
    <div
      className="min-h-screen text-white"
      style={{ background: 'oklch(0.10 0.008 255)' }}
    >
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

      {/* Side panel overlay */}
      {sidePanel && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          onClick={() => setSidePanel(false)}
        >
          <div
            className="relative h-full w-full max-w-sm border-l border-white/15 overflow-y-auto p-6"
            style={{
              background: 'rgba(10, 10, 20, 0.92)',
              backdropFilter: 'blur(20px)',
              animation: 'slideInRight 0.25s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSidePanel(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white/80 transition-colors text-lg"
            >
              ✕
            </button>
            <h2 className="font-bold text-white/90 text-base mb-5">
              {summary?.title ?? 'Article'} — Info
            </h2>

            {relatedLoading ? (
              <div className="text-white/30 text-sm animate-pulse">Loading…</div>
            ) : (
              <>
                {sidePanelContent.boldTerms.length > 0 && (
                  <div className="mb-6">
                    <div className="text-xs font-bold tracking-widest text-white/30 uppercase mb-3">Key Terms</div>
                    <div className="flex flex-wrap gap-1.5">
                      {sidePanelContent.boldTerms.map((t) => (
                        <a
                          key={t}
                          href={`https://en.wikipedia.org/wiki/${encodeURIComponent(t)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs px-2 py-1 rounded-md border border-white/10 text-white/70 hover:text-white hover:border-white/25 transition-all"
                          style={{ background: 'rgba(255,255,255,0.04)' }}
                        >
                          {t}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {sidePanelContent.categories.length > 0 && (
                  <div className="mb-6">
                    <div className="text-xs font-bold tracking-widest text-white/30 uppercase mb-3">Categories</div>
                    <div className="flex flex-col gap-1">
                      {sidePanelContent.categories.map((c) => (
                        <span key={c} className="text-xs text-white/50">• {c}</span>
                      ))}
                    </div>
                  </div>
                )}

                {sidePanelContent.related.length > 0 && (
                  <div>
                    <div className="text-xs font-bold tracking-widest text-white/30 uppercase mb-3">Related Articles</div>
                    <div className="flex flex-col gap-2">
                      {sidePanelContent.related.map((r) => (
                        <button
                          key={r.pageid}
                          onClick={() => {
                            setInputValue(r.title);
                            setSidePanel(false);
                            fetchArticle(r.title);
                          }}
                          className="text-left text-sm text-white/70 hover:text-white px-3 py-2 rounded-lg border border-white/10 hover:border-white/25 transition-all"
                          style={{ background: 'rgba(255,255,255,0.04)' }}
                        >
                          {r.title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Floating tooltip */}
      {tooltip.visible && (
        <div
          ref={tooltipRef}
          className="fixed z-50 flex flex-col gap-1"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {showAsk && askIndex === tooltip.paragraphIndex ? (
            <div
              className="flex flex-col gap-1 p-2 rounded-xl border border-white/15"
              style={{ background: 'rgba(12,12,24,0.97)', backdropFilter: 'blur(16px)' }}
            >
              <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1 px-1">Follow-up questions</div>
              {askQuestions.map((q) => (
                <a
                  key={q}
                  href={`https://en.wikipedia.org/wiki/${encodeURIComponent(extractProperNouns(q)[0] ?? q)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs px-3 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-all text-left"
                >
                  {q}
                </a>
              ))}
            </div>
          ) : (
            <div
              className="flex items-center gap-0.5 px-1 py-1 rounded-full border border-white/15"
              style={{ background: 'rgba(12,12,24,0.95)', backdropFilter: 'blur(16px)' }}
            >
              <button
                onClick={handleTooltipExplore}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white/80 hover:text-white hover:bg-white/10 transition-all"
              >
                🔍 <span>Explore</span>
              </button>
              <button
                onClick={() => handleTooltipNote(tooltip.paragraphIndex)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white/80 hover:text-white hover:bg-white/10 transition-all"
              >
                📌 <span>Note</span>
              </button>
              <button
                onClick={() => handleTooltipAsk(tooltip.paragraphIndex, tooltip.paragraphText)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white/80 hover:text-white hover:bg-white/10 transition-all"
              >
                ❓ <span>Ask</span>
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .article-content {
          animation: fadeInUp 0.4s ease-out;
        }
        .note-area {
          font-family: 'Georgia', 'Palatino', serif;
          resize: vertical;
          min-height: 80px;
        }
      `}</style>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* ── Search bar ────────────────────────────────────────────────── */}
        <div className="pt-12 pb-8 max-w-2xl mx-auto">
          <p className="text-white/40 text-xs font-bold tracking-[0.35em] uppercase mb-3 text-center">Wikipedia Reader</p>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-6 text-center bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(135deg, #ffffff 30%, #00eeff)' }}>
            Read Deeply
          </h1>

          <div className="relative">
            <div className="flex items-center gap-2 px-4 py-3 rounded-2xl border border-white/20 focus-within:border-white/40 transition-colors"
              style={{ background: 'rgba(255,255,255,0.05)' }}>
              <span className="text-white/40">📖</span>
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                onKeyDown={(e) => { if (e.key === 'Enter') fetchArticle(inputValue); }}
                placeholder="Type an article title or paste a Wikipedia URL…"
                className="flex-1 bg-transparent text-white placeholder-white/30 outline-none text-sm"
              />
              <button
                onClick={() => fetchArticle(inputValue)}
                disabled={loading || !inputValue.trim()}
                className="px-4 py-1.5 rounded-xl text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                style={{ background: 'linear-gradient(135deg, #00eeff, #007b8a)', color: '#000' }}
              >
                {loading ? '…' : 'Read →'}
              </button>
            </div>

            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div
                className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-white/15 overflow-hidden z-30"
                style={{ background: 'rgba(12,12,28,0.97)', backdropFilter: 'blur(20px)' }}
              >
                {suggestions.map((s) => (
                  <button
                    key={s}
                    className="w-full text-left px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/8 transition-colors"
                    onMouseDown={() => { setInputValue(s); setShowSuggestions(false); fetchArticle(s); }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Featured */}
          {!summary && (
            <div className="mt-5">
              <p className="text-xs text-white/30 mb-2.5 text-center">Featured starting points</p>
              <div className="flex flex-wrap justify-center gap-2">
                {FEATURED.map(({ title, emoji }) => (
                  <button
                    key={title}
                    onClick={() => { setInputValue(title); fetchArticle(title); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/15 text-xs text-white/60 hover:text-white hover:border-white/30 transition-all hover:scale-105"
                    style={{ background: 'rgba(255,255,255,0.04)' }}
                  >
                    <span>{emoji}</span>
                    <span>{title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8 px-4 py-3 rounded-xl border border-red-500/30 text-red-400 text-sm"
            style={{ background: 'rgba(239,68,68,0.08)' }}>
            {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="max-w-2xl mx-auto space-y-3 animate-pulse">
            {[100, 90, 95, 85, 70].map((w, i) => (
              <div key={i} className="h-4 rounded-full bg-white/8" style={{ width: `${w}%` }} />
            ))}
          </div>
        )}

        {/* ── Article ──────────────────────────────────────────────────── */}
        {summary && !loading && (
          <div className="flex gap-6 max-w-5xl mx-auto">
            {/* Content area */}
            <div className="flex-1 article-content">
              {/* Article header */}
              <div className="flex items-start gap-5 mb-8">
                {summary.thumbnail && (
                  <img
                    src={summary.thumbnail.source}
                    alt={summary.title}
                    className="w-24 h-24 object-cover rounded-xl border border-white/15 shrink-0"
                  />
                )}
                <div>
                  <h2 className="text-3xl font-black text-white/95 leading-tight mb-1">{summary.title}</h2>
                  {summary.description && (
                    <p className="text-white/50 text-sm leading-relaxed">{summary.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-3">
                    <button
                      onClick={() => setSidePanel(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border border-white/15 text-white/60 hover:text-white hover:border-white/30 transition-all"
                      style={{ background: 'rgba(255,255,255,0.04)' }}
                    >
                      🧩 Info &amp; Related
                    </button>
                    <a
                      href={`https://en.wikipedia.org/wiki/${encodeURIComponent(summary.title)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border border-white/15 text-white/60 hover:text-white hover:border-white/30 transition-all"
                      style={{ background: 'rgba(255,255,255,0.04)' }}
                    >
                      🔗 Open in Wikipedia
                    </a>
                    {highlighted.length > 0 && (
                      <span className="text-xs text-white/30">{highlighted.length} highlights</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Paragraphs */}
              <div
                className="space-y-1"
                style={{
                  fontFamily: "'Georgia', 'Palatino Linotype', 'Book Antiqua', Palatino, serif",
                  maxWidth: 680,
                }}
              >
                {paragraphs.map((para, idx) => {
                  const isHighlighted = highlighted.includes(idx);
                  const hasNote = notes.some((n) => n.paragraphIndex === idx);
                  const isNoteOpen = openNotes.includes(idx);
                  return (
                    <div key={idx}>
                      <p
                        onClick={(e) => handleParagraphClick(e, idx, para)}
                        className="cursor-pointer rounded-lg px-3 py-2 transition-all duration-200 select-text leading-relaxed text-base relative group"
                        style={{
                          color: 'oklch(0.92 0.004 95)',
                          background: isHighlighted
                            ? 'oklch(0.82 0.14 72 / 0.08)'
                            : 'transparent',
                          boxShadow: isHighlighted
                            ? 'inset 0 0 0 1px oklch(0.82 0.14 72 / 0.18)'
                            : 'none',
                        }}
                      >
                        {para}
                        {/* Indicators */}
                        <span className="absolute -right-5 top-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {isHighlighted && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Highlighted" />
                          )}
                          {hasNote && (
                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-300" title="Has note" />
                          )}
                        </span>
                      </p>

                      {/* Sticky note */}
                      {isNoteOpen && (
                        <div
                          className="mx-3 mb-2 p-3 rounded-xl border"
                          style={{
                            background: 'rgba(251, 191, 36, 0.08)',
                            borderColor: 'rgba(251, 191, 36, 0.25)',
                          }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-amber-400/70">📌 Note</span>
                            <button
                              onClick={() => setOpenNotes((prev) => prev.filter((i) => i !== idx))}
                              className="text-white/30 hover:text-white/60 text-xs transition-colors"
                            >
                              ✕
                            </button>
                          </div>
                          <textarea
                            className="note-area w-full bg-transparent text-amber-100/80 text-sm outline-none placeholder-amber-400/30 resize-none"
                            placeholder="Add a note about this paragraph…"
                            value={noteFor(idx)}
                            onChange={(e) => handleNoteChange(idx, e.target.value)}
                            rows={3}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}

                {paragraphs.length === 0 && (
                  <p className="text-white/30 italic text-sm">No content extracted.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
