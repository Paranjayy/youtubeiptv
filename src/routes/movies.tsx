import { createFileRoute } from "@tanstack/react-router";
import { TubeTVPage } from "@/components/tv/TubeTVPage";

export const Route = createFileRoute("/movies")({
  head: () => ({
    meta: [
      { title: "Cinema desk - TubeTV" },
      {
        name: "description",
        content: "Search and stream movies and series on-demand via flawless non-torrent servers.",
      },
    ],
  }),
  component: MoviesPage,
});

function MoviesPage() {
  return <TubeTVPage initialMode="movies" />;
}
