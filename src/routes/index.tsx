import { createFileRoute } from "@tanstack/react-router";
import { TubeTVPage } from "@/components/tv/TubeTVPage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TubeTV - YouTube as live channels" },
      {
        name: "description",
        content:
          "A retro IPTV-style guide for YouTube. Shuffled music, nature, comedy, gaming and more - playing 24/7.",
      },
      { property: "og:title", content: "TubeTV - YouTube as live channels" },
      {
        property: "og:description",
        content:
          "Channel-surf the best of YouTube. Lofi, synthwave, nature, gaming, docs - auto-shuffled.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return <TubeTVPage />;
}
