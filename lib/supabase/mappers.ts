import { Lancamento, LoteImportacao, ContaCadastro, CartaoCadastro, PlataformaCadastro, EduUnidade, EduMes, EduLancamento } from "@/lib/types";
import { fmtData } from "@/lib/format";

/** Converte "2026-01-25" (formato do Postgres) para "25/01/2026" (formato usado no app). */
export function isoParaBR(iso: string): string {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

/** Converte "25/01/2026" para "2026-01-25". */
export function brParaIso(br: string): string {
  const [dia, mes, ano] = br.split("/");
  return `${ano}-${mes}-${dia}`;
}

export type LancamentoRow = {
  id: string;
  data: string;
  plataforma: string;
  conta: string;
  cartao: string;
  valor: number;
  origem: "manual" | "csv";
  obs: string | null;
  id_transacao_externa: string | null;
  lote_id: string | null;
};

export function rowToLancamento(r: LancamentoRow): Lancamento {
  return {
    id: r.id,
    data: isoParaBR(r.data),
    plataforma: r.plataforma,
    conta: r.conta,
    cartao: r.cartao,
    valor: Number(r.valor),
    origem: r.origem,
    obs: r.obs ?? undefined,
    idTransacaoExterna: r.id_transacao_externa ?? undefined,
    loteId: r.lote_id ?? undefined,
  };
}

export type ContaRow = {
  id: string;
  nome: string;
  plataforma: string;
  cliente: string;
  id_conta: string;
  ativa: boolean;
};

export function rowToConta(r: ContaRow, qtdLancamentos = 0): ContaCadastro {
  return {
    id: r.id,
    nome: r.nome,
    plataforma: r.plataforma,
    cliente: r.cliente,
    idConta: r.id_conta,
    ativa: r.ativa,
    qtdLancamentos,
  };
}

export type CartaoRow = {
  id: string;
  bandeira: string;
  final4: string;
  apelido: string;
  fechamento: number | null;
  vencimento: number | null;
  ativa: boolean;
};

export function rowToCartao(r: CartaoRow, qtdLancamentos = 0): CartaoCadastro {
  return {
    id: r.id,
    bandeira: r.bandeira,
    final4: r.final4,
    apelido: r.apelido,
    fechamento: r.fechamento ?? undefined,
    vencimento: r.vencimento ?? undefined,
    ativa: r.ativa,
    qtdLancamentos,
  };
}

export type PlataformaRow = { id: string; nome: string; ativa: boolean };

export function rowToPlataforma(r: PlataformaRow): PlataformaCadastro {
  return { id: r.id, nome: r.nome, ativa: r.ativa };
}

export type LoteRow = {
  id: string;
  arquivo_nome: string;
  plataforma: string;
  conta: string;
  conta_id: string;
  periodo_label: string;
  criado_em: string;
  total_linhas: number;
  total_importado: number;
  total_duplicado: number;
  valor_importado: number;
  desfeito: boolean;
};

export type EduUnidadeRow = { id: string; nome: string; ordem: number; ativa: boolean };

export function rowToEduUnidade(r: EduUnidadeRow): EduUnidade {
  return { id: r.id, nome: r.nome, ordem: r.ordem, ativa: r.ativa };
}

export type EduMesRow = { id: string; nome: string; ano: number; ordem: number };

export function rowToEduMes(r: EduMesRow): EduMes {
  return { id: r.id, nome: r.nome, ano: r.ano, ordem: r.ordem };
}

export type EduLancamentoRow = {
  id: string;
  unidade_id: string;
  mes_id: string;
  investimento: number | null;
  leads: number | null;
  nota_investimento: string | null;
  nota_leads: string | null;
};

export function rowToEduLancamento(r: EduLancamentoRow): EduLancamento {
  return {
    id: r.id,
    unidadeId: r.unidade_id,
    mesId: r.mes_id,
    investimento: r.investimento === null ? null : Number(r.investimento),
    leads: r.leads,
    notaInvestimento: r.nota_investimento ?? undefined,
    notaLeads: r.nota_leads ?? undefined,
  };
}

export function rowToLote(r: LoteRow): LoteImportacao {
  const d = new Date(r.criado_em);
  return {
    id: r.id,
    arquivoNome: r.arquivo_nome,
    plataforma: r.plataforma,
    conta: r.conta,
    contaId: r.conta_id,
    periodoLabel: r.periodo_label,
    criadoEm: `${fmtData(d)} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
    totalLinhas: r.total_linhas,
    totalImportado: r.total_importado,
    totalDuplicado: r.total_duplicado,
    valorImportado: Number(r.valor_importado),
    desfeito: r.desfeito,
  };
}
