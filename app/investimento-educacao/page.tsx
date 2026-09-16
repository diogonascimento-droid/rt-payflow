"use client";

import { useEffect, useMemo, useState } from "react";
import { NavBar } from "@/components/NavBar";
import { HeroStat, KpiTile } from "@/components/tiles";
import { CurrencyInput } from "@/components/CurrencyInput";
import { CarregandoState, ErroState } from "@/components/AsyncState";
import { useAuth } from "@/lib/supabase/useAuth";
import { useEduUnidades, useEduMeses, useEduLancamentos } from "@/lib/supabase/hooks";
import { criarEduMes, salvarEduCelula } from "@/lib/supabase/queries";
import { EduLancamento } from "@/lib/types";

const MESES_SEQ = [
  "JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO",
  "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO",
];
const MES_ABREV: Record<string, string> = {
  JANEIRO: "Jan", FEVEREIRO: "Fev", MARÇO: "Mar", ABRIL: "Abr", MAIO: "Mai", JUNHO: "Jun",
  JULHO: "Jul", AGOSTO: "Ago", SETEMBRO: "Set", OUTUBRO: "Out", NOVEMBRO: "Nov", DEZEMBRO: "Dez",
};

const BRL = (n: number) => "R$ " + n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const NUM = (n: number) => n.toLocaleString("pt-BR");
const parseNumBR = (s: string) => parseFloat(s.replace(/\./g, "").replace(",", "."));

type NotaTipo = "invest" | "lead";
type ChaveNota = { unidadeId: string; tipo: NotaTipo; mesId: string };

function chaveParaString(c: ChaveNota) {
  return `${c.unidadeId}|${c.tipo}|${c.mesId}`;
}
function stringParaChave(s: string): ChaveNota {
  const [unidadeId, tipo, mesId] = s.split("|");
  return { unidadeId, tipo: tipo as NotaTipo, mesId };
}

/** Temporada = ciclo letivo de junho a fevereiro. Um mês de jan/fev pertence
 * à temporada que começou no junho anterior; de junho em diante, à que
 * começa nesse mesmo ano. */
function inicioTemporada(mes: { nome: string; ano: number }): number {
  const idx = MESES_SEQ.indexOf(mes.nome);
  return idx >= 5 ? mes.ano : mes.ano - 1;
}
function rotuloTemporada(inicio: number): string {
  return `${String(inicio).slice(-2)}/${String(inicio + 1).slice(-2)}`;
}

const TODOS_OS_MESES = "TODOS";
const TODAS_ASSOCIACOES = "TODAS";

export default function InvestimentoEducacaoPage() {
  const { isEditor } = useAuth();
  const { unidades, carregando: carregandoU, erro: erroU, recarregar: recarregarU } = useEduUnidades();
  const { meses, setMeses, carregando: carregandoM, erro: erroM, recarregar: recarregarM } = useEduMeses();
  const {
    eduLancamentos,
    setEduLancamentos,
    carregando: carregandoL,
    erro: erroL,
    recarregar: recarregarL,
  } = useEduLancamentos();

  const carregando = carregandoU || carregandoM || carregandoL;
  const erro = erroU || erroM || erroL;
  const recarregarTudo = () => {
    recarregarU();
    recarregarM();
    recarregarL();
  };

  const [temporadaSelecionada, setTemporadaSelecionada] = useState<number | null>(null);
  const [notaAberta, setNotaAberta] = useState<string | null>(null);
  const [notaEditTexto, setNotaEditTexto] = useState("");
  const [erroAcao, setErroAcao] = useState<string | null>(null);

  const temporadas = useMemo(
    () => Array.from(new Set(meses.map((m) => inicioTemporada(m)))).sort((a, b) => a - b),
    [meses]
  );

  useEffect(() => {
    if (meses.length === 0) return;
    if (temporadaSelecionada === null || !temporadas.includes(temporadaSelecionada)) {
      setTemporadaSelecionada(inicioTemporada(meses[meses.length - 1]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meses, temporadas]);

  const mesesDaTemporada = useMemo(
    () => meses.filter((m) => inicioTemporada(m) === temporadaSelecionada),
    [meses, temporadaSelecionada]
  );

  // Filtro de mês único, só pros cards de total do topo — não mexe na
  // temporada nem na tabela por associação.
  const [kpiMesId, setKpiMesId] = useState<string | null>(null);
  const [seletorMesAberto, setSeletorMesAberto] = useState(false);

  useEffect(() => {
    if (meses.length === 0) return;
    if (kpiMesId === null) {
      setKpiMesId(meses[meses.length - 1].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meses]);

  const mesDoFiltroKpi = kpiMesId === TODOS_OS_MESES ? null : meses.find((m) => m.id === kpiMesId) || null;
  const mesesDoFiltroKpi = useMemo(() => {
    if (kpiMesId === TODOS_OS_MESES) return meses;
    return mesDoFiltroKpi ? [mesDoFiltroKpi] : [];
  }, [meses, kpiMesId, mesDoFiltroKpi]);

  // Filtro de associação, também só pros cards de total do topo.
  const [kpiUnidadeId, setKpiUnidadeId] = useState<string>(TODAS_ASSOCIACOES);
  const [seletorUnidadeAberto, setSeletorUnidadeAberto] = useState(false);
  const unidadeDoFiltroKpi = kpiUnidadeId === TODAS_ASSOCIACOES ? null : unidades.find((u) => u.id === kpiUnidadeId) || null;

  const lookup = useMemo(() => {
    const mapa = new Map<string, EduLancamento>();
    eduLancamentos.forEach((l) => mapa.set(`${l.unidadeId}|${l.mesId}`, l));
    return mapa;
  }, [eduLancamentos]);

  function atualizarLocal(l: EduLancamento) {
    setEduLancamentos((ls) => {
      const idx = ls.findIndex((x) => x.unidadeId === l.unidadeId && x.mesId === l.mesId);
      if (idx === -1) return [...ls, l];
      const copia = ls.slice();
      copia[idx] = l;
      return copia;
    });
  }

  async function setInvestimento(unidadeId: string, mesId: string, valor: number | null) {
    try {
      const atualizado = await salvarEduCelula({ unidadeId, mesId, investimento: valor });
      atualizarLocal(atualizado);
    } catch (e) {
      setErroAcao((e as Error).message);
    }
  }

  async function setLeads(unidadeId: string, mesId: string, valor: number | null) {
    try {
      const atualizado = await salvarEduCelula({ unidadeId, mesId, leads: valor });
      atualizarLocal(atualizado);
    } catch (e) {
      setErroAcao((e as Error).message);
    }
  }

  function abrirNota(chave: ChaveNota, textoAtual: string | undefined) {
    const chaveStr = chaveParaString(chave);
    if (notaAberta === chaveStr) {
      setNotaAberta(null);
      setNotaEditTexto("");
      return;
    }
    setNotaAberta(chaveStr);
    setNotaEditTexto(textoAtual || "");
  }

  function fecharNota() {
    setNotaAberta(null);
    setNotaEditTexto("");
  }

  async function salvarNota(texto: string) {
    if (!notaAberta) return;
    const { unidadeId, tipo, mesId } = stringParaChave(notaAberta);
    try {
      const atualizado = await salvarEduCelula(
        tipo === "invest"
          ? { unidadeId, mesId, notaInvestimento: texto || null }
          : { unidadeId, mesId, notaLeads: texto || null }
      );
      atualizarLocal(atualizado);
      fecharNota();
    } catch (e) {
      setErroAcao((e as Error).message);
    }
  }

  async function adicionarMes() {
    if (meses.length === 0) return;
    const ultimo = meses[meses.length - 1];
    const idxAtual = MESES_SEQ.indexOf(ultimo.nome);
    const novoNome = MESES_SEQ[(idxAtual + 1) % 12];
    const novoAno = idxAtual === 11 ? ultimo.ano + 1 : ultimo.ano;
    try {
      const criado = await criarEduMes(novoNome, novoAno, ultimo.ordem + 1);
      setMeses((ms) => [...ms, criado]);
      setTemporadaSelecionada(inicioTemporada(criado));
    } catch (e) {
      setErroAcao((e as Error).message);
    }
  }

  const idsMesesDoFiltroKpi = useMemo(() => new Set(mesesDoFiltroKpi.map((m) => m.id)), [mesesDoFiltroKpi]);

  let totalInvest = 0;
  let totalLeads = 0;
  let gastoMeta = 0;
  let gastoGoogle = 0;
  eduLancamentos.forEach((l) => {
    if (!idsMesesDoFiltroKpi.has(l.mesId)) return;
    if (kpiUnidadeId !== TODAS_ASSOCIACOES && l.unidadeId !== kpiUnidadeId) return;
    totalInvest += l.investimento || 0;
    totalLeads += l.leads || 0;
    if (l.investimento) {
      const m = l.notaInvestimento?.match(/Meta R\$\s*([\d.,]+)/);
      const g = l.notaInvestimento?.match(/Google R\$\s*([\d.,]+)/);
      if (m || g) {
        // nota especifica a quebra — usa os valores dela.
        gastoMeta += m ? parseNumBR(m[1]) : 0;
        gastoGoogle += g ? parseNumBR(g[1]) : 0;
      } else {
        // sem nota (ou nota sem quebra Meta/Google reconhecível) = 100% Meta por padrão.
        gastoMeta += l.investimento;
      }
    }
  });

  const periodoLabel =
    mesesDaTemporada.length > 0
      ? `${MES_ABREV[mesesDaTemporada[0].nome]} ${mesesDaTemporada[0].ano} – ${MES_ABREV[mesesDaTemporada[mesesDaTemporada.length - 1].nome]} ${mesesDaTemporada[mesesDaTemporada.length - 1].ano}`
      : "—";

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />

      {erroAcao && (
        <div className="bg-danger-bg border-b border-danger-border text-danger text-[13px] py-2 px-7 flex items-center gap-3">
          {erroAcao}
          <button onClick={() => setErroAcao(null)} className="ml-auto bg-transparent border-none text-danger underline cursor-pointer">
            dispensar
          </button>
        </div>
      )}

      {carregando ? (
        <CarregandoState />
      ) : erro ? (
        <ErroState mensagem={erro} onRetry={recarregarTudo} />
      ) : (
        <>
        <div className="bg-ink text-text-on-dark">
          <div className="max-w-[1440px] mx-auto w-full px-7 pt-5 pb-6 flex flex-col gap-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="font-heading text-[20px] font-bold m-0">Investimento em Educação</h1>
                <p className="mt-1 mb-0 text-[13px] text-text-on-dark-muted">UCB · lançamento manual por associação, mês a mês</p>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-[11px] text-text-on-dark-muted whitespace-nowrap">{periodoLabel}</span>
                <div className="flex gap-1">
                  {temporadas.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTemporadaSelecionada(t)}
                      title="Filtrar a tabela por temporada (junho a fevereiro)"
                      className={
                        "font-mono text-[11.5px] font-semibold rounded-pill py-1.5 px-3.5 cursor-pointer border whitespace-nowrap " +
                        (t === temporadaSelecionada
                          ? "bg-lima-ui text-ink border-lima-ui"
                          : "bg-ink-2 text-text-on-dark-muted border-ink-3 hover:text-text-on-dark")
                      }
                    >
                      Temporada {rotuloTemporada(t)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-end gap-10 flex-wrap">
              <HeroStat label="Total investido" value={BRL(totalInvest)} />
              <KpiTile label="Total de leads" value={NUM(totalLeads)} />
              <KpiTile label="Custo médio por lead" value={totalLeads ? BRL(totalInvest / totalLeads) : "—"} />
              <KpiTile label="Gasto Meta" value={BRL(gastoMeta)} hint="apurado pelas notas" />
              <KpiTile label="Gasto Google" value={BRL(gastoGoogle)} hint="apurado pelas notas" />
            </div>

            <div className="flex items-center gap-2.5 flex-wrap pt-4 border-t border-ink-3">
              <span className="font-mono text-[10.5px] tracking-[0.08em] uppercase text-text-on-dark-muted whitespace-nowrap">
                Filtrar totais acima
              </span>

              <div className="relative">
                <button
                  onClick={() => {
                    setSeletorMesAberto((v) => !v);
                    setSeletorUnidadeAberto(false);
                  }}
                  className={
                    "flex items-center gap-1.5 font-mono text-[12px] py-1.5 px-3 rounded-pill border cursor-pointer whitespace-nowrap " +
                    (kpiMesId !== TODOS_OS_MESES ? "bg-lima-ui text-ink border-lima-ui" : "bg-ink-2 text-text-on-dark-muted border-ink-3 hover:text-text-on-dark")
                  }
                >
                  {kpiMesId === TODOS_OS_MESES
                    ? "Todos os meses"
                    : mesDoFiltroKpi
                    ? `${MES_ABREV[mesDoFiltroKpi.nome]} ${mesDoFiltroKpi.ano}`
                    : "—"}
                  <span className="text-[10px]">▾</span>
                </button>
                {seletorMesAberto && (
                  <>
                    <div onClick={() => setSeletorMesAberto(false)} className="fixed inset-0 z-[39]" />
                    <div className="absolute top-10 left-0 z-40 bg-surface border border-input-border rounded-card shadow-[0_16px_34px_rgba(16,18,16,0.35)] p-2.5 flex flex-wrap gap-1.5 w-[220px]">
                      <button
                        onClick={() => {
                          setKpiMesId(TODOS_OS_MESES);
                          setSeletorMesAberto(false);
                        }}
                        className={
                          "font-mono text-[12px] rounded-pill py-1 px-2.5 cursor-pointer border w-full " +
                          (kpiMesId === TODOS_OS_MESES
                            ? "bg-ink text-lima-ui border-ink"
                            : "bg-transparent text-text-muted border-input-border hover:bg-workspace")
                        }
                      >
                        Todos os meses
                      </button>
                      <div className="w-full border-t border-divider my-0.5" />
                      {meses.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => {
                            setKpiMesId(m.id);
                            setSeletorMesAberto(false);
                          }}
                          className={
                            "font-mono text-[12px] rounded-pill py-1 px-2.5 cursor-pointer border " +
                            (m.id === kpiMesId
                              ? "bg-ink text-lima-ui border-ink"
                              : "bg-transparent text-text-muted border-input-border hover:bg-workspace")
                          }
                        >
                          {MES_ABREV[m.nome]} {m.ano}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => {
                    setSeletorUnidadeAberto((v) => !v);
                    setSeletorMesAberto(false);
                  }}
                  className={
                    "flex items-center gap-1.5 font-mono text-[12px] py-1.5 px-3 rounded-pill border cursor-pointer whitespace-nowrap " +
                    (kpiUnidadeId !== TODAS_ASSOCIACOES ? "bg-lima-ui text-ink border-lima-ui" : "bg-ink-2 text-text-on-dark-muted border-ink-3 hover:text-text-on-dark")
                  }
                >
                  {unidadeDoFiltroKpi ? unidadeDoFiltroKpi.nome : "Todas as associações"}
                  <span className="text-[10px]">▾</span>
                </button>
                {seletorUnidadeAberto && (
                  <>
                    <div onClick={() => setSeletorUnidadeAberto(false)} className="fixed inset-0 z-[39]" />
                    <div className="absolute top-10 left-0 z-40 bg-surface border border-input-border rounded-card shadow-[0_16px_34px_rgba(16,18,16,0.35)] p-2.5 flex flex-wrap gap-1.5 w-[280px]">
                      <button
                        onClick={() => {
                          setKpiUnidadeId(TODAS_ASSOCIACOES);
                          setSeletorUnidadeAberto(false);
                        }}
                        className={
                          "font-mono text-[12px] rounded-pill py-1 px-2.5 cursor-pointer border w-full " +
                          (kpiUnidadeId === TODAS_ASSOCIACOES
                            ? "bg-ink text-lima-ui border-ink"
                            : "bg-transparent text-text-muted border-input-border hover:bg-workspace")
                        }
                      >
                        Todas as associações
                      </button>
                      <div className="w-full border-t border-divider my-0.5" />
                      {unidades.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => {
                            setKpiUnidadeId(u.id);
                            setSeletorUnidadeAberto(false);
                          }}
                          className={
                            "font-mono text-[12px] rounded-pill py-1 px-2.5 cursor-pointer border " +
                            (u.id === kpiUnidadeId
                              ? "bg-ink text-lima-ui border-ink"
                              : "bg-transparent text-text-muted border-input-border hover:bg-workspace")
                          }
                        >
                          {u.nome}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="px-7 pt-6 pb-[60px] max-w-[1440px] mx-auto w-full flex flex-col gap-5">

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <span className="text-[12px] text-text-faint-2">Clique no marcador • de qualquer valor para adicionar ou ver um comentário.</span>
              {isEditor && (
                <button
                  onClick={adicionarMes}
                  className="font-body text-[12.5px] bg-surface border border-input-border rounded-btn py-1.5 px-3.5 cursor-pointer whitespace-nowrap"
                >
                  + Adicionar mês
                </button>
              )}
            </div>

            <div className="flex flex-col gap-3.5">
              {unidades.map((u) => {
                const colunas = mesesDaTemporada.map((m) => lookup.get(`${u.id}|${m.id}`));
                const somaInvest = mesesDaTemporada.reduce((s, m) => s + (lookup.get(`${u.id}|${m.id}`)?.investimento || 0), 0);
                const somaLeads = mesesDaTemporada.reduce((s, m) => s + (lookup.get(`${u.id}|${m.id}`)?.leads || 0), 0);

                const notaAtivaChave = notaAberta && stringParaChave(notaAberta);
                const notaAtiva = notaAtivaChave && notaAtivaChave.unidadeId === u.id ? notaAtivaChave : null;
                const mesNotaAtiva = notaAtiva ? meses.find((m) => m.id === notaAtiva.mesId) : null;
                const lancNotaAtiva = notaAtiva ? lookup.get(`${u.id}|${notaAtiva.mesId}`) : null;
                const textoNotaAtiva = notaAtiva
                  ? notaAtiva.tipo === "invest"
                    ? lancNotaAtiva?.notaInvestimento
                    : lancNotaAtiva?.notaLeads
                  : null;

                return (
                  <div key={u.id} className="bg-surface border border-border rounded-card overflow-hidden flex flex-col">
                    <div className="py-3 px-4 border-b border-divider flex items-center justify-between">
                      <span className="font-heading text-[14.5px] font-bold">{u.nome}</span>
                      <span className="font-mono text-[11.5px] text-text-faint">{BRL(somaInvest)}</span>
                    </div>
                    <div className="px-1 pb-1">
                      <table className="border-collapse text-[12.5px]">
                        <thead>
                          <tr className="font-mono text-[9.5px] tracking-[0.06em] uppercase text-text-faint-2">
                            <th className="text-left font-normal py-2 pt-2 pb-1.5 px-2.5 min-w-[92px] sticky left-0 bg-surface z-[1] whitespace-nowrap" />
                            {mesesDaTemporada.map((m) => (
                              <th key={m.id} className="text-right font-normal py-2 pt-2 pb-1.5 px-2 whitespace-nowrap">
                                {MES_ABREV[m.nome]}
                              </th>
                            ))}
                            <th className="text-right font-normal py-2 pt-2 pb-1.5 pl-3 pr-2.5 border-l border-divider whitespace-nowrap sticky right-0 bg-surface z-[1]">
                              Total
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="py-1 px-2.5 text-text-muted text-[11.5px] sticky left-0 bg-surface z-[1]">Investimento</td>
                            {colunas.map((l, i) => {
                              const mes = mesesDaTemporada[i];
                              const temNota = !!l?.notaInvestimento;
                              return (
                                <td key={mes.id} className="py-1 px-1">
                                  <div className="flex items-center justify-end gap-1">
                                    {isEditor ? (
                                      <CurrencyInput
                                        centavos={Math.round((l?.investimento || 0) * 100)}
                                        onChange={(c) => setInvestimento(u.id, mes.id, c === 0 ? null : c / 100)}
                                        placeholder="—"
                                        className="w-[13ch] shrink-0 text-right font-mono text-[12.5px] py-1.5 px-1 border border-transparent rounded-sm bg-transparent text-text-body outline-none hover:bg-workspace hover:border-input-border focus:bg-surface focus:border-ink"
                                      />
                                    ) : (
                                      <span className="w-[13ch] shrink-0 text-right font-mono text-[12.5px] py-1.5 px-1 text-text-body whitespace-nowrap">
                                        {l?.investimento ? BRL(l.investimento) : "—"}
                                      </span>
                                    )}
                                    <button
                                      onClick={() => abrirNota({ unidadeId: u.id, tipo: "invest", mesId: mes.id }, l?.notaInvestimento)}
                                      title="Comentário"
                                      className="shrink-0 w-2.5 h-2.5 rounded-full p-0 cursor-pointer"
                                      style={{
                                        background: temNota ? "#EBCD00" : "transparent",
                                        border: `1px solid ${temNota ? "#EBCD00" : "#D3D7CE"}`,
                                      }}
                                    />
                                  </div>
                                </td>
                              );
                            })}
                            <td className="py-1 pl-2 pr-2.5 text-right font-mono font-semibold border-l border-divider whitespace-nowrap sticky right-0 bg-surface z-[1]">
                              {BRL(somaInvest)}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-1 px-2.5 text-text-muted text-[11.5px] sticky left-0 bg-surface z-[1]">Leads</td>
                            {colunas.map((l, i) => {
                              const mes = mesesDaTemporada[i];
                              const temNota = !!l?.notaLeads;
                              return (
                                <td key={mes.id} className="py-1 px-1">
                                  <div className="flex items-center justify-end gap-1">
                                    {isEditor ? (
                                      <input
                                        value={l?.leads ?? ""}
                                        onChange={(e) => {
                                          const digitos = e.target.value.replace(/\D/g, "");
                                          setLeads(u.id, mes.id, digitos ? parseInt(digitos, 10) : null);
                                        }}
                                        placeholder="—"
                                        inputMode="numeric"
                                        className="w-[6ch] shrink-0 text-right font-mono text-[12.5px] py-1.5 px-1 border border-transparent rounded-sm bg-transparent text-text-body outline-none hover:bg-workspace hover:border-input-border focus:bg-surface focus:border-ink"
                                      />
                                    ) : (
                                      <span className="w-[6ch] shrink-0 text-right font-mono text-[12.5px] py-1.5 px-1 text-text-body whitespace-nowrap">
                                        {l?.leads != null ? NUM(l.leads) : "—"}
                                      </span>
                                    )}
                                    <button
                                      onClick={() => abrirNota({ unidadeId: u.id, tipo: "lead", mesId: mes.id }, l?.notaLeads)}
                                      title="Comentário"
                                      className="shrink-0 w-2.5 h-2.5 rounded-full p-0 cursor-pointer"
                                      style={{
                                        background: temNota ? "#EBCD00" : "transparent",
                                        border: `1px solid ${temNota ? "#EBCD00" : "#D3D7CE"}`,
                                      }}
                                    />
                                  </div>
                                </td>
                              );
                            })}
                            <td className="py-1 pl-2 pr-2.5 text-right font-mono font-semibold border-l border-divider whitespace-nowrap sticky right-0 bg-surface z-[1]">
                              {NUM(somaLeads)}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-1 pb-2 px-2.5 text-text-faint-2 text-[11.5px] sticky left-0 bg-surface z-[1]">Custo / lead</td>
                            {colunas.map((l, i) => {
                              const mes = mesesDaTemporada[i];
                              const custo = l?.investimento && l?.leads ? l.investimento / l.leads : null;
                              return (
                                <td key={mes.id} className="py-1 px-2 pb-2 text-right font-mono text-[12px] text-text-faint-2 whitespace-nowrap">
                                  {custo ? BRL(custo) : "—"}
                                </td>
                              );
                            })}
                            <td className="py-1 pl-2 pr-2.5 pb-2 text-right font-mono text-[12px] text-text-faint font-semibold border-l border-divider whitespace-nowrap sticky right-0 bg-surface z-[1]">
                              {somaLeads ? BRL(somaInvest / somaLeads) : "—"}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {notaAtiva && mesNotaAtiva && (
                      <div className="mx-4 mb-3 bg-warning-bg border border-warning-border rounded-sm p-2.5 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10.5px] tracking-[0.06em] uppercase text-warning">
                            {MES_ABREV[mesNotaAtiva.nome]} · {notaAtiva.tipo === "invest" ? "Investimento" : "Leads"}
                          </span>
                          <button onClick={fecharNota} className="bg-transparent border-none text-warning cursor-pointer text-[13px] leading-none p-0">
                            ✕
                          </button>
                        </div>
                        {isEditor ? (
                          <>
                            <textarea
                              rows={2}
                              value={notaEditTexto}
                              onChange={(e) => setNotaEditTexto(e.target.value)}
                              placeholder="Escreva um comentário para este valor…"
                              className="font-body text-[12.5px] text-text-body bg-[#FFFDF3] border border-warning-border rounded-sm py-2 px-2.5 outline-none resize-none"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => salvarNota(notaEditTexto)}
                                className="font-body text-[12px] font-bold bg-ink text-lima-ui border-none rounded-sm py-1.5 px-3 cursor-pointer"
                              >
                                Salvar
                              </button>
                              {textoNotaAtiva && (
                                <button
                                  onClick={() => salvarNota("")}
                                  className="font-body text-[12px] bg-transparent border-none text-danger underline cursor-pointer"
                                >
                                  Remover
                                </button>
                              )}
                            </div>
                          </>
                        ) : (
                          <p className="m-0 text-[12.5px] text-text-body leading-relaxed whitespace-pre-wrap">
                            {textoNotaAtiva || "Sem comentário."}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        </>
      )}
    </div>
  );
}
