function pad2(n: number) {
  return String(n).padStart(2, "0");
}

// UTC format: YYYYMMDDTHHMMSSZ
function toUtcCompact(dt: Date) {
  return (
    dt.getUTCFullYear() +
    pad2(dt.getUTCMonth() + 1) +
    pad2(dt.getUTCDate()) +
    "T" +
    pad2(dt.getUTCHours()) +
    pad2(dt.getUTCMinutes()) +
    pad2(dt.getUTCSeconds()) +
    "Z"
  );
}

export function googleCalendarUrl(args: {
  title: string;
  startAt: Date;
  endAt: Date;
  details?: string;
  location?: string;
}) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: args.title,
    dates: `${toUtcCompact(args.startAt)}/${toUtcCompact(args.endAt)}`,
  });
  if (args.details) params.set("details", args.details);
  if (args.location) params.set("location", args.location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function yahooCalendarUrl(args: {
  title: string;
  startAt: Date;
  endAt: Date;
  details?: string;
  location?: string;
}) {
  const params = new URLSearchParams({
    v: "60",
    view: "d",
    type: "20",
    title: args.title,
    st: toUtcCompact(args.startAt),
    et: toUtcCompact(args.endAt),
  });
  if (args.details) params.set("desc", args.details);
  if (args.location) params.set("in_loc", args.location);
  return `https://calendar.yahoo.com/?${params.toString()}`;
}

