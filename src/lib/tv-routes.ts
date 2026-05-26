import { getChannelPath, type Channel } from "@/lib/channels";

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

export function getRadioPath(country: string) {
  return `/radio/${normalizeRadioCountryCode(country).toLowerCase()}`;
}

export function getTvPath(
  mode: TvMode,
  channel: Channel,
  iptvCountry: string,
  radioCountry: string,
) {
  if (mode === "iptv") return getIptvPath(iptvCountry);
  if (mode === "radio") return getRadioPath(radioCountry);
  return getChannelPath(channel);
}
