import { createFileRoute } from "@tanstack/react-router";
import { TubeTVPage } from "@/components/tv/TubeTVPage";

interface MoviesSearch {
  id?: string;
  type?: "movie" | "tv";
}

export const Route = createFileRoute("/movies")({
  validateSearch: (search: Record<string, unknown>): MoviesSearch => {
    return {
      id: search.id ? String(search.id) : undefined,
      type: search.type === "movie" || search.type === "tv" ? search.type : undefined,
    };
  },
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
  const { id, type } = Route.useSearch();
  return (
    <TubeTVPage
      initialMode="movies"
      initialMovieId={id || null}
      initialMovieType={type || null}
    />
  );
}
