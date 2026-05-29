export type WikiOnThisDayPage = {
  title: string;
  description?: string;
  extract?: string;
  url: string;
};

export type WikiOnThisDayEvent = {
  year: number;
  text: string;
  pages: WikiOnThisDayPage[];
};

export type WikiSummary = {
  title: string;
  description?: string;
  extract: string;
  url: string;
};

export type WikiSearchResult = {
  title: string;
  snippet: string;
  pageId: number;
  url: string;
};

export type ArtistSearchResult = {
  id: string;
  name: string;
  type?: string;
  country?: string;
  area?: string;
  disambiguation?: string;
  url: string;
};

type WikiOnThisDayResponse = {
  events?: Array<{
    year?: number;
    text?: string;
    pages?: Array<{
      titles?: {
        display?: string;
        canonical?: string;
      };
      title?: string;
      description?: string;
      extract?: string;
      content_urls?: {
        desktop?: {
          page?: string;
        };
      };
    }>;
  }>;
};

type WikiRandomSummaryResponse = {
  title?: string;
  description?: string;
  extract?: string;
  content_urls?: {
    desktop?: {
      page?: string;
    };
  };
};

type WikiSearchResponse = {
  query?: {
    search?: Array<{
      title?: string;
      snippet?: string;
      pageid?: number;
    }>;
  };
};

type MusicBrainzArtistResponse = {
  artists?: Array<{
    id?: string;
    name?: string;
    type?: string;
    country?: string;
    disambiguation?: string;
    area?: {
      name?: string;
    };
  }>;
};

function wikiPageUrl(title: string) {
  return `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`;
}

function mbArtistUrl(id: string) {
  return `https://musicbrainz.org/artist/${id}`;
}

export async function fetchWikiOnThisDay() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const response = await fetch(
    `https://en.wikipedia.org/api/rest_v1/feed/onthisday/all/${month}/${day}`,
  );
  if (!response.ok) throw new Error("Failed to load today's wiki feed");
  const data = (await response.json()) as WikiOnThisDayResponse;
  const events = Array.isArray(data?.events) ? data.events : [];
  return events.slice(0, 8).map((event) => ({
    year: Number(event.year) || 0,
    text: String(event.text || ""),
    pages: Array.isArray(event.pages)
      ? event.pages.slice(0, 2).map((page) => ({
          title: String(page?.titles?.display || page?.titles?.canonical || page?.title || "").replace(/<[^>]+>/g, ""),
          description: page?.description ? String(page.description) : undefined,
          extract: page?.extract ? String(page.extract) : undefined,
          url: String(
            page?.content_urls?.desktop?.page ||
              wikiPageUrl(page?.titles?.canonical || page?.title || ""),
          ),
        }))
      : [],
  })) as WikiOnThisDayEvent[];
}

export async function fetchRandomWikiSummary() {
  const response = await fetch("https://en.wikipedia.org/api/rest_v1/page/random/summary");
  if (!response.ok) throw new Error("Failed to load random article");
  const data = (await response.json()) as WikiRandomSummaryResponse;
  return {
    title: String(data?.title || "Random article"),
    description: data?.description ? String(data.description) : undefined,
    extract: String(data?.extract || "No summary available."),
    url: String(data?.content_urls?.desktop?.page || wikiPageUrl(data?.title || "Random article")),
  } satisfies WikiSummary;
}

export async function searchWikiArticles(query: string) {
  const response = await fetch(
    `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*&srlimit=8`,
  );
  if (!response.ok) throw new Error("Failed to search Wikipedia");
  const data = (await response.json()) as WikiSearchResponse;
  const results = Array.isArray(data?.query?.search) ? data.query.search : [];
  return results.map((item) => ({
    title: String(item?.title || ""),
    snippet: String(item?.snippet || "").replace(/<[^>]+>/g, ""),
    pageId: Number(item?.pageid) || 0,
    url: wikiPageUrl(String(item?.title || "")),
  })) as WikiSearchResult[];
}

export async function searchArtists(query: string) {
  const response = await fetch(
    `https://musicbrainz.org/ws/2/artist/?query=${encodeURIComponent(`artist:${query}`)}&fmt=json&limit=8`,
  );
  if (!response.ok) throw new Error("Failed to search artists");
  const data = (await response.json()) as MusicBrainzArtistResponse;
  const artists = Array.isArray(data?.artists) ? data.artists : [];
  return artists.map((artist) => ({
    id: String(artist?.id || ""),
    name: String(artist?.name || ""),
    type: artist?.type ? String(artist.type) : undefined,
    country: artist?.country ? String(artist.country) : undefined,
    area: artist?.area?.name ? String(artist.area.name) : undefined,
    disambiguation: artist?.disambiguation ? String(artist.disambiguation) : undefined,
    url: mbArtistUrl(String(artist?.id || "")),
  })) as ArtistSearchResult[];
}
