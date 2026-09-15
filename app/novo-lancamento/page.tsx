"use client";

import { useEffect, useMemo, useState } from "react";
import { NavBar } from "@/components/NavBar";
import { Combobox } from "@/components/Combobox";
import { Toast } from "@/components/Toast";
import { CurrencyInput } from "@/components/CurrencyInput";
import { CarregandoState, ErroState } from "@/components/AsyncState";
import { useCombobox } from "@/lib/useCombobox";
import { useLancamentos, usePlataformas, useContas, useCartoes } from "@/lib/supabase/hooks";
import { criarLancamento, excluirLancamentos } from "@/lib/supabase/queries";
import { BRL, fmtData, cartaoRotulo } from "@/lib/format";
import { TAG_INVESTIMENTO_RT } from "@/lib/investimentoRT";
import { Lancamento } from "@/lib/types";

const HOJE_STR = fmtData(new Date());

type FormState = {
  data: string;
  plataforma: string;
  conta: string;
  cartao: string;
  centavos: number;
  obs: string;
  erro: string;
};

const estadoInicial = (plataformaInicial: string, ultimoCartao: string): FormState => ({
  data: HOJE_STR,
  plataforma: plataformaInicial,
  conta: "",
  cartao: ultimoCartao,
  centavos: 0,
  obs: "",
  erro: "",
});

export default function NovoLancamentoPage() {
  const { lancamentos, setLancamentos, carregando, erro, recarregar } = useLancamentos();
  const { plataformas } = usePlataformas();
  const { contas } = useContas();
  const { cartoes } = useCartoes();

  const CONTAS_POR_PLATAFORMA = useMemo(() => {
    const mapa: Record<string, string[]> = {};
    contas.forEach((c) => {
      (mapa[c.plataforma] ||= []).push(c.nome);
    });
    return mapa;
  }, [contas]);
  const CARTAO_NOMES = useMemo(() => cartoes.map(cartaoRotulo), [cartoes]);
  const plataformaInicial = plataformas[0]?.nome || "";

  const [recentContas, setRecentContas] = useState<string[]>([]);
  const [form, setForm] = useState<FormState>(() => estadoInicial("", ""));
  const [toast, setToast] = useState<Lancamento | null>(null);
  const [inicializado, setInicializado] = useState(false);

  // Assim que os cadastros chegarem, define os valores padrão do formulário.
  useEffect(() => {
    if (!inicializado && plataformaInicial && CARTAO_NOMES.length > 0) {
      setForm(estadoInicial(plataformaInicial, CARTAO_NOMES[0]));
      setInicializado(true);
    }
  }, [inicializado, plataformaInicial, CARTAO_NOMES]);

  const ultimos5 = useMemo(() => lancamentos.slice(0, 5), [lancamentos]);

  const contasOpcoes = useMemo(() => {
    const base = CONTAS_POR_PLATAFORMA[form.plataforma] || [];
    return [...base].sort((a, b) => {
      const ia = recentContas.indexOf(a);
      const ib = recentContas.indexOf(b);
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    });
  }, [form.plataforma, recentContas, CONTAS_POR_PLATAFORMA]);

  const contaCombo = useCombobox(contasOpcoes, form.conta, (v) => setForm((f) => ({ ...f, conta: v, erro: "" })));
  const cartaoCombo = useCombobox(CARTAO_NOMES, form.cartao, (v) => setForm((f) => ({ ...f, cartao: v })));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        salvar(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  async function salvar(continuar: boolean) {
    if (!form.conta) return setForm((f) => ({ ...f, erro: "Escolha a conta de anúncio antes de registrar." }));
    if (!form.centavos) return setForm((f) => ({ ...f, erro: "Informe o valor da cobrança." }));
    try {
      const registro = await criarLancamento({
        data: form.data,
        plataforma: form.plataforma,
        conta: form.conta,
        cartao: form.cartao,
        valor: form.centavos / 100,
        origem: "manual",
        obs: form.obs || undefined,
      });
      setLancamentos((l) => [registro, ...l]);
      setRecentContas((r) => [form.conta, ...r.filter((x) => x !== form.conta)].slice(0, 8));
      setToast(registro);
      setForm(continuar ? { ...estadoInicial(form.plataforma, form.cartao) } : estadoInicial(form.plataforma, form.cartao));
    } catch (e) {
      setForm((f) => ({ ...f, erro: (e as Error).message }));
    }
  }

  async function desfazer() {
    if (!toast) return;
    try {
      await excluirLancamentos([toast.id]);
      setLancamentos((l) => l.filter((x) => x.id !== toast.id));
      setToast(null);
    } catch (e) {
      setForm((f) => ({ ...f, erro: (e as Error).message }));
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      {carregando ? (
        <CarregandoState />
      ) : erro ? (
        <ErroState mensagem={erro} onRetry={recarregar} />
      ) : (
      <div className="flex-1 flex items-start justify-center py-8 px-4">
        <div className="relative w-full max-w-[460px] bg-surface border border-border rounded-card flex flex-col shadow-[0_18px_40px_rgba(16,18,16,0.10)]">
          <header className="flex items-center justify-between gap-3 py-[18px] px-[22px] border-b border-[#E7EAE5]">
            <h2 className="font-heading text-[17px] font-bold m-0">Novo lançamento</h2>
          </header>

          <div className="flex-1 overflow-auto py-[18px] px-[22px] flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="font-mono text-[10.5px] tracking-[0.1em] uppercase text-[#5C665E]">Data</span>
                <div className="flex gap-1.5">
                  <input
                    value={form.data}
                    onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))}
                    className="flex-1 min-w-0 font-mono text-[14px] py-2.5 px-3 border border-input-border rounded-sm bg-surface outline-none"
                  />
                  <button
                    onClick={() => setForm((f) => ({ ...f, data: HOJE_STR }))}
                    className="font-body text-[12px] bg-[#F1F3EE] border border-[#DCE0D9] rounded-sm px-2.5 cursor-pointer text-text-muted whitespace-nowrap"
                  >
                    hoje
                  </button>
                </div>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="font-mono text-[10.5px] tracking-[0.1em] uppercase text-[#5C665E]">Plataforma</span>
                <select
                  value={form.plataforma}
                  onChange={(e) => setForm((f) => ({ ...f, plataforma: e.target.value, conta: "", erro: "" }))}
                  className="text-[14px] py-2.5 px-3 border border-input-border rounded-sm bg-surface outline-none"
                >
                  {plataformas.map((p) => (
                    <option key={p.id} value={p.nome}>
                      {p.nome}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-[10.5px] tracking-[0.1em] uppercase text-[#5C665E]">Conta de anúncio</span>
              <Combobox combo={contaCombo} placeholder="Buscar conta…" hasError={!!form.erro && !form.conta} />
              <span className="text-[11.5px] text-text-faint">{contasOpcoes.length} contas {form.plataforma}</span>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-[10.5px] tracking-[0.1em] uppercase text-[#5C665E]">Cartão</span>
              <Combobox combo={cartaoCombo} mono />
              <span className="text-[11.5px] text-text-faint">Mais usados aparecem primeiro · lembra o último</span>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-[10.5px] tracking-[0.1em] uppercase text-[#5C665E]">Valor</span>
              <CurrencyInput
                centavos={form.centavos}
                onChange={(centavos) => setForm((f) => ({ ...f, centavos, erro: "" }))}
                hasError={!!form.erro && !form.centavos}
                className="font-mono font-semibold text-[26px] tabular-nums text-right py-3 px-3.5 border rounded-sm bg-surface outline-none border-input-border"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-[10.5px] tracking-[0.1em] uppercase text-[#5C665E]">Observação</span>
              <textarea
                rows={2}
                value={form.obs}
                onChange={(e) => setForm((f) => ({ ...f, obs: e.target.value }))}
                placeholder="opcional"
                className="text-[14px] py-2.5 px-3 border border-input-border rounded-sm bg-surface outline-none resize-y"
              />
              <button
                onClick={() => setForm((f) => ({ ...f, obs: (f.obs ? f.obs.trim() + " " : "") + TAG_INVESTIMENTO_RT }))}
                className="self-start font-mono text-[11.5px] bg-[#F1F3EE] border border-[#DCE0D9] rounded-pill py-1 px-2.5 cursor-pointer text-text-muted whitespace-nowrap"
              >
                + Investimento RT
              </button>
            </label>

            {form.erro && (
              <div className="flex gap-2.5 bg-danger-bg border border-danger-border border-l-[3px] border-l-danger-strong rounded-sm py-2.5 px-3 text-[13px] text-danger">
                {form.erro}
              </div>
            )}

            <div className="mt-1.5 border-t border-[#E7EAE5] pt-3.5 flex flex-col gap-2.5">
              <div className="flex items-baseline justify-between">
                <h3 className="font-heading text-[13.5px] font-bold m-0">Últimos 5 lançamentos</h3>
                <span className="font-mono text-[11px] text-text-faint">conferência</span>
              </div>
              {ultimos5.map((u) => (
                <div key={u.id} className="flex items-center gap-2.5 py-1.5 border-b border-[#EFF1EC] last:border-b-0">
                  <span className="font-mono text-[12px] text-text-faint w-[76px] shrink-0">{u.data}</span>
                  <span className="text-[13px] flex-1 min-w-0 truncate">{u.conta}</span>
                  <span className="font-mono text-[11.5px] text-text-faint shrink-0 whitespace-nowrap">{u.cartao}</span>
                  <span className="font-mono text-[13.5px] tabular-nums w-[104px] shrink-0 text-right whitespace-nowrap">{BRL(u.valor)}</span>
                </div>
              ))}
            </div>
          </div>

          <footer className="border-t border-[#E7EAE5] py-3.5 px-[22px] flex items-center gap-2.5 bg-surface flex-wrap">
            <button
              onClick={() => salvar(false)}
              className="font-body text-[14px] font-bold bg-lima-ui text-ink border-none rounded-btn py-2.5 px-5 cursor-pointer"
            >
              Registrar
            </button>
            <button
              onClick={() => salvar(true)}
              className="font-body text-[13.5px] bg-surface border border-input-border rounded-btn py-2.5 px-[18px] cursor-pointer"
            >
              Salvar e lançar outro
            </button>
            <span className="ml-auto font-mono text-[11px] text-text-faint-2 whitespace-nowrap hidden sm:inline">⌘↵ registra</span>
          </footer>

          {toast && (
            <div className="absolute left-6 bottom-6 right-6 sm:right-auto">
              <Toast text={`Lançado ${BRL(toast.valor)} · ${toast.conta}`} onAction={desfazer} />
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
