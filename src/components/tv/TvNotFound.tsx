import { Link } from "@tanstack/react-router";
import { Compass, Home, Radio, Search, Tv } from "lucide-react";

type TvNotFoundProps = {
  eyebrow?: string;
  title: string;
  detail: string;
  slug?: string;
};

export function TvNotFound({ eyebrow = "Signal lost", title, detail, slug }: TvNotFoundProps) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10 text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(79,174,123,0.14),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(226,174,74,0.12),transparent_24%)]" />
      <section className="relative w-full max-w-3xl">
        <div className="border-y border-border/70 py-8 sm:py-10">
          <div className="flex items-center gap-2 font-mono-tv text-[10px] uppercase tracking-[0.32em] text-primary">
            <Tv className="h-4 w-4" />
            {eyebrow}
          </div>
          <h1 className="mt-4 max-w-2xl text-4xl font-black tracking-tight sm:text-6xl">{title}</h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
            {detail}
          </p>
          {slug && (
            <div className="mt-4 inline-flex max-w-full items-center gap-2 rounded-md border border-border/70 bg-background/45 px-3 py-2 font-mono-tv text-[11px] uppercase tracking-widest text-muted-foreground">
              <Search className="h-3.5 w-3.5 text-accent" />
              <span className="truncate">{slug}</span>
            </div>
          )}
          <div className="mt-7 flex flex-wrap gap-2">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-95"
            >
              <Home className="h-4 w-4" />
              TV desk
            </Link>
            <Link
              to="/discover"
              className="inline-flex items-center gap-2 rounded-md border border-border/70 bg-background/45 px-4 py-2 text-sm font-semibold text-foreground hover:border-primary/60 hover:bg-primary/10"
            >
              <Compass className="h-4 w-4" />
              Discover
            </Link>
            <Link
              to="/radio/us"
              className="inline-flex items-center gap-2 rounded-md border border-border/70 bg-background/45 px-4 py-2 text-sm font-semibold text-foreground hover:border-accent/60 hover:bg-accent/10"
            >
              <Radio className="h-4 w-4" />
              Radio
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
