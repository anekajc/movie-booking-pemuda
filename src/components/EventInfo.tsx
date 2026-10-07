import { formatEventDate, formatEventTime, type EventSettings } from "@/lib/events";

export function EventInfo({ settings, compact = false }: { settings: EventSettings; compact?: boolean }) {
  const items = [
    { label: "Tanggal", value: formatEventDate(settings.eventDate) },
    { label: "Jam", value: formatEventTime(settings.eventTime) },
    { label: "Tempat", value: settings.location },
  ];
  return (
    <dl className={compact ? "grid grid-cols-3 gap-2 text-center" : "space-y-2"}>
      {items.map((it) => (
        <div key={it.label} className={compact ? "" : "flex justify-between gap-4"}>
          <dt className="text-xs tracking-wider text-muted uppercase">{it.label}</dt>
          <dd className={compact ? "mt-0.5 text-sm font-semibold" : "text-right font-semibold"}>
            {it.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
