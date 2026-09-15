export function KpiTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="pb-2 min-w-[130px]">
      <div className="font-mono text-[11px] tracking-[0.12em] uppercase text-text-on-dark-muted">{label}</div>
      <div className="font-mono font-medium text-[23px] tabular-nums whitespace-nowrap">{value}</div>
      {hint && <div className="text-[12px] text-text-on-dark-muted">{hint}</div>}
    </div>
  );
}

export function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-[11px] tracking-[0.12em] uppercase text-text-on-dark-muted">{label}</div>
      <div className="font-display text-[52px] leading-[1.1] text-lima-ui tabular-nums tracking-[0.01em] whitespace-nowrap">
        {value}
      </div>
    </div>
  );
}

export function CardTile({
  nome,
  n,
  total,
  pct,
  ativo,
  onClick,
}: {
  nome: string;
  n: number;
  total: string;
  pct: number;
  ativo: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="text-left bg-surface rounded-sm py-3.5 px-4 flex flex-col gap-2.5 cursor-pointer border hover:border-ink"
      style={{ borderColor: ativo ? "#101210" : "#E0E3DD" }}
    >
      <div className="flex items-center justify-between gap-2.5 w-full">
        <span className="font-mono text-[13px] whitespace-nowrap">{nome}</span>
        <span className="font-mono text-[11px] text-text-faint whitespace-nowrap">{n} lanç.</span>
      </div>
      <div className="font-mono font-semibold text-[21px] tabular-nums tracking-[-0.01em] whitespace-nowrap">{total}</div>
      <div className="h-1 w-full bg-[#ECEEE9] rounded-[2px] overflow-hidden">
        <div className="h-full bg-ink" style={{ width: `${pct}%` }} />
      </div>
    </button>
  );
}

export function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="h-1 bg-[#ECEEE9] rounded-[2px] overflow-hidden">
      <div className="h-full bg-ink" style={{ width: `${pct}%` }} />
    </div>
  );
}
