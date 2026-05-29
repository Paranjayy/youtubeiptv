import { createFileRoute } from "@tanstack/react-router";
import { TubeTVPage } from "@/components/tv/TubeTVPage";
import { RADIO_COUNTRIES } from "@/lib/radio";
import { TvNotFound } from "@/components/tv/TvNotFound";

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
      <TvNotFound
        eyebrow="Radio missing"
        title="No radio room for that country."
        detail="That country slug is not available in the current radio lineup. Return to the desk and pick another station."
        slug={normalized.toLowerCase()}
      />
    );
  }

  return <TubeTVPage initialMode="radio" initialRadioCountry={countryData.code} />;
}
