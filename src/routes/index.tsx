import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
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
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#050608]">
        <div className="flex flex-col items-center gap-3">
          <div className="text-2xl font-black tracking-tight text-white">
            Tube<span className="text-[oklch(0.82_0.18_152)]">TV</span>
          </div>
          <div className="text-[10px] font-mono-tv uppercase tracking-[0.5em] text-white/30">
            loading...
          </div>
        </div>
      </div>
    );
  }

  return <TubeTVPage />;
}
