import { Link, createFileRoute } from "@tanstack/react-router";
import { TubeTVPage } from "@/components/tv/TubeTVPage";
import { getChannelBySlug } from "@/lib/channels";

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
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-center">
        <div className="max-w-md">
          <h1 className="text-3xl font-bold tracking-tight">Channel not found</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            We could not resolve the slug{" "}
            <span className="font-mono-tv text-foreground">{slug}</span>.
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

  return <TubeTVPage initialChannelSlug={channel.id} />;
}
