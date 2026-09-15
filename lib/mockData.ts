import { Lancamento, LoteImportacao, ContaCadastro, CartaoCadastro, PlataformaCadastro } from "./types";
import { fmtData } from "./format";

/** "Hoje" fixo para manter os dados mockados determinísticos entre servidor e cliente. */
export const HOJE = new Date(2026, 8, 14); // 14/09/2026

// Mulberry32 — PRNG determinístico (mesma sequência sempre, sem Math.random()).
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260914);

export const PLATAFORMAS: PlataformaCadastro[] = [
  { id: "pf1", nome: "Meta", ativa: true },
  { id: "pf2", nome: "Google", ativa: true },
  { id: "pf3", nome: "TikTok", ativa: true },
  { id: "pf4", nome: "LinkedIn", ativa: true },
];

export const CARTOES: CartaoCadastro[] = [
  { id: "k1", bandeira: "Visa", final4: "4400", apelido: "Cartão principal · mídia", fechamento: 5, vencimento: 12, ativa: true, qtdLancamentos: 0 },
  { id: "k2", bandeira: "Visa", final4: "0158", apelido: "Cartão mídia 2", fechamento: 5, vencimento: 12, ativa: true, qtdLancamentos: 0 },
  { id: "k3", bandeira: "Visa", final4: "3640", apelido: "Cartão mídia 3", fechamento: 10, vencimento: 17, ativa: true, qtdLancamentos: 0 },
  { id: "k4", bandeira: "MasterCard", final4: "7712", apelido: "Cartão reserva mídia", fechamento: 10, vencimento: 17, ativa: true, qtdLancamentos: 0 },
  { id: "k5", bandeira: "Visa", final4: "9021", apelido: "Cartão contas Google", fechamento: 1, vencimento: 8, ativa: true, qtdLancamentos: 0 },
  { id: "k6", bandeira: "Amex", final4: "1004", apelido: "Cartão contas pequenas", fechamento: 20, vencimento: 27, ativa: true, qtdLancamentos: 0 },
  { id: "k7", bandeira: "Visa", final4: "5573", apelido: "Cartão do Bruno", fechamento: 15, vencimento: 22, ativa: true, qtdLancamentos: 0 },
  { id: "k8", bandeira: "MasterCard", final4: "2288", apelido: "Cartão TikTok/LinkedIn", fechamento: 8, vencimento: 15, ativa: true, qtdLancamentos: 0 },
];

export const CONTAS: ContaCadastro[] = [
  { id: "c1", nome: "RT Mídia 01", plataforma: "Meta", cliente: "Vários clientes (conta agrupada)", idConta: "100000000000001", ativa: true, qtdLancamentos: 0 },
  { id: "c2", nome: "RT Mídia 02", plataforma: "Meta", cliente: "Vários clientes (conta agrupada)", idConta: "100000000000002", ativa: true, qtdLancamentos: 0 },
  { id: "c3", nome: "RT Mídia 03", plataforma: "Meta", cliente: "Vários clientes (conta agrupada)", idConta: "100000000000003", ativa: true, qtdLancamentos: 0 },
  { id: "c4", nome: "Clínica Vetor", plataforma: "Google", cliente: "Clínica Vetor Odontologia", idConta: "743-201-9915", ativa: true, qtdLancamentos: 0 },
  { id: "c5", nome: "Studio Ferraz", plataforma: "Google", cliente: "Studio Ferraz Fotografia", idConta: "812-440-2207", ativa: true, qtdLancamentos: 0 },
  { id: "c6", nome: "Bosque Imóveis", plataforma: "Google", cliente: "Bosque Imóveis Ltda", idConta: "556-903-1188", ativa: true, qtdLancamentos: 0 },
  { id: "c7", nome: "Nova Rede Odonto", plataforma: "Google", cliente: "Nova Rede Odontologia", idConta: "298-771-4402", ativa: true, qtdLancamentos: 0 },
  { id: "c8", nome: "Café Lumen", plataforma: "Google", cliente: "Café Lumen", idConta: "667-120-9834", ativa: true, qtdLancamentos: 0 },
  { id: "c9", nome: "Verde Cozinha", plataforma: "Google", cliente: "Verde Cozinha Saudável", idConta: "183-660-4429", ativa: true, qtdLancamentos: 0 },
  { id: "c10", nome: "RT TikTok Ads", plataforma: "TikTok", cliente: "Vários clientes (conta agrupada)", idConta: "77021093458812", ativa: true, qtdLancamentos: 0 },
  { id: "c11", nome: "Órion Consultoria", plataforma: "LinkedIn", cliente: "Órion Consultoria Empresarial", idConta: "509887221", ativa: true, qtdLancamentos: 0 },
];

const META_CONTA_CARTAO: Record<string, string[]> = {
  "RT Mídia 01": ["Visa ···· 4400", "MasterCard ···· 7712"],
  "RT Mídia 02": ["Visa ···· 0158", "MasterCard ···· 7712"],
  "RT Mídia 03": ["Visa ···· 3640"],
};

const cartaoRotulo = (c: CartaoCadastro) => `${c.bandeira === "MasterCard" ? "MasterCard" : c.bandeira} ···· ${c.final4}`;

function gerarId(prefixo: string, i: number) {
  return `${prefixo}${i.toString(36)}${Math.floor(rand() * 1e6).toString(36)}`;
}

function gerarLancamentos(): Lancamento[] {
  const out: Lancamento[] = [];
  const inicio = new Date(2026, 6, 1); // 01/07/2026
  const fim = HOJE;

  for (let d = new Date(inicio); d <= fim; d.setDate(d.getDate() + 1)) {
    const data = fmtData(d);

    // Meta: cada conta cobra ~1-2x por dia, valor entre 2900 e 3500
    ["RT Mídia 01", "RT Mídia 02", "RT Mídia 03"].forEach((conta) => {
      const cartoes = META_CONTA_CARTAO[conta];
      const n = rand() < 0.35 ? 2 : 1;
      for (let k = 0; k < n; k++) {
        const cartao = cartoes[Math.floor(rand() * cartoes.length)];
        const valor = Math.round((2900 + rand() * 600) * 100) / 100;
        out.push({
          id: gerarId("l", out.length),
          data,
          plataforma: "Meta",
          conta,
          cartao,
          valor,
          origem: "csv",
          obs: rand() < 0.02 ? "#InvestimentoRT" : undefined,
          idTransacaoExterna: `${Math.floor(rand() * 1e17)}-${Math.floor(rand() * 1e17)}`,
        });
      }
    });

    // Google: lançamento manual esporádico por conta (poucas vezes por mês)
    ["Clínica Vetor", "Studio Ferraz", "Bosque Imóveis", "Nova Rede Odonto", "Café Lumen", "Verde Cozinha"].forEach(
      (conta) => {
        if (rand() < 0.06) {
          const cartao = conta === "Café Lumen" || conta === "Verde Cozinha" ? "Visa ···· 5573" : conta === "Bosque Imóveis" || conta === "Nova Rede Odonto" ? "Amex ···· 1004" : "Visa ···· 9021";
          const valor = Math.round((900 + rand() * 4200) * 100) / 100;
          out.push({
            id: gerarId("l", out.length),
            data,
            plataforma: "Google",
            conta,
            cartao,
            valor,
            origem: "manual",
            obs: rand() < 0.3 ? "Fatura mensal Google Ads" : undefined,
          });
        }
      }
    );

    // TikTok / LinkedIn: bem raro
    if (rand() < 0.015) {
      out.push({
        id: gerarId("l", out.length),
        data,
        plataforma: "TikTok",
        conta: "RT TikTok Ads",
        cartao: "MasterCard ···· 2288",
        valor: Math.round((400 + rand() * 2200) * 100) / 100,
        origem: "manual",
      });
    }
    if (rand() < 0.008) {
      out.push({
        id: gerarId("l", out.length),
        data,
        plataforma: "LinkedIn",
        conta: "Órion Consultoria",
        cartao: "Amex ···· 1004",
        valor: Math.round((300 + rand() * 900) * 100) / 100,
        origem: "manual",
      });
    }
  }

  return out.sort((a, b) => +(a.data.split("/").reverse().join("")) - +(b.data.split("/").reverse().join("")));
}

export const LANCAMENTOS: Lancamento[] = gerarLancamentos();

// Preenche contagem de lançamentos nos cadastros a partir dos dados gerados.
(function preencherContagens() {
  const porConta = new Map<string, number>();
  const porCartao = new Map<string, number>();
  LANCAMENTOS.forEach((l) => {
    porConta.set(l.conta, (porConta.get(l.conta) || 0) + 1);
    porCartao.set(l.cartao, (porCartao.get(l.cartao) || 0) + 1);
  });
  CONTAS.forEach((c) => (c.qtdLancamentos = porConta.get(c.nome) || 0));
  CARTOES.forEach((c) => (c.qtdLancamentos = porCartao.get(cartaoRotulo(c)) || 0));
})();

export const LOTES_IMPORTACAO: LoteImportacao[] = [
  {
    id: "lote1",
    arquivoNome: "faturamento_meta_rt01_08-2026.csv",
    plataforma: "Meta",
    conta: "RT Mídia 01",
    contaId: "100000000000001",
    periodoLabel: "01/08/2026 a 01/09/2026",
    criadoEm: "02/09/2026 09:14",
    totalLinhas: 46,
    totalImportado: 46,
    totalDuplicado: 0,
    valorImportado: 148200.32,
  },
  {
    id: "lote2",
    arquivoNome: "faturamento_meta_rt02_08-2026.csv",
    plataforma: "Meta",
    conta: "RT Mídia 02",
    contaId: "100000000000002",
    periodoLabel: "01/08/2026 a 01/09/2026",
    criadoEm: "02/09/2026 09:16",
    totalLinhas: 38,
    totalImportado: 38,
    totalDuplicado: 0,
    valorImportado: 121880.44,
  },
  {
    id: "lote3",
    arquivoNome: "faturamento_meta_rt03_08-2026.csv",
    plataforma: "Meta",
    conta: "RT Mídia 03",
    contaId: "100000000000003",
    periodoLabel: "01/08/2026 a 01/09/2026",
    criadoEm: "02/09/2026 09:17",
    totalLinhas: 31,
    totalImportado: 29,
    totalDuplicado: 2,
    valorImportado: 96311.2,
  },
];

export const CONTAS_META_POR_ID: Record<string, string> = Object.fromEntries(
  CONTAS.filter((c) => c.plataforma === "Meta").map((c) => [c.idConta, c.nome])
);

export const CARTAO_NOMES: string[] = CARTOES.map(cartaoRotulo);

export function contasPorPlataforma(plataforma?: string): string[] {
  return CONTAS.filter((c) => (plataforma ? c.plataforma === plataforma : true)).map((c) => c.nome);
}

export const CONTAS_POR_PLATAFORMA: Record<string, string[]> = Object.fromEntries(
  PLATAFORMAS.map((p) => [p.nome, contasPorPlataforma(p.nome)])
);

export { cartaoRotulo };
