import { seatRows, hasAisleAfter, isBlocked } from "@/lib/seats";

type Props = {
  taken: Set<string>;
  selected?: string | null;
  onSelect?: (seat: string) => void;
  // "sm" is the compact read-only map in the admin panel, where taken seats are highlighted.
  size?: "md" | "sm";
};

const stateStyles = {
  free: "border border-line bg-surface-2 text-muted hover:border-accent hover:text-accent",
  selected: "bg-accent text-accent-ink font-bold shadow-[0_0_14px_rgb(245_184_61/0.55)] scale-110",
  taken: "bg-taken text-muted/60",
  takenAdmin: "bg-accent text-accent-ink font-bold",
  blocked: "invisible",
};

// Shared seat grid: interactive on the home page, read-only in the admin panel.
export function SeatMap({ taken, selected, onSelect, size = "md" }: Props) {
  const md = size === "md";

  return (
    <div className="overflow-x-auto pb-1">
      <div className={`mx-auto space-y-1.5 ${md ? "min-w-[296px]" : "min-w-[240px]"}`}>
        {seatRows.map((row) => (
          <div key={row.label} className="flex items-center gap-1">
            <span className="w-4 shrink-0 text-center text-[11px] font-semibold text-muted">{row.label}</span>
            <div className={`flex flex-1 justify-center ${md ? "gap-1" : "gap-0.5"}`}>
              {row.seats.map((code, i) => {
                const isTaken = taken.has(code);
                const isSelected = selected === code;
                const state = isBlocked(code)
                  ? "blocked"
                  : isTaken
                    ? md
                      ? "taken"
                      : "takenAdmin"
                    : isSelected
                      ? "selected"
                      : "free";
                return (
                  <div key={code} className="contents">
                    <button
                      type="button"
                      disabled={!onSelect || isTaken || state === "blocked"}
                      onClick={onSelect ? () => onSelect(code) : undefined}
                      aria-label={`Kursi ${code}${isTaken ? " (terisi)" : ""}`}
                      aria-pressed={isSelected}
                      title={code}
                      className={`aspect-square min-w-0 flex-1 rounded-t-[9px] rounded-b-[4px] transition-all duration-150 disabled:cursor-default ${md ? "max-w-10 text-[10px]" : "max-w-7 text-[8px]"} ${stateStyles[state]}`}
                    >
                      {state === "taken" ? "✕" : i + 1}
                    </button>
                    {hasAisleAfter(i + 1) && i + 1 < row.seats.length && (
                      <span className={`${md ? "w-3" : "w-1.5"} shrink-0`} />
                    )}
                  </div>
                );
              })}
            </div>
            <span className="w-4 shrink-0 text-center text-[11px] font-semibold text-muted">{row.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SeatLegend() {
  const items = [
    { label: "Tersedia", cls: "border border-line bg-surface-2" },
    { label: "Dipilih", cls: "bg-accent" },
    { label: "Terisi", cls: "bg-taken" },
  ];
  return (
    <div className="flex justify-center gap-5 text-xs text-muted">
      {items.map((it) => (
        <span key={it.label} className="flex items-center gap-1.5">
          <span className={`size-3.5 rounded-t-[5px] rounded-b-[2px] ${it.cls}`} />
          {it.label}
        </span>
      ))}
    </div>
  );
}
