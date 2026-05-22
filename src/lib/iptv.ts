// Lightweight IPTV helper using the public iptv-org playlists hosted on GitHub Pages.
// We fetch a per-country .m3u file and parse it on the client. CORS is allowed
// from iptv-org.github.io.

export type IptvChannel = {
  id: string;
  name: string;
  logo?: string;
  group?: string;
  url: string;
};

export const IPTV_COUNTRIES: { code: string; name: string; flag: string }[] = [
  { code: "us", name: "United States", flag: "🇺🇸" },
  { code: "uk", name: "United Kingdom", flag: "🇬🇧" },
  { code: "ca", name: "Canada", flag: "🇨🇦" },
  { code: "fr", name: "France", flag: "🇫🇷" },
  { code: "de", name: "Germany", flag: "🇩🇪" },
  { code: "es", name: "Spain", flag: "🇪🇸" },
  { code: "it", name: "Italy", flag: "🇮🇹" },
  { code: "nl", name: "Netherlands", flag: "🇳🇱" },
  { code: "br", name: "Brazil", flag: "🇧🇷" },
  { code: "mx", name: "Mexico", flag: "🇲🇽" },
  { code: "ar", name: "Argentina", flag: "🇦🇷" },
  { code: "in", name: "India", flag: "🇮🇳" },
  { code: "jp", name: "Japan", flag: "🇯🇵" },
  { code: "kr", name: "South Korea", flag: "🇰🇷" },
  { code: "cn", name: "China", flag: "🇨🇳" },
  { code: "tr", name: "Turkey", flag: "🇹🇷" },
  { code: "ru", name: "Russia", flag: "🇷🇺" },
  { code: "ua", name: "Ukraine", flag: "🇺🇦" },
  { code: "pl", name: "Poland", flag: "🇵🇱" },
  { code: "se", name: "Sweden", flag: "🇸🇪" },
  { code: "no", name: "Norway", flag: "🇳🇴" },
  { code: "au", name: "Australia", flag: "🇦🇺" },
  { code: "nz", name: "New Zealand", flag: "🇳🇿" },
  { code: "ae", name: "UAE", flag: "🇦🇪" },
  { code: "sa", name: "Saudi Arabia", flag: "🇸🇦" },
  { code: "eg", name: "Egypt", flag: "🇪🇬" },
  { code: "za", name: "South Africa", flag: "🇿🇦" },
  { code: "th", name: "Thailand", flag: "🇹🇭" },
  { code: "id", name: "Indonesia", flag: "🇮🇩" },
  { code: "ph", name: "Philippines", flag: "🇵🇭" },
];

function parseAttrs(line: string): Record<string, string> {
  const out: Record<string, string> = {};
  const re = /([a-zA-Z0-9_-]+)="([^"]*)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) out[m[1]] = m[2];
  return out;
}

export function parseM3U(text: string): IptvChannel[] {
  const lines = text.split(/\r?\n/);
  const out: IptvChannel[] = [];
  let pending: Partial<IptvChannel> | null = null;
  let i = 0;
  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith("#EXTINF")) {
      const attrs = parseAttrs(line);
      const commaIdx = line.indexOf(",");
      const name = commaIdx >= 0 ? line.slice(commaIdx + 1).trim() : attrs["tvg-name"] || "Channel";
      pending = {
        id: attrs["tvg-id"] || `${name}-${i++}`,
        name,
        logo: attrs["tvg-logo"],
        group: attrs["group-title"],
      };
    } else if (line && !line.startsWith("#") && pending) {
      pending.url = line;
      if (pending.url && pending.name) out.push(pending as IptvChannel);
      pending = null;
    }
  }
  return out;
}

const cache = new Map<string, Promise<IptvChannel[]>>();

export function loadCountryChannels(code: string): Promise<IptvChannel[]> {
  const key = code.toLowerCase();
  if (cache.has(key)) return cache.get(key)!;
  const url = `https://iptv-org.github.io/iptv/countries/${key}.m3u`;
  const p = fetch(url)
    .then((r) => {
      if (!r.ok) throw new Error(`Failed to load ${code} (${r.status})`);
      return r.text();
    })
    .then((t) => parseM3U(t));
  cache.set(key, p);
  return p;
}