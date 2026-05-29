import { createFileRoute } from "@tanstack/react-router";
import { TubeTVPage } from "@/components/tv/TubeTVPage";
import { getChannelBySlug } from "@/lib/channels";
import { TvNotFound } from "@/components/tv/TvNotFound";

export const Route = createFileRoute("/channels/$slug")({
  head: ({ params }) => {
    const channel = getChannelBySlug(params.slug);
    return {
      meta: [
        { title: channel ? `TubeTV - ${channel.name}` : "TubeTV - Channel not found" },
        {
          name: "description",
          content: channel
            ? `Watch ${channel.name} on TubeTV, the retro YouTube live-channel experience.`
            : "The requested TubeTV channel could not be found.",
        },
        {
          property: "og:title",
          content: channel ? `TubeTV - ${channel.name}` : "TubeTV - Channel not found",
        },
      ],
    };
  },
  component: ChannelRoute,
});

function ChannelRoute() {
  const { slug } = Route.useParams();
  const channel = getChannelBySlug(slug);

  if (!channel) {
    return (
      <TvNotFound
        eyebrow="Channel missing"
        title="That channel slug went off air."
        detail="The requested YouTube channel is not in the current lineup. Jump back to the TV desk or try discovery."
        slug={slug}
      />
    );
  }

  return <TubeTVPage initialChannelSlug={channel.id} />;
}
