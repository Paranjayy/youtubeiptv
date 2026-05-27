import { getChannelPath, normalizeChannelSlug, type Channel } from "@/lib/channels";
import { type IptvChannel } from "@/lib/iptv";
import { type RadioStation } from "@/lib/radio";

export type TvMode = "yt" | "iptv" | "radio";

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
  return (
    list.find((channel) => getIptvItemSlug(channel) === normalized) ??
    list.find((channel) => normalizeChannelSlug(channel.id) === normalized) ??
    list.find((channel) => normalizeChannelSlug(channel.name) === normalized) ??
    null
  );
}

export function findRadioStationBySlug(list: RadioStation[], slug: string) {
  const normalized = normalizeChannelSlug(slug);
  return (
    list.find((station) => getRadioItemSlug(station) === normalized) ??
    list.find((station) => normalizeChannelSlug(station.stationuuid) === normalized) ??
    list.find((station) => normalizeChannelSlug(station.name) === normalized) ??
    null
  );
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
  return getChannelPath(channel);
}
