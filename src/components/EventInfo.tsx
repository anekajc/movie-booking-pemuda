import { event } from "@/config/event";

export function EventInfo({ compact = false }: { compact?: boolean }) {
  const items = [
    { label: "Tanggal", value: event.date },
    { label: "Jam", value: event.time },
    { label: "Tempat", value: event.location },
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
