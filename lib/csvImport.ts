export type LinhaCsv = { data: string; id: string; cartao: string; valor: number };

export type ResultadoCsv =
  | { ok: true; contaId: string; periodo: string; rows: LinhaCsv[]; linhasIgnoradas: number }
  | { ok: false; tipo: "invalido" | "vazio" | "conta_desconhecida"; contaId?: string; periodo?: string; rows?: LinhaCsv[] };

/** O relatório do Meta também traz formas de pagamento que não são cartão
 * (saldo de cupom/crédito de anúncio, não cobrança real no cartão). O RT
 * PayFlow só controla cartão, então essas linhas são ignoradas na
 * importação — mas só essa forma específica; qualquer outra coisa (mesmo
 * "N/D", quando o Meta não identifica o cartão de uma cobrança real) segue
 * pro fluxo normal de "cartão não cadastrado" pra não sumir dinheiro. */
const FORMAS_IGNORADAS = new Set(["crédito para anúncio", "credito para anuncio"]);
function formaIgnorada(formaPagamento: string): boolean {
  return FORMAS_IGNORADAS.has(formaPagamento.trim().toLowerCase());
}

/** O Meta às vezes exporta a "Forma de pagamento" com espaço sem quebra
 * (NBSP,  ) em vez de espaço normal ao redor dos "····" — visualmente
 * idêntico, mas quebra qualquer comparação exata de string (ex.: o filtro
 * de cartão, que compara com o rótulo gerado no cadastro usando espaço
 * normal). Normaliza pra nunca gravar esse tipo de caractere invisível. */
function normalizarEspacos(s: string): string {
  return s.replace(/[  -​  　]/g, " ").replace(/\s+/g, " ").trim();
}

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

  // O Meta varia o formato da tabela: quando um período tem várias formas de
  // pagamento misturadas, a coluna "Forma de pagamento" vem em cada linha
  // (Data,ID da transação,Forma de pagamento,Valor,Moeda). Quando o período
  // inteiro usa uma única forma de pagamento (ou quando há mais de uma —
  // ex.: cartão + "Crédito para anúncio" — cada uma vira o seu próprio
  // bloco), a coluna some da tabela e aparece antes, numa linha própria
  // ("Forma de pagamento: Visa ···· 4400"), podendo se repetir várias vezes
  // no mesmo arquivo — um bloco por forma de pagamento.
  const rows: LinhaCsv[] = [];
  let formaAtual = "";
  let dentroTabela = false;
  let colFormaIdx = -1;
  let colValorIdx = -1;
  let encontrouTabela = false;
  let linhasIgnoradas = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line || !line.trim()) continue;

    const formaMatch = line.match(/^Forma de pagamento:\s*(.+)$/i);
    if (formaMatch) {
      formaAtual = normalizarEspacos(formaMatch[1]);
      dentroTabela = false;
      continue;
    }

    if (line.indexOf("ID da transa") !== -1) {
      // As colunas mudam de posição entre exportações do Meta (às vezes tem
      // uma "Descrição da transação" no meio, às vezes não), então a posição
      // de cada uma é sempre lida do cabeçalho, nunca fixa por índice.
      const cabecalho = parseCsvLine(line).map((c) => c.trim().toLowerCase());
      colFormaIdx = cabecalho.findIndex((c) => c.startsWith("forma de pagamento"));
      colValorIdx = cabecalho.findIndex((c) => c === "valor");
      dentroTabela = true;
      encontrouTabela = true;
      continue;
    }

    if (!dentroTabela) continue;

    if (line.indexOf("Valor total") !== -1) {
      dentroTabela = false;
      continue;
    }

    const cols = parseCsvLine(line);
    if (!cols[0] || !cols[1] || colValorIdx === -1) continue;
    const valor = parseValorBR(cols[colValorIdx]);
    if (isNaN(valor)) continue;
    const cartao = normalizarEspacos(colFormaIdx !== -1 ? cols[colFormaIdx] : formaAtual);
    if (formaIgnorada(cartao)) {
      linhasIgnoradas++;
      continue;
    }
    rows.push({ data: cols[0], id: cols[1], cartao, valor });
  }

  if (!encontrouTabela) return { ok: false, tipo: "invalido" };
  if (rows.length === 0) return { ok: false, tipo: "vazio" };

  return { ok: true, contaId, periodo, rows, linhasIgnoradas };
}
