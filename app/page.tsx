"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { NavBar } from "@/components/NavBar";
import { PeriodPicker } from "@/components/PeriodPicker";
import { KpiTile, HeroStat, CardTile } from "@/components/tiles";
import { usePeriod } from "@/lib/usePeriod";
import { useLancamentos } from "@/lib/supabase/hooks";
import { useAuth } from "@/lib/supabase/useAuth";
import { CarregandoState, ErroState } from "@/components/AsyncState";
import { filtrarPorPeriodo, agruparPorCartao, agruparPorConta, agruparPorDiaContaCartao } from "@/lib/aggregate";
import { BRL, fmtData } from "@/lib/format";

export default function VisaoGeralPage() {
  const { isEditor } = useAuth();
  const { lancamentos, carregando, erro, recarregar } = useLancamentos();
  const period = usePeriod(undefined, useMemo(() => lancamentos.map((l) => l.data), [lancamentos]));
  const [filtroCartao, setFiltroCartao] = useState<string | null>(null);
  const [buscaGrupos, setBuscaGrupos] = useState("");
  const [abertos, setAbertos] = useState<Record<string, boolean>>({});

  const doPeriodo = useMemo(
    () => filtrarPorPeriodo(lancamentos, period.periodoInicio, period.periodoFim),
    [lancamentos, period.periodoInicio, period.periodoFim]
  );

  const filtrados = useMemo(
    () => (filtroCartao ? doPeriodo.filter((l) => l.cartao === filtroCartao) : doPeriodo),
    [doPeriodo, filtroCartao]
  );

  const cartoes = useMemo(() => agruparPorCartao(doPeriodo), [doPeriodo]);
  const maiorCartao = Math.max(1, ...cartoes.map((c) => c.total));
  const contas = useMemo(() => agruparPorConta(filtrados), [filtrados]);
  const totalContas = contas.reduce((s, c) => s + c.total, 0);

  const totalGeral = filtrados.reduce((s, l) => s + l.valor, 0);
  const nLanc = filtrados.length;
  const csv = filtrados.filter((l) => l.origem === "csv").length;
  const manual = nLanc - csv;
  const totalMeta = filtrados.filter((l) => l.plataforma === "Meta").reduce((s, l) => s + l.valor, 0);
  const totalGoogle = filtrados.filter((l) => l.plataforma === "Google").reduce((s, l) => s + l.valor, 0);
  const semConta = doPeriodo.filter((l) => !l.conta).length;

  const grupos = useMemo(() => {
    const base = agruparPorDiaContaCartao(filtrados);
    const busca = buscaGrupos.toLowerCase();
    return base.filter((g) => !busca || (g.conta + " " + g.cartao).toLowerCase().includes(busca));
  }, [filtrados, buscaGrupos]);

  const estaVazio = doPeriodo.length === 0;

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar
        right={
          <>
            <PeriodPicker period={period} variant="dark" align="right" />
            <Link
              href="/relatorio"
              className="font-body text-[13px] bg-transparent text-text-on-dark border border-[#3A413C] rounded-btn py-2 px-3.5 no-underline whitespace-nowrap"
            >
              Exportar PDF
            </Link>
            {isEditor && (
              <Link
                href="/novo-lancamento"
                className="font-body text-[13px] font-bold bg-lima-ui text-ink rounded-btn py-2 px-4 no-underline whitespace-nowrap"
              >
                + Lançamento
              </Link>
            )}
          </>
        }
      />

      {carregando ? (
        <CarregandoState />
      ) : erro ? (
        <ErroState mensagem={erro} onRetry={recarregar} />
      ) : (
        <>
      <div className="bg-ink text-text-on-dark flex flex-col gap-[18px] px-7 pb-[22px] pt-1">
        <div className="flex items-end gap-10 flex-wrap pt-3">
          <HeroStat label={filtroCartao ? "Total no cartão selecionado" : "Total do período"} value={BRL(totalGeral)} />
          <KpiTile label="Lançamentos" value={String(nLanc)} hint={`${csv} CSV · ${manual} manuais`} />
          <KpiTile label="Total Meta" value={BRL(totalMeta)} />
          <KpiTile label="Total Google" value={BRL(totalGoogle)} />
          {semConta > 0 && !filtroCartao && (
            <div className="ml-auto flex items-center gap-2.5 bg-[#2A1D18] border border-[#4A2C22] text-[#F0A58F] rounded-sm py-2 px-3.5 text-[12.5px] whitespace-nowrap">
              {semConta} lançamento(s) sem conta vinculada
            </div>
          )}
        </div>
        <div className="text-[12px] text-text-on-dark-muted">
          {fmtData(period.periodoInicio)} a {fmtData(period.periodoFim)}
        </div>
      </div>

      {filtroCartao && (
        <div className="bg-divider border-b border-[#DFE2DC] py-2.5 px-7 flex items-center gap-3 text-[13px]">
          <span className="font-mono text-[11px] tracking-[0.1em] uppercase text-text-faint">Filtrado por cartão</span>
          <span className="font-mono text-[13px] bg-surface border border-input-border rounded-pill py-1 px-3">{filtroCartao}</span>
          <button onClick={() => setFiltroCartao(null)} className="font-body text-[12.5px] bg-transparent border-none text-text-muted underline cursor-pointer">
            limpar
          </button>
        </div>
      )}

      {estaVazio ? (
        <div className="flex-1 flex items-center justify-center py-20 px-7">
          <div className="max-w-[440px] text-center flex flex-col items-center gap-3.5">
            <div className="w-10 h-[3px] bg-lima-ui rounded-[2px]" />
            <h2 className="font-heading text-[20px] font-bold m-0">Nenhum lançamento entre {period.rotulo}</h2>
            <p className="m-0 text-[14px] leading-relaxed text-text-muted">
              {isEditor
                ? "Amplie o período ou registre a primeira cobrança. A importação do CSV da Meta lança o mês inteiro de uma vez."
                : "Amplie o período pra ver lançamentos de outras datas."}
            </p>
            {isEditor && (
              <div className="flex gap-2.5 mt-1">
                <Link href="/novo-lancamento" className="font-body text-[13px] font-bold bg-lima-ui text-ink rounded-btn py-2.5 px-[18px] no-underline">
                  + Lançamento
                </Link>
                <Link href="/importar-csv" className="font-body text-[13px] bg-surface border border-input-border rounded-btn py-2.5 px-[18px] no-underline">
                  Importar CSV da Meta
                </Link>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-7 pb-10 grid grid-cols-1 lg:grid-cols-[1.25fr_1fr] gap-7 items-start">
          <section className="flex flex-col gap-3 min-w-0">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-heading text-[15px] font-bold m-0">Fechamento por cartão</h2>
              <span className="font-mono text-[11.5px] text-text-faint">soma do período · clique para filtrar</span>
            </div>
            <div className="grid gap-2.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
              {cartoes.map((c) => (
                <CardTile
                  key={c.nome}
                  nome={c.nome}
                  n={c.n}
                  total={BRL(c.total)}
                  pct={Math.round((c.total / maiorCartao) * 100)}
                  ativo={filtroCartao === c.nome}
                  onClick={() => setFiltroCartao((f) => (f === c.nome ? null : c.nome))}
                />
              ))}
            </div>

            <div className="mt-3 flex items-baseline justify-between gap-3">
              <h2 className="font-heading text-[15px] font-bold m-0">Lançamentos agrupados</h2>
              <span className="font-mono text-[11.5px] text-text-faint">dia · conta · cartão</span>
            </div>
            <input
              value={buscaGrupos}
              onChange={(e) => setBuscaGrupos(e.target.value)}
              placeholder="Buscar por conta ou cartão…"
              className="text-[13px] py-2.5 px-2.5 border border-input-border rounded-sm bg-surface box-border"
            />
            <div className="bg-surface border border-border rounded-sm overflow-hidden">
              {grupos.slice(0, 40).map((g) => {
                const aberto = !!abertos[g.chave];
                return (
                  <div key={g.chave} className="border-b border-divider last:border-b-0">
                    <button
                      onClick={() => setAbertos((s) => ({ ...s, [g.chave]: !s[g.chave] }))}
                      className="w-full text-left bg-transparent border-none flex items-center gap-3 py-3 px-3.5 cursor-pointer hover:bg-[#FAFBF8]"
                    >
                      <span className="font-mono text-[12.5px] text-text-faint tabular-nums w-[84px] shrink-0">{g.data}</span>
                      <span className="text-[13.5px] flex-1 min-w-0 truncate">{g.conta}</span>
                      <span className="font-mono text-[12px] text-text-faint whitespace-nowrap shrink-0">{g.cartao}</span>
                      <span className="text-[11.5px] bg-[#EFF1EC] rounded-pill py-0.5 px-2.5 text-text-muted whitespace-nowrap shrink-0">
                        {g.itens.length}
                      </span>
                      <span className="font-mono text-[14px] font-medium tabular-nums w-[112px] shrink-0 text-right whitespace-nowrap">
                        {BRL(g.total)}
                      </span>
                      <span className="text-text-faint text-[12px] w-3.5 shrink-0 text-right">{aberto ? "▴" : "▾"}</span>
                    </button>
                    {aberto && (
                      <div className="bg-[#FAFBF8] border-t border-divider py-1 pr-3.5 pl-[111px] pb-2">
                        {g.itens.map((i) => (
                          <div key={i.id} className="flex items-center gap-3 py-2 border-b border-[#EFF1EC] last:border-b-0">
                            <span className="font-mono text-[11.5px] text-text-faint-2 flex-1 min-w-0 truncate">
                              {i.idTransacaoExterna || i.obs || "Lançamento manual"}
                            </span>
                            <span className="text-[11.5px] text-text-faint whitespace-nowrap shrink-0">
                              {i.origem === "csv" ? "CSV Meta" : "Manual"}
                            </span>
                            <span className="font-mono text-[13px] tabular-nums w-[112px] shrink-0 text-right">{BRL(i.valor)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              <Link href="/lancamentos" className="block py-3 px-3.5 text-[13px] no-underline">
                Ver todos os {nLanc} lançamentos →
              </Link>
            </div>
          </section>

          <section className="flex flex-col gap-3 min-w-0">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-heading text-[15px] font-bold m-0">Investimento por conta</h2>
              <span className="font-mono text-[11.5px] text-text-faint">
                {filtroCartao ? `${contas.length} contas neste cartão` : `${contas.length} contas`}
              </span>
            </div>
            <div className="bg-surface border border-border rounded-sm py-1 px-3.5">
              {contas.map((a) => (
                <div key={a.nome} className="py-3 border-b border-divider last:border-b-0 flex items-center gap-3">
                  <span className="font-mono text-[10px] tracking-[0.06em] uppercase text-text-muted bg-[#F1F3EE] rounded-[3px] py-0.5 px-1.5 w-[58px] shrink-0 text-center">
                    {a.plataforma}
                  </span>
                  <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                    <span className="text-[13.5px] truncate">{a.nome}</span>
                    <div className="h-1 bg-[#ECEEE9] rounded-[2px] overflow-hidden">
                      <div className="h-full bg-ink" style={{ width: `${Math.max(1, Math.round((a.total / (totalContas || 1)) * 100))}%` }} />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono text-[14px] font-medium tabular-nums whitespace-nowrap">{BRL(a.total)}</div>
                    <div className="font-mono text-[11px] text-text-faint">
                      {Math.max(1, Math.round((a.total / (totalContas || 1)) * 100))}%
                    </div>
                  </div>
                </div>
              ))}
              <div className="py-3 flex items-center justify-between gap-3">
                <span className="text-[12.5px] font-bold tracking-[0.04em] uppercase">Total do período</span>
                <span className="font-mono text-[15px] font-semibold tabular-nums">{BRL(totalContas)}</span>
              </div>
            </div>
            <div className="text-[12px] text-text-faint leading-relaxed text-pretty">
              Contas Meta aparecem no nível da conta. Lançamentos com a tag{" "}
              <span className="font-mono text-[11.5px] bg-[#EFF1EC] rounded-[3px] py-0.5 px-1">Investimento RT</span> na
              observação entram no total normalmente.
            </div>
          </section>
        </div>
      )}
        </>
      )}
    </div>
  );
}
