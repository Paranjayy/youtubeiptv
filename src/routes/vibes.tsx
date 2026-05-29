import { createFileRoute, Link } from '@tanstack/react-router';
import { useState, useEffect, useRef } from 'react';

export const Route = createFileRoute('/vibes')({
  head: () => ({
    meta: [
      { title: 'Vibes - TubeTV' },
      {
        name: 'description',
        content:
          'Find your musical mood. Curated vibes from lofi to synthwave, jazz to ambient.',
      },
    ],
  }),
  component: VibesPage,
});

type Vibe = {
  id: string;
  name: string;
  emoji: string;
  description: string;
  tags: string[];
  gradient: string;
  accentColor: string;
  youtubeSearch: string;
  artists: string[];
};

const VIBES: Vibe[] = [
  {
    id: 'lofi-study',
    name: 'Lofi Study',
    emoji: '📚',
    description: 'Gentle beats and mellow melodies to keep your mind sharp and your spirit calm.',
    tags: ['focus', 'chill', 'beats'],
    gradient: 'radial-gradient(ellipse at top left, #1a1a4e 0%, #0d0d1a 60%, #0a0a0d 100%)',
    accentColor: '#7c6bff',
    youtubeSearch: 'lofi hip hop study beats chill',
    artists: ['Lofi Girl', 'ChilledCow', 'College Music', 'Dreamhop Music'],
  },
  {
    id: 'dark-synthwave',
    name: 'Dark Synthwave',
    emoji: '🌆',
    description: 'Neon-drenched retro-futurism. Chrome skyscrapers, rain-slick streets, and pulsing synths.',
    tags: ['retro', 'synth', 'cinematic'],
    gradient: 'radial-gradient(ellipse at bottom right, #3d0050 0%, #1a0030 50%, #0d0010 100%)',
    accentColor: '#ff00ff',
    youtubeSearch: 'dark synthwave outrun cyberpunk music',
    artists: ['Perturbator', 'Carpenter Brut', 'Gunship', 'Kavinsky'],
  },
  {
    id: 'midnight-jazz',
    name: 'Midnight Jazz',
    emoji: '🎷',
    description: 'Smoky rooms, soft brass, and the gentle hiss of vinyl. Jazz that breathes in the dark.',
    tags: ['jazz', 'late-night', 'relaxed'],
    gradient: 'radial-gradient(ellipse at center, #1a0e00 0%, #0d0800 50%, #05030a 100%)',
    accentColor: '#ffa500',
    youtubeSearch: 'midnight jazz late night cafe saxophone',
    artists: ['Miles Davis', 'Bill Evans', 'Chet Baker', 'Norah Jones'],
  },
  {
    id: 'dreamy-ambient',
    name: 'Dreamy Ambient',
    emoji: '✨',
    description: 'Drift between sleep and waking. Textures of sound that feel like memories.',
    tags: ['ambient', 'ethereal', 'dreamy'],
    gradient: 'radial-gradient(ellipse at top, #001a2e 0%, #000d1a 50%, #00050d 100%)',
    accentColor: '#00d4ff',
    youtubeSearch: 'dreamy ambient ethereal soundscape music',
    artists: ['Brian Eno', 'Moby', 'Jon Hopkins', 'Stars of the Lid'],
  },
  {
    id: 'epic-cinematic',
    name: 'Epic Cinematic',
    emoji: '🎬',
    description: 'Orchestral swells and dramatic builds. Your life is the movie; this is the score.',
    tags: ['orchestral', 'epic', 'dramatic'],
    gradient: 'radial-gradient(ellipse at bottom, #1a0800 0%, #0d0400 50%, #050000 100%)',
    accentColor: '#ff6600',
    youtubeSearch: 'epic cinematic orchestral trailer music',
    artists: ['Hans Zimmer', 'Two Steps From Hell', 'Audiomachine', 'Thomas Bergersen'],
  },
  {
    id: 'cozy-indie-folk',
    name: 'Cozy Indie Folk',
    emoji: '🍂',
    description: 'Worn flannel, warm tea, acoustic guitar by the window on a rainy day.',
    tags: ['folk', 'indie', 'acoustic', 'cozy'],
    gradient: 'radial-gradient(ellipse at top right, #1a0e00 0%, #100800 50%, #080300 100%)',
    accentColor: '#e8a55a',
    youtubeSearch: 'cozy indie folk acoustic guitar coffee shop',
    artists: ['Bon Iver', 'Fleet Foxes', 'Iron & Wine', 'Sufjan Stevens'],
  },
  {
    id: 'hypnotic-electronic',
    name: 'Hypnotic Electronic',
    emoji: '🌀',
    description: 'Repetitive, hypnotic pulses that dissolve the ego and blur time.',
    tags: ['techno', 'hypnotic', 'trance'],
    gradient: 'radial-gradient(ellipse at center, #000f1a 0%, #000810 50%, #000205 100%)',
    accentColor: '#00ffaa',
    youtubeSearch: 'hypnotic techno minimal electronic music',
    artists: ['Actress', 'Andy Stott', 'Burial', 'Objekt'],
  },
  {
    id: 'sunrise-meditation',
    name: 'Sunrise Meditation',
    emoji: '🌅',
    description: 'Gentle light through closed eyes. Breathing music for the quiet morning hour.',
    tags: ['meditation', 'peaceful', 'morning'],
    gradient: 'radial-gradient(ellipse at bottom left, #1a0f00 0%, #0d0800 40%, #050205 100%)',
    accentColor: '#ffcc44',
    youtubeSearch: 'sunrise meditation morning calm peaceful music',
    artists: ['Deuter', 'Marconi Union', 'Anugama', 'Liquid Mind'],
  },
  {
    id: 'late-night-vibes',
    name: 'Late Night Vibes',
    emoji: '🌙',
    description: 'The city at 3am. Distant sirens, slow R&B, and the feeling that anything could happen.',
    tags: ['r&b', 'late-night', 'urban'],
    gradient: 'radial-gradient(ellipse at top, #0a0a1a 0%, #050510 50%, #020208 100%)',
    accentColor: '#9966ff',
    youtubeSearch: 'late night vibes r&b neo soul chill',
    artists: ['Frank Ocean', 'Daniel Caesar', 'SZA', 'H.E.R.'],
  },
  {
    id: 'city-rain',
    name: 'City Rain',
    emoji: '🌧️',
    description: 'Raindrops on glass, distant thunder, and music that sounds like wet pavement.',
    tags: ['rain', 'ambient', 'atmospheric'],
    gradient: 'radial-gradient(ellipse at top left, #0a1020 0%, #050810 50%, #020305 100%)',
    accentColor: '#4488ff',
    youtubeSearch: 'rain city ambience music jazz coffee',
    artists: ['Nils Frahm', 'Max Richter', 'Ólafur Arnalds', 'Kiasmos'],
  },
  {
    id: 'deep-focus',
    name: 'Deep Focus',
    emoji: '🎯',
    description: 'Zero distraction. Pure flow state. Music engineered to silence the noise.',
    tags: ['focus', 'productivity', 'concentration'],
    gradient: 'radial-gradient(ellipse at center right, #001a10 0%, #000d08 50%, #000200 100%)',
    accentColor: '#00ff88',
    youtubeSearch: 'deep focus flow state work music binaural',
    artists: ['Tycho', 'Bonobo', 'Hammock', 'Explosions in the Sky'],
  },
  {
    id: 'psychedelic-rock',
    name: 'Psychedelic Rock',
    emoji: '🔮',
    description: 'Fuzz-drenched guitars, lysergic reverb, and songs that bend the walls of reality.',
    tags: ['rock', 'psychedelic', 'trippy'],
    gradient: 'radial-gradient(ellipse at bottom right, #1a001a 0%, #0d000d 50%, #050005 100%)',
    accentColor: '#ff44ff',
    youtubeSearch: 'psychedelic rock classic trippy guitar',
    artists: ['Pink Floyd', 'Tame Impala', 'The Doors', 'King Gizzard'],
  },
];

function VibeCard({
  vibe,
  isSelected,
  onClick,
}: {
  vibe: Vibe;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl text-left transition-all duration-300 cursor-pointer border ${
        isSelected
          ? 'border-white/30 scale-[1.02]'
          : 'border-white/10 hover:border-white/25 hover:scale-[1.02]'
      }`}
      style={{
        background: vibe.gradient,
        boxShadow: isSelected
          ? `0 0 40px ${vibe.accentColor}55, 0 8px 32px rgba(0,0,0,0.6)`
          : `0 4px 24px rgba(0,0,0,0.5)`,
      }}
    >
      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] rounded-2xl" />

      {/* Glow blob on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${vibe.accentColor}22 0%, transparent 70%)`,
        }}
      />

      {/* Selected ring pulse */}
      {isSelected && (
        <div
          className="absolute inset-0 rounded-2xl animate-pulse pointer-events-none"
          style={{
            boxShadow: `inset 0 0 30px ${vibe.accentColor}33`,
          }}
        />
      )}

      <div className="relative z-10 p-5">
        <div className="flex items-start justify-between mb-3">
          <span className="text-3xl">{vibe.emoji}</span>
          {isSelected && (
            <span
              className="text-xs font-bold px-2 py-1 rounded-full border"
              style={{
                color: vibe.accentColor,
                borderColor: `${vibe.accentColor}66`,
                background: `${vibe.accentColor}22`,
              }}
            >
              VIBING
            </span>
          )}
        </div>
        <h3 className="text-white font-bold text-lg mb-1 leading-tight">{vibe.name}</h3>
        <p className="text-white/60 text-sm leading-relaxed mb-3 line-clamp-2">
          {vibe.description}
        </p>
        <div className="flex flex-wrap gap-1">
          {vibe.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                color: vibe.accentColor,
                background: `${vibe.accentColor}18`,
              }}
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}

function ExpandedVibe({ vibe, onClose }: { vibe: Vibe; onClose: () => void }) {
  const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(vibe.youtubeSearch)}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-lg rounded-3xl border border-white/20 overflow-hidden"
        style={{
          background: vibe.gradient,
          boxShadow: `0 0 80px ${vibe.accentColor}44, 0 32px 64px rgba(0,0,0,0.8)`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Inner glass layer */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

        <div className="relative z-10 p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <span className="text-5xl block mb-2">{vibe.emoji}</span>
              <h2 className="text-white text-2xl font-bold">{vibe.name}</h2>
              <p className="text-white/60 text-sm mt-1">{vibe.description}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white/40 hover:text-white/80 transition-colors text-xl ml-4 mt-1"
            >
              ✕
            </button>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-6">
            {vibe.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-3 py-1 rounded-full font-medium"
                style={{
                  color: vibe.accentColor,
                  background: `${vibe.accentColor}22`,
                  border: `1px solid ${vibe.accentColor}44`,
                }}
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Artists */}
          <div className="mb-6">
            <h3 className="text-white/40 text-xs font-bold uppercase tracking-widest mb-3">
              Artists & Playlists
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {vibe.artists.map((artist) => (
                <a
                  key={artist}
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(artist + ' ' + vibe.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-white/10 hover:border-white/25 transition-all hover:scale-[1.02] group/artist"
                  style={{ background: 'rgba(0,0,0,0.35)' }}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: vibe.accentColor }}
                  />
                  <span className="text-white/80 text-sm group-hover/artist:text-white transition-colors truncate">
                    {artist}
                  </span>
                </a>
              ))}
            </div>
          </div>

          {/* CTA */}
          <a
            href={youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 w-full py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: `linear-gradient(135deg, ${vibe.accentColor}dd, ${vibe.accentColor}88)`,
              color: '#000',
              boxShadow: `0 4px 24px ${vibe.accentColor}66`,
            }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.27 8.27 0 004.84 1.56V6.81a4.85 4.85 0 01-1.07-.12z" />
            </svg>
            Search on YouTube
          </a>
        </div>
      </div>
    </div>
  );
}

function VibesPage() {
  const [selectedVibe, setSelectedVibe] = useState<Vibe | null>(null);
  const [expandedVibe, setExpandedVibe] = useState<Vibe | null>(null);
  const [bgGradient, setBgGradient] = useState(
    'radial-gradient(ellipse at 20% 20%, #0d0020 0%, #000008 60%, #000000 100%)',
  );
  const prevGradient = useRef(bgGradient);

  useEffect(() => {
    if (selectedVibe) {
      prevGradient.current = bgGradient;
      setBgGradient(selectedVibe.gradient);
    } else {
      setBgGradient(
        'radial-gradient(ellipse at 20% 20%, #0d0020 0%, #000008 60%, #000000 100%)',
      );
    }
  }, [selectedVibe]);

  const handleVibePick = (vibe: Vibe) => {
    setSelectedVibe(vibe);
  };

  const handleRandomVibe = () => {
    const others = VIBES.filter((v) => v.id !== selectedVibe?.id);
    const random = others[Math.floor(Math.random() * others.length)];
    setSelectedVibe(random);
  };

  const handleCardClick = (vibe: Vibe) => {
    handleVibePick(vibe);
    setExpandedVibe(vibe);
  };

  return (
    <div
      className="min-h-screen text-white transition-all duration-1000"
      style={{ background: bgGradient }}
    >
      {/* Animated noise overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b border-white/10 backdrop-blur-xl bg-black/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <Link to="/" className="font-black text-lg tracking-tight text-white/90 hover:text-white transition-colors">
              Tube<span className="text-red-500">TV</span>
            </Link>
            <div className="flex items-center gap-1 text-sm">
              {[
                { to: '/', label: 'Home' },
                { to: '/discover', label: 'Discover' },
                { to: '/playground', label: 'Playground' },
                { to: '/focus', label: 'Focus' },
                { to: '/vibes', label: 'Vibes' },
                { to: '/wordle', label: 'Wordle' },
              ].map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className="px-3 py-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all"
                  activeProps={{ className: 'px-3 py-1.5 rounded-lg text-white bg-white/15' }}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Hero */}
        <div className="text-center mb-12">
          <p className="text-white/40 text-sm font-semibold tracking-[0.3em] uppercase mb-3">
            Music Mood Explorer
          </p>
          <h1 className="text-5xl sm:text-6xl font-black tracking-tight mb-4">
            Find Your{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: `linear-gradient(135deg, ${selectedVibe?.accentColor ?? '#a78bfa'}, ${selectedVibe?.accentColor ?? '#38bdf8'}88)`,
                transition: 'background-image 0.6s ease',
              }}
            >
              Vibe
            </span>
          </h1>
          <p className="text-white/50 text-lg max-w-xl mx-auto leading-relaxed">
            Curated moods from lofi to synthwave, jazz to ambient. Click a mood to explore.
          </p>
        </div>

        {/* Now Vibing indicator + Random button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div
            className="flex items-center gap-3 px-5 py-2.5 rounded-2xl border border-white/10 backdrop-blur-md"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          >
            {selectedVibe ? (
              <>
                <span className="relative flex h-2.5 w-2.5">
                  <span
                    className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                    style={{ background: selectedVibe.accentColor }}
                  />
                  <span
                    className="relative inline-flex rounded-full h-2.5 w-2.5"
                    style={{ background: selectedVibe.accentColor }}
                  />
                </span>
                <span className="text-white/50 text-sm">Now Vibing:</span>
                <span className="text-white font-semibold text-sm">
                  {selectedVibe.emoji} {selectedVibe.name}
                </span>
                <button
                  onClick={() => setSelectedVibe(null)}
                  className="text-white/30 hover:text-white/70 transition-colors ml-1 text-xs"
                >
                  ✕
                </button>
              </>
            ) : (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
                <span className="text-white/40 text-sm italic">No vibe selected</span>
              </>
            )}
          </div>

          <button
            onClick={handleRandomVibe}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-semibold text-sm border border-white/15 hover:border-white/30 backdrop-blur-md transition-all hover:scale-105 active:scale-95 group"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            <span className="text-lg group-hover:animate-spin" style={{ animationDuration: '0.5s' }}>
              🎲
            </span>
            <span className="text-white/80">Random Vibe</span>
          </button>
        </div>

        {/* Mood Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {VIBES.map((vibe) => (
            <VibeCard
              key={vibe.id}
              vibe={vibe}
              isSelected={selectedVibe?.id === vibe.id}
              onClick={() => handleCardClick(vibe)}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-white/20 text-xs">
          <p>
            {VIBES.length} curated moods • Links open YouTube in a new tab
          </p>
        </div>
      </main>

      {/* Expanded Vibe Modal */}
      {expandedVibe && (
        <ExpandedVibe vibe={expandedVibe} onClose={() => setExpandedVibe(null)} />
      )}
    </div>
  );
}
