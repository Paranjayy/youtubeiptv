import { getChannelPath, normalizeChannelSlug, type Channel } from "@/lib/channels";
import { type IptvChannel } from "@/lib/iptv";
import { type RadioStation } from "@/lib/radio";

export type TvMode = "yt" | "iptv" | "radio" | "movies";

export type TvHistoryEntry = {
  mode: TvMode;
  title: string;
  subtitle: string;
  path: string;
};

export function normalizeIptvCountryCode(code: string) {
  return code.trim().toLowerCase();
}

export function normalizeRadioCountryCode(code: string) {
  return code.trim().toUpperCase();
}

export function getIptvPath(country: string) {
  return `/iptv/${normalizeIptvCountryCode(country)}`;
}

export function getIptvItemSlug(channel: IptvChannel) {
  return normalizeChannelSlug(`${channel.name}-${channel.id || channel.url}`);
}

export function getIptvItemPath(country: string, channel: IptvChannel) {
  return `${getIptvPath(country)}/${getIptvItemSlug(channel)}`;
}

export function getRadioPath(country: string) {
  return `/radio/${normalizeRadioCountryCode(country).toLowerCase()}`;
}

export function getRadioItemSlug(station: RadioStation) {
  return normalizeChannelSlug(`${station.name}-${station.stationuuid.slice(0, 8)}`);
}

export function getRadioItemPath(country: string, station: RadioStation) {
  return `${getRadioPath(country)}/${getRadioItemSlug(station)}`;
}

export function findIptvChannelBySlug(list: IptvChannel[], slug: string) {
  const normalized = normalizeChannelSlug(slug);
  
  // 1. Exact match
  const exact =
    list.find((channel) => getIptvItemSlug(channel) === normalized) ??
    list.find((channel) => normalizeChannelSlug(channel.id) === normalized) ??
    list.find((channel) => normalizeChannelSlug(channel.name) === normalized);
  if (exact) return exact;

  // 2. Fuzzy name prefix / substring match
  const fuzzyName = list.find((channel) => {
    const chName = normalizeChannelSlug(channel.name);
    return chName.length > 3 && (normalized.startsWith(chName) || chName.startsWith(normalized));
  });
  if (fuzzyName) return fuzzyName;

  // 3. Fuzzy ID substring match
  const fuzzyId = list.find((channel) => {
    const chId = normalizeChannelSlug(channel.id);
    return chId.length > 3 && (normalized.includes(chId) || chId.includes(normalized));
  });
  return fuzzyId ?? null;
}

export function findRadioStationBySlug(list: RadioStation[], slug: string) {
  const normalized = normalizeChannelSlug(slug);
  
  // 1. Exact match
  const exact =
    list.find((station) => getRadioItemSlug(station) === normalized) ??
    list.find((station) => normalizeChannelSlug(station.stationuuid) === normalized) ??
    list.find((station) => normalizeChannelSlug(station.name) === normalized);
  if (exact) return exact;

  // 2. Fuzzy name prefix match
  const fuzzyName = list.find((station) => {
    const stName = normalizeChannelSlug(station.name);
    return stName.length > 3 && (normalized.startsWith(stName) || stName.startsWith(normalized));
  });
  return fuzzyName ?? null;
}

export function getTvPath(
  mode: TvMode,
  channel: Channel,
  iptvCountry: string,
  radioCountry: string,
  iptvItemSlug?: string | null,
  radioItemSlug?: string | null,
) {
  if (mode === "iptv")
    return iptvItemSlug ? `${getIptvPath(iptvCountry)}/${iptvItemSlug}` : getIptvPath(iptvCountry);
  if (mode === "radio")
    return radioItemSlug
      ? `${getRadioPath(radioCountry)}/${radioItemSlug}`
      : getRadioPath(radioCountry);
  if (mode === "movies")
    return "/movies";
  return getChannelPath(channel);
}

export function makeYtHistoryEntry(channel: Channel): TvHistoryEntry {
  return {
    mode: "yt",
    title: channel.name,
    subtitle: channel.tagline,
    path: getChannelPath(channel),
  };
}

export function makeIptvHistoryEntry(country: string, channel: IptvChannel): TvHistoryEntry {
  return {
    mode: "iptv",
    title: channel.name,
    subtitle: `${country.toLowerCase()} · ${channel.group || "general"}`,
    path: getIptvItemPath(country, channel),
  };
}

export function makeRadioHistoryEntry(country: string, station: RadioStation): TvHistoryEntry {
  return {
    mode: "radio",
    title: station.name,
    subtitle: `${country.toUpperCase()} · ${(station.tags || "general").split(",")[0]}`,
    path: getRadioItemPath(country, station),
  };
}

export function dedupeHistory(entries: TvHistoryEntry[], next: TvHistoryEntry, limit = 8) {
  return [next, ...entries.filter((entry) => entry.path !== next.path)].slice(0, limit);
}
