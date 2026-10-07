import { isBlocked, seatsInRow, type SeatLayout } from "@/lib/seats";

type Props = {
  layout: SeatLayout;
  taken: Set<string>;
  selected?: string[];
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
export function SeatMap({ layout, taken, selected = [], onSelect, size = "md" }: Props) {
  const md = size === "md";
  const n = layout.seatsPerRow;
  // Smallest comfortable width (a bit tighter for wide rows so 12 seats still fit a phone);
  // wider grids scroll sideways inside the box instead of shrinking further.
  const wide = n > 10;
  const seat = md ? (wide ? 18 : 21) : 16;
  const gap = md ? (wide ? 2 : 4) : 2;
  const aisle = md ? 12 : 6;
  const minWidth = n * seat + (n - 1) * gap + (layout.aisleAfter ? aisle : 0) + 40;

  return (
    <div className="scroll-x-hint overflow-x-auto pb-1">
      <div className="mx-auto space-y-1.5" style={{ minWidth }}>
        {layout.rowLabels.map((row) => (
          <div key={row} className="flex items-center gap-1">
            <span className="w-4 shrink-0 text-center text-[11px] font-semibold text-muted">{row}</span>
            <div className="flex flex-1 justify-center" style={{ gap }}>
              {seatsInRow(layout, row).map((code, i) => {
                const isTaken = taken.has(code);
                const isSelected = selected.includes(code);
                const state = isBlocked(layout, code)
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
                      className={`aspect-square min-w-0 flex-1 rounded-t-[9px] rounded-b-sm transition-all duration-150 disabled:cursor-default ${md ? "max-w-10 text-[10px]" : "max-w-7 text-[8px]"} ${stateStyles[state]}`}
                    >
                      {state === "taken" ? "✕" : i + 1}
                    </button>
                    {layout.aisleAfter === i + 1 && i + 1 < n && (
                      <span className="shrink-0" style={{ width: aisle }} />
                    )}
                  </div>
                );
              })}
            </div>
            <span className="w-4 shrink-0 text-center text-[11px] font-semibold text-muted">{row}</span>
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
          <span className={`size-3.5 rounded-t-[5px] rounded-b-xs ${it.cls}`} />
          {it.label}
        </span>
      ))}
    </div>
  );
}
