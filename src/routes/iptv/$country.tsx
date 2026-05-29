import { createFileRoute } from "@tanstack/react-router";
import { TubeTVPage } from "@/components/tv/TubeTVPage";
import { IPTV_COUNTRIES } from "@/lib/iptv";
import { TvNotFound } from "@/components/tv/TvNotFound";

export const Route = createFileRoute("/iptv/$country")({
  head: ({ params }) => {
    const country = IPTV_COUNTRIES.find((c) => c.code === params.country.toLowerCase()) ?? null;
    return {
      meta: [
        { title: country ? `TubeTV - IPTV ${country.name}` : "TubeTV - IPTV country not found" },
        {
          name: "description",
          content: country
            ? `Watch live TV streams for ${country.name} inside TubeTV.`
            : "The requested IPTV country could not be found.",
        },
        {
          property: "og:title",
          content: country ? `TubeTV - IPTV ${country.name}` : "TubeTV - IPTV country not found",
        },
      ],
    };
  },
  component: IptvRoute,
});

function IptvRoute() {
  const { country } = Route.useParams();
  const normalized = country.toLowerCase();
  const countryData = IPTV_COUNTRIES.find((c) => c.code === normalized) ?? null;

  if (!countryData) {
    return (
      <TvNotFound
        eyebrow="IPTV missing"
        title="No IPTV list for that country."
        detail="That country slug is not available in the current IPTV lineup. Return to the desk and pick another source."
        slug={normalized}
      />
    );
  }

  return <TubeTVPage initialMode="iptv" initialIptvCountry={countryData.code} />;
}
