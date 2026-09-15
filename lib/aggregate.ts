import { Lancamento } from "./types";
import { parseBR } from "./format";

export function filtrarPorPeriodo(lancamentos: Lancamento[], inicio: Date, fim: Date): Lancamento[] {
  return lancamentos.filter((l) => {
    const d = parseBR(l.data);
    return d >= inicio && d <= fim;
  });
}

export function agruparPorCartao(lancamentos: Lancamento[]) {
  const mapa = new Map<string, { total: number; n: number; csv: number; manual: number }>();
  lancamentos.forEach((l) => {
    const atual = mapa.get(l.cartao) || { total: 0, n: 0, csv: 0, manual: 0 };
    atual.total += l.valor;
    atual.n += 1;
    if (l.origem === "csv") atual.csv += 1;
    else atual.manual += 1;
    mapa.set(l.cartao, atual);
  });
  return Array.from(mapa.entries())
    .map(([nome, v]) => ({ nome, ...v }))
    .sort((a, b) => b.total - a.total);
}

export function agruparPorConta(lancamentos: Lancamento[]) {
  const mapa = new Map<string, { total: number; plataforma: string; n: number }>();
  lancamentos.forEach((l) => {
    const atual = mapa.get(l.conta) || { total: 0, plataforma: l.plataforma, n: 0 };
    atual.total += l.valor;
    atual.n += 1;
    mapa.set(l.conta, atual);
  });
  return Array.from(mapa.entries())
    .map(([nome, v]) => ({ nome, ...v }))
    .sort((a, b) => b.total - a.total);
}

export function agruparPorPlataforma(lancamentos: Lancamento[]) {
  const mapa = new Map<string, number>();
  lancamentos.forEach((l) => mapa.set(l.plataforma, (mapa.get(l.plataforma) || 0) + l.valor));
  return mapa;
}

export type GrupoDia = {
  chave: string;
  data: string;
  conta: string;
  cartao: string;
  total: number;
  itens: Lancamento[];
};

export function agruparPorDiaContaCartao(lancamentos: Lancamento[]): GrupoDia[] {
  const mapa = new Map<string, GrupoDia>();
  lancamentos.forEach((l) => {
    const chave = `${l.data}__${l.conta}__${l.cartao}`;
    const atual = mapa.get(chave) || { chave, data: l.data, conta: l.conta, cartao: l.cartao, total: 0, itens: [] };
    atual.total += l.valor;
    atual.itens.push(l);
    mapa.set(chave, atual);
  });
  return Array.from(mapa.values()).sort((a, b) => +parseBR(b.data) - +parseBR(a.data));
}

export function agruparPorDia(lancamentos: Lancamento[]) {
  const mapa = new Map<string, { data: string; total: number; itens: Lancamento[] }>();
  lancamentos.forEach((l) => {
    const atual = mapa.get(l.data) || { data: l.data, total: 0, itens: [] };
    atual.total += l.valor;
    atual.itens.push(l);
    mapa.set(l.data, atual);
  });
  return Array.from(mapa.values()).sort((a, b) => +parseBR(b.data) - +parseBR(a.data));
}
