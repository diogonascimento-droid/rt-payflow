"use client";

import { useMemo } from "react";
import { NavBar } from "@/components/NavBar";
import { usePeriod } from "@/lib/usePeriod";
import { PeriodPicker } from "@/components/PeriodPicker";
import { useLancamentos } from "@/lib/supabase/hooks";
import { CarregandoState, ErroState } from "@/components/AsyncState";
import { filtrarPorPeriodo, agruparPorCartao, agruparPorConta } from "@/lib/aggregate";
import { BRL, fmtData } from "@/lib/format";
import { temTagInvestimentoRT } from "@/lib/investimentoRT";

export default function RelatorioPage() {
  const { lancamentos, carregando, erro, recarregar } = useLancamentos();
  const period = usePeriod(undefined, useMemo(() => lancamentos.map((l) => l.data), [lancamentos]));
  const doPeriodo = useMemo(
    () => filtrarPorPeriodo(lancamentos, period.periodoInicio, period.periodoFim),
    [lancamentos, period.periodoInicio, period.periodoFim]
  );

  const cartoes = useMemo(() => agruparPorCartao(doPeriodo), [doPeriodo]);
  const contas = useMemo(() => agruparPorConta(doPeriodo), [doPeriodo]);
  const totalGeral = doPeriodo.reduce((s, l) => s + l.valor, 0);
  const nLanc = doPeriodo.length;
  const csv = doPeriodo.filter((l) => l.origem === "csv").length;
  const manual = nLanc - csv;
  const investimentoRT = doPeriodo.filter((l) => temTagInvestimentoRT(l.obs)).reduce((s, l) => s + l.valor, 0);

  const kpis = [
    { label: "Total do período", value: BRL(totalGeral), hint: `${fmtData(period.periodoInicio)} a ${fmtData(period.periodoFim)}` },
    { label: "Lançamentos", value: String(nLanc), hint: `${csv} importados · ${manual} manuais` },
    { label: "Ticket médio", value: BRL(nLanc ? totalGeral / nLanc : 0), hint: "" },
    { label: "Investimento RT", value: BRL(investimentoRT), hint: totalGeral ? `${((investimentoRT / totalGeral) * 100).toFixed(1)}% do período` : "" },
  ];

  const plataformasPorCartao = new Map<string, Set<string>>();
  doPeriodo.forEach((l) => {
    if (!plataformasPorCartao.has(l.cartao)) plataformasPorCartao.set(l.cartao, new Set());
    plataformasPorCartao.get(l.cartao)!.add(l.plataforma);
  });

  return (
    <div className="min-h-screen flex flex-col">
      <div className="no-print">
        <NavBar
          right={
            <>
              <PeriodPicker period={period} variant="dark" align="right" />
              <button
                onClick={() => window.print()}
                className="font-body text-[13px] font-bold bg-lima-ui text-ink border-none rounded-btn py-2 px-4 cursor-pointer whitespace-nowrap"
              >
                Imprimir / salvar PDF
              </button>
            </>
          }
        />
      </div>

      {carregando ? (
        <CarregandoState />
      ) : erro ? (
        <ErroState mensagem={erro} onRetry={recarregar} />
      ) : (
      <div className="flex-1 flex justify-center py-8 px-4 bg-[#DADAD4] print:bg-white print:p-0">
        <section
          className="bg-white text-[#141412] flex flex-col w-full max-w-[210mm] min-h-[297mm] py-[16mm] px-[16mm] pb-[14mm] box-border shadow-[0_4px_24px_rgba(0,0,0,0.15)] print:shadow-none"
          style={{ fontFamily: "var(--font-body)" }}
        >
          <div className="flex items-end justify-between gap-4 border-b-2 border-[#141412] pb-2.5">
            <div className="flex items-center gap-3">
              <img src="/rt-payflow-logo.png" alt="RT PayFlow" style={{ height: 26 }} />
              <div className="w-px h-[26px] bg-[#B8B8B0]" />
              <div>
                <div className="font-mono text-[9px] tracking-[0.1em] uppercase text-[#54544A]">RT Publicity · uso interno</div>
                <div className="font-heading text-[15px] font-bold">Relatório do período</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-[9px] tracking-[0.1em] uppercase text-[#54544A]">Período</div>
              <div className="font-heading text-[16px] font-bold">
                {fmtData(period.periodoInicio)} — {fmtData(period.periodoFim)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2.5 mt-3.5">
            {kpis.map((k) => (
              <div key={k.label} className="border border-[#141412] py-2.5 px-3 flex flex-col gap-0.5">
                <span className="font-mono text-[8.5px] tracking-[0.08em] uppercase text-[#54544A]">{k.label}</span>
                <span className="font-heading text-[19px] font-bold tabular-nums whitespace-nowrap">{k.value}</span>
                <span className="text-[9.5px] text-[#54544A]">{k.hint}</span>
              </div>
            ))}
          </div>

          <div className="mt-5">
            <div className="flex items-baseline justify-between border-b-[1.5px] border-[#141412] pb-1.5">
              <h2 className="font-heading text-[13px] font-bold m-0 tracking-[0.02em] uppercase">Fechamento por cartão</h2>
              <span className="font-mono text-[9px] text-[#54544A]">soma dos lançamentos do período · não é fatura</span>
            </div>
            <table className="w-full border-collapse text-[11px] mt-0.5">
              <thead>
                <tr className="font-mono text-[8.5px] tracking-[0.06em] uppercase text-[#54544A]">
                  <th className="text-left font-normal py-1.5 px-1 border-b border-[#B8B8B0]">Cartão</th>
                  <th className="text-left font-normal py-1.5 px-1 border-b border-[#B8B8B0]">Plataformas</th>
                  <th className="text-right font-normal py-1.5 px-1 border-b border-[#B8B8B0]">Lançamentos</th>
                  <th className="text-right font-normal py-1.5 px-1 border-b border-[#B8B8B0]">Participação</th>
                  <th className="text-right font-normal py-1.5 px-1 border-b border-[#B8B8B0]">Total</th>
                </tr>
              </thead>
              <tbody>
                {cartoes.map((c) => (
                  <tr key={c.nome}>
                    <td className="py-1.5 px-1 border-b border-[#E2E2DC] font-mono">{c.nome}</td>
                    <td className="py-1.5 px-1 border-b border-[#E2E2DC] text-[#3A3A34]">
                      {Array.from(plataformasPorCartao.get(c.nome) || []).join(" · ")}
                    </td>
                    <td className="py-1.5 px-1 border-b border-[#E2E2DC] text-right font-mono text-[#3A3A34]">{c.n}</td>
                    <td className="py-1.5 px-1 border-b border-[#E2E2DC] text-right font-mono text-[#3A3A34]">
                      {totalGeral ? ((c.total / totalGeral) * 100).toFixed(1) : "0,0"}%
                    </td>
                    <td className="py-1.5 px-1 border-b border-[#E2E2DC] text-right font-mono font-semibold">{BRL(c.total)}</td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={4} className="py-2 px-1 border-t-[1.5px] border-[#141412] font-bold tracking-[0.04em] uppercase text-[10.5px]">
                    Total do período
                  </td>
                  <td className="py-2 px-1 border-t-[1.5px] border-[#141412] text-right font-mono font-bold text-[13px]">{BRL(totalGeral)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-[18px]">
            <div className="flex items-baseline justify-between border-b-[1.5px] border-[#141412] pb-1.5">
              <h2 className="font-heading text-[13px] font-bold m-0 tracking-[0.02em] uppercase">Investimento por conta de anúncio</h2>
              <span className="font-mono text-[9px] text-[#54544A]">{contas.length} contas ativas no período</span>
            </div>
            <table className="w-full border-collapse text-[11px] mt-0.5">
              <thead>
                <tr className="font-mono text-[8.5px] tracking-[0.06em] uppercase text-[#54544A]">
                  <th className="text-left font-normal py-1.5 px-1 border-b border-[#B8B8B0] w-[70px]">Plataforma</th>
                  <th className="text-left font-normal py-1.5 px-1 border-b border-[#B8B8B0]">Conta</th>
                  <th className="text-right font-normal py-1.5 px-1 border-b border-[#B8B8B0] w-[60px]">Participação</th>
                  <th className="text-right font-normal py-1.5 px-1 border-b border-[#B8B8B0] w-[100px]">Total</th>
                </tr>
              </thead>
              <tbody>
                {contas.map((a) => (
                  <tr key={a.nome}>
                    <td className="py-1 px-1 border-b border-[#E2E2DC] font-mono text-[9.5px] tracking-[0.04em] uppercase text-[#54544A]">{a.plataforma}</td>
                    <td className="py-1 px-1 border-b border-[#E2E2DC]">{a.nome}</td>
                    <td className="py-1 px-1 border-b border-[#E2E2DC] text-right font-mono text-[#3A3A34]">
                      {totalGeral ? ((a.total / totalGeral) * 100).toFixed(1) : "0,0"}%
                    </td>
                    <td className="py-1 px-1 border-b border-[#E2E2DC] text-right font-mono font-semibold">{BRL(a.total)}</td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={3} className="py-2 px-1 border-t-[1.5px] border-[#141412] font-bold tracking-[0.04em] uppercase text-[10.5px]">
                    Total do período
                  </td>
                  <td className="py-2 px-1 border-t-[1.5px] border-[#141412] text-right font-mono font-bold text-[13px]">{BRL(totalGeral)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-auto pt-3.5 border-t border-[#B8B8B0] flex justify-between font-mono text-[8.5px] text-[#54544A]">
            <span>RT PayFlow · relatório gerado agora</span>
            <span>Valores somados por data de lançamento — não correspondem à fatura de cada cartão</span>
          </div>
        </section>
      </div>
      )}
    </div>
  );
}
