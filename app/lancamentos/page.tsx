"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { NavBar } from "@/components/NavBar";
import { PeriodPicker } from "@/components/PeriodPicker";
import { Combobox } from "@/components/Combobox";
import { OriginBadge } from "@/components/badges";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { SlideOverPanel, Field } from "@/components/SlideOverPanel";
import { CurrencyInput } from "@/components/CurrencyInput";
import { usePeriod } from "@/lib/usePeriod";
import { useCombobox } from "@/lib/useCombobox";
import { LANCAMENTOS as LANCAMENTOS_INICIAIS, PLATAFORMAS, CONTAS_POR_PLATAFORMA, CARTAO_NOMES } from "@/lib/mockData";
import { filtrarPorPeriodo, agruparPorDia } from "@/lib/aggregate";
import { BRL } from "@/lib/format";
import { Lancamento } from "@/lib/types";

type Confirmacao = { tipo: "single" | "lote"; ids: string[]; texto: string };

export default function LancamentosPage() {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>(LANCAMENTOS_INICIAIS);
  const period = usePeriod();
  const [plataforma, setPlataforma] = useState("Todas");
  const [conta, setConta] = useState("");
  const [cartao, setCartao] = useState("");
  const [origem, setOrigem] = useState<"Todas" | "Manual" | "CSV Meta">("Todas");
  const [agruparPorDiaAtivo, setAgruparPorDiaAtivo] = useState(true);
  const [selecionados, setSelecionados] = useState<Record<string, boolean>>({});
  const [editando, setEditando] = useState<Lancamento | null>(null);
  const [confirmando, setConfirmando] = useState<Confirmacao | null>(null);

  const contasFiltro = plataforma === "Todas" ? Object.values(CONTAS_POR_PLATAFORMA).flat() : CONTAS_POR_PLATAFORMA[plataforma] || [];
  const contaCombo = useCombobox(["Todas as contas", ...contasFiltro], conta || "Todas as contas", (v) => setConta(v === "Todas as contas" ? "" : v));
  const cartaoCombo = useCombobox(["Todos os cartões", ...CARTAO_NOMES], cartao || "Todos os cartões", (v) => setCartao(v === "Todos os cartões" ? "" : v));

  const filtrados = useMemo(() => {
    let out = filtrarPorPeriodo(lancamentos, period.periodoInicio, period.periodoFim);
    if (plataforma !== "Todas") out = out.filter((l) => l.plataforma === plataforma);
    if (conta) out = out.filter((l) => l.conta === conta);
    if (cartao) out = out.filter((l) => l.cartao === cartao);
    if (origem === "Manual") out = out.filter((l) => l.origem === "manual");
    if (origem === "CSV Meta") out = out.filter((l) => l.origem === "csv");
    return out;
  }, [lancamentos, period.periodoInicio, period.periodoFim, plataforma, conta, cartao, origem]);

  const totalFiltrado = filtrados.reduce((s, l) => s + l.valor, 0);
  const idsFiltrados = filtrados.map((l) => l.id);
  const selecionadosVisiveis = idsFiltrados.filter((id) => selecionados[id]);
  const todosSelecionados = idsFiltrados.length > 0 && selecionadosVisiveis.length === idsFiltrados.length;

  const temFiltroAtivo = plataforma !== "Todas" || !!conta || !!cartao || origem !== "Todas";

  const limparFiltros = () => {
    setPlataforma("Todas");
    setConta("");
    setCartao("");
    setOrigem("Todas");
  };

  const toggleTodos = () => {
    const marcar = selecionadosVisiveis.length !== idsFiltrados.length;
    setSelecionados((s) => {
      const novo = { ...s };
      idsFiltrados.forEach((id) => (novo[id] = marcar));
      return novo;
    });
  };

  const excluir = (ids: string[]) => {
    setLancamentos((ls) => ls.filter((l) => !ids.includes(l.id)));
    setSelecionados((s) => {
      const novo = { ...s };
      ids.forEach((id) => delete novo[id]);
      return novo;
    });
    setConfirmando(null);
  };

  const dias = agruparPorDiaAtivo ? agruparPorDia(filtrados) : null;

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar
        right={
          <Link href="/novo-lancamento" className="font-body text-[13px] font-bold bg-lima-ui text-ink rounded-btn py-2 px-4 no-underline whitespace-nowrap">
            + Lançamento
          </Link>
        }
      />

      <div className="bg-surface border-b border-border py-3 px-7 flex items-center gap-2.5 flex-wrap relative z-10">
        <PeriodPicker period={period} variant="light" />

        <select
          value={plataforma}
          onChange={(e) => {
            setPlataforma(e.target.value);
            setConta("");
          }}
          className="text-[13px] py-2 px-2.5 rounded-btn bg-[#F1F3EE] text-text-body border border-[#DCE0D9]"
        >
          <option value="Todas">Todas as plataformas</option>
          {PLATAFORMAS.map((p) => (
            <option key={p.id} value={p.nome}>
              {p.nome}
            </option>
          ))}
        </select>

        <Combobox combo={contaCombo} placeholder="Todas as contas" className="w-[190px] !bg-[#F1F3EE] !border-[#DCE0D9] !py-2" />
        <Combobox combo={cartaoCombo} placeholder="Todos os cartões" mono className="w-[170px] !bg-[#F1F3EE] !border-[#DCE0D9] !py-2" />

        <select
          value={origem}
          onChange={(e) => setOrigem(e.target.value as typeof origem)}
          className="text-[13px] py-2 px-2.5 rounded-btn bg-[#F1F3EE] text-text-body border border-[#DCE0D9]"
        >
          <option value="Todas">Origem: todas</option>
          <option value="Manual">Manual</option>
          <option value="CSV Meta">CSV Meta</option>
        </select>

        {temFiltroAtivo && (
          <button onClick={limparFiltros} className="font-body text-[12.5px] bg-transparent border-none text-text-muted underline cursor-pointer">
            limpar filtros
          </button>
        )}

        <label className="ml-auto flex items-center gap-2 text-[13px] cursor-pointer select-none">
          <input type="checkbox" checked={agruparPorDiaAtivo} onChange={() => setAgruparPorDiaAtivo((v) => !v)} className="w-4 h-4 cursor-pointer" />
          Agrupar por dia
        </label>
      </div>

      {filtrados.length === 0 ? (
        <div className="flex-1 flex items-center justify-center py-20 px-7">
          <div className="max-w-[420px] text-center flex flex-col items-center gap-3.5">
            <div className="w-10 h-[3px] bg-lima-ui rounded-[2px]" />
            <h2 className="font-heading text-[20px] font-bold m-0">Nenhum lançamento encontrado</h2>
            <p className="m-0 text-[14px] leading-relaxed text-text-muted">
              Nenhum registro corresponde aos filtros atuais. Ajuste o período ou limpe os filtros.
            </p>
            <button onClick={limparFiltros} className="font-body text-[13px] font-bold bg-ink text-text-on-dark border-none rounded-btn py-2.5 px-[18px] cursor-pointer">
              Limpar filtros
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto px-7 pb-[90px]">
          <table className="w-full border-collapse text-[13px] mt-3.5">
            <thead>
              <tr className="font-mono text-[10.5px] tracking-[0.06em] uppercase text-text-faint">
                <th className="w-[34px] py-2 px-1.5 border-b border-[#DADED7] text-left">
                  <input type="checkbox" checked={todosSelecionados} onChange={toggleTodos} className="w-[15px] h-[15px] cursor-pointer" />
                </th>
                <th className="w-[86px] py-2 px-1.5 border-b border-[#DADED7] text-left">Data</th>
                <th className="w-[74px] py-2 px-1.5 border-b border-[#DADED7] text-left">Plataforma</th>
                <th className="py-2 px-1.5 border-b border-[#DADED7] text-left">Conta</th>
                <th className="w-[130px] py-2 px-1.5 border-b border-[#DADED7] text-left">Cartão</th>
                <th className="w-[110px] py-2 px-1.5 border-b border-[#DADED7] text-right">Valor</th>
                <th className="w-[78px] py-2 px-1.5 border-b border-[#DADED7] text-left">Origem</th>
                <th className="w-[150px] py-2 px-1.5 border-b border-[#DADED7] text-left">Observação</th>
                <th className="w-[76px] py-2 px-1.5 border-b border-[#DADED7] text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {agruparPorDiaAtivo && dias
                ? dias.map((g) => (
                    <RowGroup
                      key={g.data}
                      grupo={g}
                      selecionados={selecionados}
                      setSelecionados={setSelecionados}
                      setEditando={setEditando}
                      setConfirmando={setConfirmando}
                    />
                  ))
                : filtrados.map((l) => (
                    <LinhaLancamento
                      key={l.id}
                      l={l}
                      selecionado={!!selecionados[l.id]}
                      onToggle={() => setSelecionados((s) => ({ ...s, [l.id]: !s[l.id] }))}
                      onEditar={() => setEditando(l)}
                      onExcluir={() =>
                        setConfirmando({ tipo: "single", ids: [l.id], texto: `Excluir o lançamento de ${l.data} · ${l.conta} · ${BRL(l.valor)}? Essa ação não pode ser desfeita.` })
                      }
                    />
                  ))}
            </tbody>
          </table>
        </div>
      )}

      {selecionadosVisiveis.length > 0 && (
        <div className="fixed left-7 right-7 bottom-[66px] flex items-center gap-3 bg-ink text-text-on-dark rounded-card py-2.5 px-4 shadow-[0_10px_26px_rgba(16,18,16,0.24)] max-w-[1040px] mx-auto z-20">
          <span className="text-[13px]">{selecionadosVisiveis.length} selecionado(s)</span>
          <button
            onClick={() =>
              setConfirmando({
                tipo: "lote",
                ids: selecionadosVisiveis,
                texto: `Excluir ${selecionadosVisiveis.length} lançamentos selecionados? Essa ação não pode ser desfeita.`,
              })
            }
            className="font-body text-[12.5px] font-bold bg-surface text-danger border-none rounded-[6px] py-1.5 px-3 cursor-pointer whitespace-nowrap"
          >
            Excluir selecionados
          </button>
          <button onClick={() => setSelecionados({})} className="ml-auto font-body text-[12.5px] bg-transparent border-none text-text-on-dark-muted cursor-pointer">
            limpar seleção
          </button>
        </div>
      )}

      <div className="fixed left-0 right-0 bottom-0 bg-surface border-t border-border py-3 px-7 flex items-center gap-3 z-[5]">
        <span className="font-mono text-[12.5px] text-text-muted">{filtrados.length} lançamentos filtrados</span>
        <span className="ml-auto font-mono text-[16px] font-semibold tabular-nums">{BRL(totalFiltrado)}</span>
      </div>

      {editando && (
        <EditarLancamento
          lancamento={editando}
          onCancel={() => setEditando(null)}
          onSalvar={(atualizado) => {
            setLancamentos((ls) => ls.map((l) => (l.id === atualizado.id ? atualizado : l)));
            setEditando(null);
          }}
        />
      )}

      {confirmando && (
        <ConfirmDialog
          title={confirmando.tipo === "lote" ? "Excluir lançamentos selecionados?" : "Excluir lançamento?"}
          text={confirmando.texto}
          onConfirm={() => excluir(confirmando.ids)}
          onCancel={() => setConfirmando(null)}
        />
      )}
    </div>
  );
}

function LinhaLancamento({
  l,
  selecionado,
  onToggle,
  onEditar,
  onExcluir,
}: {
  l: Lancamento;
  selecionado: boolean;
  onToggle: () => void;
  onEditar: () => void;
  onExcluir: () => void;
}) {
  return (
    <tr className="border-b border-divider" style={{ background: selecionado ? "#FFFDF0" : "transparent" }}>
      <td className="py-2 px-1.5">
        <input type="checkbox" checked={selecionado} onChange={onToggle} className="w-[15px] h-[15px] cursor-pointer" />
      </td>
      <td className="py-2 px-1.5 font-mono text-[12.5px] whitespace-nowrap">{l.data}</td>
      <td className="py-2 px-1.5 text-[12.5px] text-text-muted whitespace-nowrap">{l.plataforma}</td>
      <td className="py-2 px-1.5 truncate max-w-[1px]">{l.conta}</td>
      <td className="py-2 px-1.5 font-mono text-[12px] whitespace-nowrap">{l.cartao}</td>
      <td className="py-2 px-1.5 text-right font-mono text-[13px] font-medium tabular-nums whitespace-nowrap">{BRL(l.valor)}</td>
      <td className="py-2 px-1.5">
        <OriginBadge origem={l.origem} />
      </td>
      <td className="py-2 px-1.5 text-[12px] text-text-faint truncate max-w-[1px]">{l.obs || "—"}</td>
      <td className="py-2 px-1.5 text-right whitespace-nowrap">
        <button onClick={onEditar} className="font-body text-[12px] bg-transparent border-none text-text-muted underline cursor-pointer py-0.5 px-1">
          editar
        </button>
        <button onClick={onExcluir} className="font-body text-[12px] bg-transparent border-none text-danger-strong underline cursor-pointer py-0.5 px-1">
          excluir
        </button>
      </td>
    </tr>
  );
}

function RowGroup({
  grupo,
  selecionados,
  setSelecionados,
  setEditando,
  setConfirmando,
}: {
  grupo: { data: string; total: number; itens: Lancamento[] };
  selecionados: Record<string, boolean>;
  setSelecionados: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setEditando: (l: Lancamento) => void;
  setConfirmando: (c: Confirmacao) => void;
}) {
  return (
    <>
      <tr className="bg-divider">
        <td colSpan={5} className="py-1.5 px-1.5 font-mono text-[11.5px] text-text-muted">
          {grupo.data} · {grupo.itens.length} lançamentos
        </td>
        <td className="py-1.5 px-1.5 text-right font-mono text-[12.5px] font-semibold tabular-nums">{BRL(grupo.total)}</td>
        <td colSpan={3} />
      </tr>
      {grupo.itens.map((l) => (
        <LinhaLancamento
          key={l.id}
          l={l}
          selecionado={!!selecionados[l.id]}
          onToggle={() => setSelecionados((s) => ({ ...s, [l.id]: !s[l.id] }))}
          onEditar={() => setEditando(l)}
          onExcluir={() =>
            setConfirmando({ tipo: "single", ids: [l.id], texto: `Excluir o lançamento de ${l.data} · ${l.conta} · ${BRL(l.valor)}? Essa ação não pode ser desfeita.` })
          }
        />
      ))}
    </>
  );
}

function EditarLancamento({
  lancamento,
  onCancel,
  onSalvar,
}: {
  lancamento: Lancamento;
  onCancel: () => void;
  onSalvar: (l: Lancamento) => void;
}) {
  const [form, setForm] = useState(lancamento);
  const contaCombo = useCombobox(CONTAS_POR_PLATAFORMA[form.plataforma] || [], form.conta, (v) => setForm((f) => ({ ...f, conta: v })));
  const cartaoCombo = useCombobox(CARTAO_NOMES, form.cartao, (v) => setForm((f) => ({ ...f, cartao: v })));

  return (
    <SlideOverPanel
      title="Editar lançamento"
      onClose={onCancel}
      footer={
        <>
          <button
            onClick={() => onSalvar(form)}
            className="font-body text-[14px] font-bold bg-lima-ui text-ink border-none rounded-btn py-2.5 px-[18px] cursor-pointer"
          >
            Salvar alterações
          </button>
          <button onClick={onCancel} className="font-body text-[13.5px] bg-surface border border-input-border rounded-btn py-2.5 px-4 cursor-pointer">
            Cancelar
          </button>
        </>
      }
    >
      <Field label="Data">
        <input
          value={form.data}
          onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))}
          className="font-mono text-[14px] py-2.5 px-2.5 border border-input-border rounded-sm"
        />
      </Field>
      <Field label="Plataforma">
        <select
          value={form.plataforma}
          onChange={(e) => setForm((f) => ({ ...f, plataforma: e.target.value, conta: "" }))}
          className="text-[14px] py-2.5 px-2.5 border border-input-border rounded-sm"
        >
          {PLATAFORMAS.map((p) => (
            <option key={p.id} value={p.nome}>
              {p.nome}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Conta">
        <Combobox combo={contaCombo} />
      </Field>
      <Field label="Cartão">
        <Combobox combo={cartaoCombo} mono />
      </Field>
      <Field label="Valor">
        <CurrencyInput
          centavos={Math.round(form.valor * 100)}
          onChange={(centavos) => setForm((f) => ({ ...f, valor: centavos / 100 }))}
          className="font-mono font-semibold text-[20px] tabular-nums text-right py-2.5 px-3 border border-input-border rounded-sm"
        />
      </Field>
      <Field label="Observação">
        <textarea
          rows={2}
          value={form.obs || ""}
          onChange={(e) => setForm((f) => ({ ...f, obs: e.target.value }))}
          className="text-[14px] py-2.5 px-2.5 border border-input-border rounded-sm resize-y"
        />
      </Field>
    </SlideOverPanel>
  );
}
