export function StatusBadge({ ativa, onClick }: { ativa: boolean; onClick?: () => void }) {
  const estilo = {
    background: ativa ? "var(--color-success-bg)" : "var(--color-neutral-badge-bg)",
    color: ativa ? "var(--color-success)" : "var(--color-text-faint-2)",
    borderColor: ativa ? "var(--color-success)" : "var(--color-text-faint-2)",
  };
  if (!onClick) {
    return (
      <span className="font-mono text-[11px] rounded-pill px-2.5 py-0.5 whitespace-nowrap border" style={estilo}>
        {ativa ? "Ativa" : "Inativa"}
      </span>
    );
  }
  return (
    <button
      onClick={onClick}
      className="font-mono text-[11px] rounded-pill px-2.5 py-0.5 whitespace-nowrap border cursor-pointer hover:opacity-70"
      style={estilo}
    >
      {ativa ? "Ativa" : "Inativa"}
    </button>
  );
}

export function OriginBadge({ origem }: { origem: "manual" | "csv" }) {
  const isCsv = origem === "csv";
  return (
    <span
      className="font-mono text-[10.5px] rounded-pill px-2 py-0.5 whitespace-nowrap"
      style={{
        background: isCsv ? "var(--color-success-bg)" : "var(--color-neutral-badge-bg)",
        color: isCsv ? "var(--color-success)" : "var(--color-text-muted)",
      }}
    >
      {isCsv ? "CSV Meta" : "Manual"}
    </span>
  );
}
