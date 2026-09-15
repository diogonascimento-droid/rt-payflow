export type LinhaCsv = { data: string; id: string; cartao: string; valor: number };

export type ResultadoCsv =
  | { ok: true; contaId: string; periodo: string; rows: LinhaCsv[] }
  | { ok: false; tipo: "invalido" | "vazio" | "conta_desconhecida"; contaId?: string; periodo?: string; rows?: LinhaCsv[] };

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQ = !inQ;
      continue;
    }
    if (ch === "," && !inQ) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out;
}

export function parseValorBR(s: string): number {
  const n = parseFloat(s.replace(/\./g, "").replace(",", "."));
  return isNaN(n) ? NaN : n;
}

/** Faz o parse do "Resumo de Fatura" (relatório de cobrança) exportado pelo Meta Ads Manager. */
export function parseMetaCsv(text: string): ResultadoCsv {
  const lines = text.split(/\r?\n/);
  const head = (lines[0] || "").trim().toLowerCase().replace(/^\ufeff/, "");
  if (!head.includes("informações da meta") && !head.includes("informacoes da meta")) {
    return { ok: false, tipo: "invalido" };
  }

  const contaMatch = text.match(/Conta:\s*(\d+)/);
  if (!contaMatch) return { ok: false, tipo: "invalido" };
  const contaId = contaMatch[1];

  const perMatch = text.match(/Relat[oó]rio de cobran[cç]a:\s*([\d/]+)\s*a\s*([\d/]+)/i);
  const periodo = perMatch ? `${perMatch[1]} a ${perMatch[2]}` : "—";

  const headerIdx = lines.findIndex((l) => l.indexOf("ID da transa") !== -1);
  if (headerIdx === -1) return { ok: false, tipo: "invalido" };

  const rows: LinhaCsv[] = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line || !line.trim()) continue;
    if (line.indexOf("Valor total") !== -1) break;
    const cols = parseCsvLine(line);
    if (cols.length < 5 || !cols[0] || !cols[1]) continue;
    const valor = parseValorBR(cols[3]);
    if (isNaN(valor)) continue;
    rows.push({ data: cols[0], id: cols[1], cartao: cols[2], valor });
  }

  if (rows.length === 0) return { ok: false, tipo: "vazio" };

  return { ok: true, contaId, periodo, rows };
}
