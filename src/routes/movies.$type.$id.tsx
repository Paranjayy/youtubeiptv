import { createFileRoute } from "@tanstack/react-router";
import { TubeTVPage } from "@/components/tv/TubeTVPage";

export const Route = createFileRoute("/movies/$type/$id")({
  head: () => ({
    meta: [
      { title: "Watch Stream - TubeTV" },
      {
        name: "description",
        content: "Watch your favorite movie or TV show on-demand inside TubeTV.",
      },
    ],
  }),
  component: MoviesItemRoute,
});

function MoviesItemRoute() {
  const { type, id } = Route.useParams();
  return (
    <TubeTVPage
      initialMode="movies"
      initialMovieId={id}
      initialMovieType={type === "tv" ? "tv" : "movie"}
    />
  );
}
