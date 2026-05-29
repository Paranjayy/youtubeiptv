import { createFileRoute, Link } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Home, Compass, FlaskConical, Focus, Share2, RotateCcw, X, Trophy, Flame, TvMinimalPlay } from 'lucide-react';

// ─── Word List ────────────────────────────────────────────────────────────────
const WORDS: string[] = [
  'STARE', 'CRANE', 'MOUNT', 'LIGHT', 'BRAVE', 'CHESS', 'FLAME', 'GHOST',
  'PIANO', 'SHORE', 'GRAPE', 'STONE', 'BLEND', 'CLAMP', 'DRIFT', 'ELDER',
  'FLAIR', 'GLEAM', 'HASTE', 'INTRO', 'JOKER', 'KNACK', 'LEMON', 'MAPLE',
  'NERVE', 'OZONE', 'PRISM', 'QUERY', 'RAVEN', 'SCOUT', 'TOWER', 'UNCLE',
  'VALID', 'WASTE', 'XEROX', 'YACHT', 'ZILCH', 'ABIDE', 'BLAZE', 'CRISP',
  'DAUNT', 'ECLAT', 'FROWN', 'GLIDE', 'HAVEN', 'INFER', 'JAZZY', 'KNELT',
  'LATHE', 'MIRTH', 'NYMPH', 'OVERT', 'PLUME', 'QUAFF', 'RIVET', 'SWAMP',
  'THYME', 'USHER', 'VAPOR', 'WRATH', 'YEARN', 'ZESTY', 'AMPLE', 'BRISK',
];

const VALID_GUESSES = new Set(WORDS);

// ─── Daily word seeded by date ────────────────────────────────────────────────
function getDailyWord(): string {
  const now = new Date();
  const seed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
  let hash = seed;
  hash = ((hash >>> 16) ^ hash) * 0x45d9f3b;
  hash = ((hash >>> 16) ^ hash) * 0x45d9f3b;
  hash = (hash >>> 16) ^ hash;
  return WORDS[Math.abs(hash) % WORDS.length];
}

const DAILY_WORD = getDailyWord();
const TODAY = new Date().toISOString().split('T')[0];

// ─── Types ────────────────────────────────────────────────────────────────────
type TileState = 'empty' | 'tbd' | 'correct' | 'present' | 'absent';
type GameStatus = 'playing' | 'won' | 'lost';

interface StoredStats {
  streak: number;
  maxStreak: number;
  gamesPlayed: number;
  gamesWon: number;
  lastPlayedDate: string | null;
  lastResult: 'won' | 'lost' | null;
  lastGuesses: string[];
}

const DEFAULT_STATS: StoredStats = {
  streak: 0,
  maxStreak: 0,
  gamesPlayed: 0,
  gamesWon: 0,
  lastPlayedDate: null,
  lastResult: null,
  lastGuesses: [],
};

function loadStats(): StoredStats {
  try {
    const raw = localStorage.getItem('tubetv_wordle_stats');
    if (!raw) return DEFAULT_STATS;
    return { ...DEFAULT_STATS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_STATS;
  }
}

function saveStats(stats: StoredStats) {
  localStorage.setItem('tubetv_wordle_stats', JSON.stringify(stats));
}

// ─── Color helpers ────────────────────────────────────────────────────────────
const TILE_COLORS: Record<TileState, { bg: string; border: string; shadow: string }> = {
  empty:   { bg: 'transparent',        border: '#3a3d45', shadow: 'none' },
  tbd:     { bg: 'transparent',        border: '#6b7280', shadow: 'none' },
  correct: { bg: 'oklch(0.75 0.18 154)', border: 'oklch(0.75 0.18 154)', shadow: '0 0 12px oklch(0.75 0.18 154 / 0.7)' },
  present: { bg: 'oklch(0.82 0.15 72)',  border: 'oklch(0.82 0.15 72)',  shadow: '0 0 12px oklch(0.82 0.15 72 / 0.6)'  },
  absent:  { bg: '#2a2d35',            border: '#2a2d35', shadow: 'none' },
};

const KEY_COLORS: Record<string, TileState> = {};

function evaluateGuess(guess: string, target: string): TileState[] {
  const result: TileState[] = Array(5).fill('absent');
  const targetArr = target.split('');
  const guessArr = guess.split('');
  const used = Array(5).fill(false);

  // First pass: correct
  for (let i = 0; i < 5; i++) {
    if (guessArr[i] === targetArr[i]) {
      result[i] = 'correct';
      used[i] = true;
    }
  }
  // Second pass: present
  for (let i = 0; i < 5; i++) {
    if (result[i] === 'correct') continue;
    for (let j = 0; j < 5; j++) {
      if (!used[j] && guessArr[i] === targetArr[j]) {
        result[i] = 'present';
        used[j] = true;
        break;
      }
    }
  }
  return result;
}

const KEYBOARD_ROWS = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['ENTER','Z','X','C','V','B','N','M','⌫'],
];

// ─── Route ────────────────────────────────────────────────────────────────────
export const Route = createFileRoute('/wordle')({
  head: () => ({
    meta: [
      { title: 'Wordle · TubeTV' },
      { name: 'description', content: 'Play the daily 5-letter word game on TubeTV.' },
    ],
  }),
  component: WordlePage,
});

// ─── Component ────────────────────────────────────────────────────────────────
function WordlePage() {
  const stats = useMemo(() => loadStats(), []);

  // If already played today, restore state
  const alreadyPlayed = stats.lastPlayedDate === TODAY;
  const initialGuesses: string[] = alreadyPlayed ? stats.lastGuesses : [];
  const initialStatus: GameStatus = alreadyPlayed
    ? stats.lastResult === 'won' ? 'won' : stats.lastResult === 'lost' ? 'lost' : 'playing'
    : 'playing';

  const [guesses, setGuesses] = useState<string[]>(initialGuesses);
  const [currentInput, setCurrentInput] = useState('');
  const [gameStatus, setGameStatus] = useState<GameStatus>(initialStatus);
  const [tileStates, setTileStates] = useState<TileState[][]>(() =>
    initialGuesses.map((g) => evaluateGuess(g, DAILY_WORD))
  );
  const [keyMap, setKeyMap] = useState<Record<string, TileState>>(() => {
    const km: Record<string, TileState> = {};
    initialGuesses.forEach((g) => {
      const states = evaluateGuess(g, DAILY_WORD);
      g.split('').forEach((ch, i) => {
        const prev = km[ch];
        const next = states[i];
        const priority: TileState[] = ['correct', 'present', 'absent'];
        if (!prev || priority.indexOf(next) < priority.indexOf(prev)) km[ch] = next;
      });
    });
    return km;
  });

  const [flippingRow, setFlippingRow] = useState<number | null>(null);
  const [shakingRow, setShakingRow] = useState<number | null>(null);
  const [bouncingTile, setBouncingTile] = useState<{ row: number; col: number } | null>(null);
  const [showModal, setShowModal] = useState(alreadyPlayed && initialStatus !== 'playing');
  const [toastMsg, setToastMsg] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string, duration = 2000) => {
    setToastMsg(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(''), duration);
  }, []);

  const currentRow = guesses.length;

  const submitGuess = useCallback(() => {
    if (gameStatus !== 'playing') return;
    if (currentInput.length !== 5) { showToast('Not enough letters'); shakeRow(currentRow); return; }
    if (!VALID_GUESSES.has(currentInput)) { showToast('Not in word list'); shakeRow(currentRow); return; }

    const states = evaluateGuess(currentInput, DAILY_WORD);
    const newGuesses = [...guesses, currentInput];
    const newTileStates = [...tileStates, states];
    const newKeyMap = { ...keyMap };
    currentInput.split('').forEach((ch, i) => {
      const prev = newKeyMap[ch];
      const next = states[i];
      const priority: TileState[] = ['correct', 'present', 'absent'];
      if (!prev || priority.indexOf(next) < priority.indexOf(prev)) newKeyMap[ch] = next;
    });

    // Animate flip
    setFlippingRow(currentRow);
    setTimeout(() => {
      setFlippingRow(null);
      setGuesses(newGuesses);
      setTileStates(newTileStates);
      setKeyMap(newKeyMap);
      setCurrentInput('');

      const won = currentInput === DAILY_WORD;
      const lost = !won && newGuesses.length >= 6;

      if (won || lost) {
        const newStatus: GameStatus = won ? 'won' : 'lost';
        setGameStatus(newStatus);

        const fresh = loadStats();
        const updatedStats: StoredStats = {
          ...fresh,
          gamesPlayed: fresh.gamesPlayed + 1,
          gamesWon: won ? fresh.gamesWon + 1 : fresh.gamesWon,
          streak: won
            ? (fresh.lastPlayedDate === getPreviousDay() ? fresh.streak + 1 : 1)
            : 0,
          maxStreak: 0,
          lastPlayedDate: TODAY,
          lastResult: newStatus,
          lastGuesses: newGuesses,
        };
        updatedStats.maxStreak = Math.max(fresh.maxStreak, updatedStats.streak);
        saveStats(updatedStats);

        setTimeout(() => setShowModal(true), 1600);
      } else {
        saveStats({ ...loadStats(), lastGuesses: newGuesses, lastPlayedDate: TODAY, lastResult: null });
      }
    }, 600);
  }, [currentInput, guesses, tileStates, keyMap, gameStatus, currentRow, showToast]);

  function shakeRow(row: number) {
    setShakingRow(row);
    setTimeout(() => setShakingRow(null), 400);
  }

  function getPreviousDay(): string {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }

  const handleKey = useCallback((key: string) => {
    if (gameStatus !== 'playing') return;
    if (key === 'ENTER') { submitGuess(); return; }
    if (key === '⌫' || key === 'Backspace') {
      setCurrentInput((p) => p.slice(0, -1)); return;
    }
    if (/^[A-Za-z]$/.test(key) && currentInput.length < 5) {
      const col = currentInput.length;
      setBouncingTile({ row: currentRow, col });
      setTimeout(() => setBouncingTile(null), 120);
      setCurrentInput((p) => p + key.toUpperCase());
    }
  }, [gameStatus, currentInput, currentRow, submitGuess]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      handleKey(e.key === 'Backspace' ? '⌫' : e.key === 'Enter' ? 'ENTER' : e.key);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleKey]);

  // Build share text
  const buildShareText = () => {
    const emojiGrid = tileStates.map((row) =>
      row.map((s) => s === 'correct' ? '🟩' : s === 'present' ? '🟨' : '⬛').join('')
    ).join('\n');
    return `TubeTV Wordle ${TODAY}\n${gameStatus === 'won' ? guesses.length : 'X'}/6\n\n${emojiGrid}`;
  };

  const handleShare = async () => {
    const text = buildShareText();
    try {
      await navigator.clipboard.writeText(text);
      showToast('Copied to clipboard! 📋');
    } catch {
      showToast(text);
    }
  };

  const freshStats = alreadyPlayed ? stats : loadStats();

  return (
    <div style={{ background: '#080a0e', minHeight: '100vh', color: '#fff', fontFamily: "'Inter', sans-serif", display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        @keyframes tile-flip {
          0%   { transform: rotateX(0deg); background-color: var(--tile-bg-before); }
          49%  { transform: rotateX(-90deg); background-color: var(--tile-bg-before); }
          50%  { transform: rotateX(-90deg); background-color: var(--tile-bg-after); border-color: var(--tile-border-after); }
          100% { transform: rotateX(0deg); background-color: var(--tile-bg-after); border-color: var(--tile-border-after); }
        }
        .tile-flip { animation: tile-flip 0.6s ease-in-out forwards; }

        @keyframes tile-bounce {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.14); }
        }
        .tile-bounce { animation: tile-bounce 0.1s ease-in-out; }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-6px); }
          40%       { transform: translateX(6px); }
          60%       { transform: translateX(-4px); }
          80%       { transform: translateX(4px); }
        }
        .shake { animation: shake 0.35s ease-in-out; }

        @keyframes pop-in {
          0%   { opacity: 0; transform: scale(0.8) translateY(20px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .pop-in { animation: pop-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }

        @keyframes fade-down {
          0%   { opacity: 0; transform: translateY(-8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .fade-down { animation: fade-down 0.3s ease forwards; }

        @keyframes win-bounce {
          0%, 100% { transform: translateY(0); }
          30%       { transform: translateY(-16px); }
          60%       { transform: translateY(-6px); }
        }
        .win-bounce { animation: win-bounce 0.6s ease; }

        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #111; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
      `}</style>

      {/* Header */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 20px', borderBottom: '1px solid #1e2130',
        background: 'linear-gradient(90deg, #0d1117 0%, #111827 100%)',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <nav style={{ display: 'flex', gap: 4 }}>
          {[
            { to: '/', icon: <Home size={15} />, label: 'Home' },
            { to: '/discover', icon: <Compass size={15} />, label: 'Discover' },
            { to: '/playground', icon: <FlaskConical size={15} />, label: 'Playground' },
            { to: '/focus', icon: <Focus size={15} />, label: 'Focus' },
          ].map(({ to, icon, label }) => (
            <Link key={to} to={to} style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px',
              borderRadius: 8, fontSize: 12, fontWeight: 500, color: '#9ca3af',
              textDecoration: 'none', transition: 'all 0.2s',
            }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#1e2130'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#9ca3af'; }}
            >
              {icon}<span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
        </nav>

        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
          <TvMinimalPlay size={22} style={{ color: '#22d3ee' }} />
          <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.5px' }}>
            <span style={{ color: '#22d3ee' }}>Tube</span><span style={{ color: '#fff' }}>TV</span>
            <span style={{ color: '#6b7280', fontWeight: 400, marginLeft: 6, fontSize: 13 }}>Wordle</span>
          </span>
        </div>

        {/* Streak */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#1e2130', borderRadius: 10, padding: '6px 12px' }}>
          <Flame size={15} style={{ color: '#f97316' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{freshStats.streak}</span>
          <span style={{ fontSize: 11, color: '#6b7280' }}>streak</span>
        </div>
      </header>

      {/* Toast */}
      {toastMsg && (
        <div className="fade-down" style={{
          position: 'fixed', top: 70, left: '50%', transform: 'translateX(-50%)',
          background: '#fff', color: '#080a0e', padding: '10px 20px', borderRadius: 10,
          fontWeight: 700, fontSize: 14, zIndex: 100, pointerEvents: 'none',
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
        }}>
          {toastMsg}
        </div>
      )}

      {/* Main */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 16px 12px' }}>

        {/* Date label */}
        <p style={{ fontSize: 11, color: '#4b5563', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 20, fontWeight: 600 }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>

        {/* Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 24 }}>
          {Array.from({ length: 6 }, (_, rowIndex) => {
            const isCurrentRow = rowIndex === currentRow;
            const isSubmitted = rowIndex < guesses.length;
            const word = isSubmitted ? guesses[rowIndex] : isCurrentRow ? currentInput : '';

            return (
              <div
                key={rowIndex}
                className={shakingRow === rowIndex ? 'shake' : ''}
                style={{ display: 'flex', gap: 6 }}
              >
                {Array.from({ length: 5 }, (_, colIndex) => {
                  const letter = word[colIndex] || '';
                  const state: TileState = isSubmitted ? tileStates[rowIndex][colIndex] : letter ? 'tbd' : 'empty';
                  const colors = TILE_COLORS[state];
                  const isBouncing = bouncingTile?.row === rowIndex && bouncingTile?.col === colIndex;
                  const isFlipping = flippingRow === rowIndex && isCurrentRow;

                  const delay = isFlipping ? `${colIndex * 0.12}s` : '0s';

                  return (
                    <div
                      key={colIndex}
                      className={isBouncing ? 'tile-bounce' : isFlipping ? 'tile-flip' : ''}
                      style={{
                        width: 58, height: 58, border: `2px solid ${colors.border}`,
                        background: isFlipping ? 'transparent' : colors.bg,
                        borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: 0,
                        transition: 'border-color 0.1s',
                        boxShadow: isSubmitted ? colors.shadow : 'none',
                        animationDelay: delay,
                        perspective: '250px',
                        // CSS vars for the flip animation colors
                        ['--tile-bg-before' as string]: 'transparent',
                        ['--tile-bg-after' as string]: colors.bg,
                        ['--tile-border-after' as string]: colors.border,
                      } as React.CSSProperties}
                    >
                      {letter}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Keyboard */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', maxWidth: 480 }}>
          {KEYBOARD_ROWS.map((row, ri) => (
            <div key={ri} style={{ display: 'flex', justifyContent: 'center', gap: 5 }}>
              {row.map((key) => {
                const kState = keyMap[key];
                const isWide = key === 'ENTER' || key === '⌫';
                const kColors = kState ? TILE_COLORS[kState] : { bg: '#1e2130', border: '#2a2d35', shadow: 'none' };
                return (
                  <button
                    key={key}
                    onClick={() => handleKey(key)}
                    style={{
                      width: isWide ? 64 : 38, height: 54, borderRadius: 7, border: 'none',
                      background: kState ? kColors.bg : '#1e2130',
                      color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700,
                      fontSize: isWide ? 11 : 15, cursor: 'pointer',
                      transition: 'all 0.15s', boxShadow: kState ? kColors.shadow : 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.2)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1)'; }}
                    onMouseDown={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.92)'; }}
                    onMouseUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
                  >
                    {key}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </main>

      {/* Win/Loss Modal */}
      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(8,10,14,0.85)',
            backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 200, padding: 16,
          }}
        >
          <div
            className="pop-in"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(145deg, #111827 0%, #0d1117 100%)',
              border: '1px solid #1e2130',
              borderRadius: 20, padding: '32px 28px', maxWidth: 380, width: '100%',
              boxShadow: '0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)',
              textAlign: 'center', position: 'relative',
            }}
          >
            <button
              onClick={() => setShowModal(false)}
              style={{
                position: 'absolute', top: 14, right: 14, background: '#1e2130',
                border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', color: '#6b7280',
              }}
            >
              <X size={16} />
            </button>

            {gameStatus === 'won' ? (
              <>
                <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
                <h2 style={{ fontSize: 26, fontWeight: 900, margin: '0 0 4px', background: 'linear-gradient(135deg, #22d3ee, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Brilliant!
                </h2>
                <p style={{ color: '#9ca3af', fontSize: 14, margin: '0 0 20px' }}>
                  Solved in <strong style={{ color: '#fff' }}>{guesses.length}</strong> {guesses.length === 1 ? 'guess' : 'guesses'}
                </p>
              </>
            ) : (
              <>
                <div style={{ fontSize: 48, marginBottom: 8 }}>😔</div>
                <h2 style={{ fontSize: 26, fontWeight: 900, margin: '0 0 4px', color: '#f87171' }}>
                  Game Over
                </h2>
                <p style={{ color: '#9ca3af', fontSize: 14, margin: '0 0 4px' }}>The word was</p>
                <p style={{ fontSize: 22, fontWeight: 900, color: '#22d3ee', margin: '0 0 20px', letterSpacing: 4 }}>
                  {DAILY_WORD}
                </p>
              </>
            )}

            {/* Stats row */}
            <div style={{ display: 'flex', justifyContent: 'space-around', background: '#0d1117', borderRadius: 12, padding: '14px 10px', marginBottom: 20, border: '1px solid #1e2130' }}>
              {[
                { label: 'Played', value: freshStats.gamesPlayed + (alreadyPlayed ? 0 : 1) },
                { label: 'Won', value: freshStats.gamesWon + (gameStatus === 'won' && !alreadyPlayed ? 1 : 0) },
                { label: 'Streak', value: freshStats.streak, icon: <Flame size={12} style={{ color: '#f97316' }} /> },
                { label: 'Best', value: freshStats.maxStreak, icon: <Trophy size={12} style={{ color: '#facc15' }} /> },
              ].map(({ label, value, icon }) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, fontSize: 22, fontWeight: 900, color: '#fff' }}>
                    {icon}{value}
                  </div>
                  <div style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Emoji grid preview */}
            <div style={{ fontFamily: 'monospace', fontSize: 18, lineHeight: 1.4, marginBottom: 20, letterSpacing: 2 }}>
              {tileStates.map((row, i) => (
                <div key={i}>
                  {row.map((s, j) => (
                    <span key={j}>{s === 'correct' ? '🟩' : s === 'present' ? '🟨' : '⬛'}</span>
                  ))}
                </div>
              ))}
            </div>

            <button
              onClick={handleShare}
              style={{
                width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
                background: 'linear-gradient(135deg, #06b6d4, #6366f1)', color: '#fff',
                fontWeight: 800, fontSize: 15, cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.2s', boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.1)'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1)'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}
            >
              <Share2 size={16} /> Share Result
            </button>

            <p style={{ marginTop: 14, fontSize: 11, color: '#4b5563' }}>New word tomorrow · {DAILY_WORD.length} letters</p>
          </div>
        </div>
      )}
    </div>
  );
}
