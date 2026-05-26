import { Link, createFileRoute } from "@tanstack/react-router";
import { TubeTVPage } from "@/components/tv/TubeTVPage";
import { IPTV_COUNTRIES } from "@/lib/iptv";

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
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-center">
        <div className="max-w-md">
          <h1 className="text-3xl font-bold tracking-tight">IPTV country not found</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            We could not resolve the country slug{" "}
            <span className="font-mono-tv text-foreground">{normalized}</span>.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return <TubeTVPage initialMode="iptv" initialIptvCountry={countryData.code} />;
}
