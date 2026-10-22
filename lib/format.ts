export const BRL = (n: number): string =>
  "R$ " + n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const SIMBOLO_MOEDA: Record<string, string> = { BRL: "R$", USD: "US$", EUR: "€" };

/** Formata um valor na moeda dele (BRL = "R$ 1,00", USD = "US$ 1,00"). */
export const fmtMoeda = (n: number, moeda: string = "BRL"): string =>
  (SIMBOLO_MOEDA[moeda] || moeda) + " " + n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Soma por moeda — nunca mistura reais com dólares. */
export const somarPorMoeda = (itens: { valor: number; moeda: string }[]): Record<string, number> => {
  const t: Record<string, number> = {};
  itens.forEach((i) => (t[i.moeda] = (t[i.moeda] || 0) + i.valor));
  return t;
};

export const fmtData = (d: Date): string =>
  String(d.getDate()).padStart(2, "0") + "/" + String(d.getMonth() + 1).padStart(2, "0") + "/" + d.getFullYear();

export const parseBR = (s: string): Date => {
  const [d, m, a] = s.split("/").map(Number);
  return new Date(a, m - 1, d);
};

export const mesmoDia = (a?: Date | null, b?: Date | null): boolean =>
  !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

/** Converte "3.431,26" (formato BR) em 3431.26 */
export const parseValorBR = (s: string): number => {
  const n = parseFloat(s.replace(/\./g, "").replace(",", "."));
  return isNaN(n) ? 0 : n;
};

/** "Visa" + "4400" -> "Visa ···· 4400" (mesmo formato do extrato da Meta). */
export const cartaoRotulo = (c: { bandeira: string; final4: string }): string =>
  `${c.bandeira} ···· ${c.final4}`;
