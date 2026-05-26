import { Link, createFileRoute } from "@tanstack/react-router";
import { TubeTVPage } from "@/components/tv/TubeTVPage";
import { RADIO_COUNTRIES } from "@/lib/radio";

export const Route = createFileRoute("/radio/$country")({
  head: ({ params }) => {
    const country = RADIO_COUNTRIES.find((c) => c.code === params.country.toUpperCase()) ?? null;
    return {
      meta: [
        { title: country ? `TubeTV - Radio ${country.name}` : "TubeTV - Radio country not found" },
        {
          name: "description",
          content: country
            ? `Listen to radio stations from ${country.name} inside TubeTV.`
            : "The requested radio country could not be found.",
        },
        {
          property: "og:title",
          content: country ? `TubeTV - Radio ${country.name}` : "TubeTV - Radio country not found",
        },
      ],
    };
  },
  component: RadioRoute,
});

function RadioRoute() {
  const { country } = Route.useParams();
  const normalized = country.toUpperCase();
  const countryData = RADIO_COUNTRIES.find((c) => c.code === normalized) ?? null;

  if (!countryData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-center">
        <div className="max-w-md">
          <h1 className="text-3xl font-bold tracking-tight">Radio country not found</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            We could not resolve the country slug{" "}
            <span className="font-mono-tv text-foreground">{normalized.toLowerCase()}</span>.
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

  return <TubeTVPage initialMode="radio" initialRadioCountry={countryData.code} />;
}
