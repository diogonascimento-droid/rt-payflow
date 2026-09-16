export type Origem = "manual" | "csv";

export type Lancamento = {
  id: string;
  data: string; // dd/mm/aaaa
  plataforma: string;
  conta: string;
  cartao: string;
  valor: number; // reais
  origem: Origem;
  obs?: string;
  idTransacaoExterna?: string;
  loteId?: string;
};

export type LoteImportacao = {
  id: string;
  arquivoNome: string;
  plataforma: string;
  conta: string;
  contaId: string;
  periodoLabel: string;
  criadoEm: string; // dd/mm/aaaa HH:mm
  totalLinhas: number;
  totalImportado: number;
  totalDuplicado: number;
  valorImportado: number;
  desfeito?: boolean;
};

export type ContaCadastro = {
  id: string;
  nome: string;
  plataforma: string;
  cliente: string;
  idConta: string;
  ativa: boolean;
  qtdLancamentos: number;
};

export type CartaoCadastro = {
  id: string;
  bandeira: string;
  final4: string;
  apelido: string;
  fechamento?: number;
  vencimento?: number;
  ativa: boolean;
  qtdLancamentos: number;
};

export type PlataformaCadastro = {
  id: string;
  nome: string;
  ativa: boolean;
};

export type EduUnidade = {
  id: string;
  nome: string;
  ordem: number;
  ativa: boolean;
};

export type EduMes = {
  id: string;
  nome: string; // "JUNHO", "JULHO", ...
  ano: number;
  ordem: number;
};

export type EduLancamento = {
  id: string;
  unidadeId: string;
  mesId: string;
  investimento: number | null;
  leads: number | null;
  notaInvestimento?: string;
  notaLeads?: string;
};
