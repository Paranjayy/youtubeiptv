import { useEffect, useState } from "react";

export function Clock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!now)
    return (
      <span suppressHydrationWarning className="font-mono-tv text-sm text-muted-foreground">
        --:--:--
      </span>
    );
  const time = now.toLocaleTimeString([], { hour12: false });
  const date = now.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
  return (
    <div suppressHydrationWarning className="flex items-baseline gap-3 font-mono-tv">
      <span className="text-sm uppercase text-muted-foreground">{date}</span>
      <span className="text-base text-primary text-glow">{time}</span>
    </div>
  );
}
