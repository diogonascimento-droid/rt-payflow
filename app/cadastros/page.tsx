"use client";

import { useMemo, useState } from "react";
import { NavBar } from "@/components/NavBar";
import { StatusBadge } from "@/components/badges";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { SlideOverPanel, Field } from "@/components/SlideOverPanel";
import { CarregandoState, ErroState } from "@/components/AsyncState";
import { useAuth } from "@/lib/supabase/useAuth";
import { useLancamentos, usePlataformas, useContas, useCartoes, contarUso } from "@/lib/supabase/hooks";
import {
  criarPlataforma, atualizarPlataforma, excluirPlataforma,
  criarConta, atualizarConta, excluirConta,
  criarCartao, atualizarCartao, excluirCartao,
} from "@/lib/supabase/queries";
import { PlataformaCadastro, ContaCadastro, CartaoCadastro } from "@/lib/types";
import { cartaoRotulo } from "@/lib/format";

type Aba = "plataformas" | "contas" | "cartoes";

type Confirmacao = { tipo: "plataforma" | "conta" | "cartao"; id: string; texto: string };

export default function CadastrosPage() {
  const { isEditor } = useAuth();
  const [aba, setAba] = useState<Aba>("plataformas");
  const { plataformas, setPlataformas, carregando: carregandoP, erro: erroP, recarregar: recarregarP } = usePlataformas();
  const { contas, setContas, carregando: carregandoC, erro: erroC, recarregar: recarregarC } = useContas();
  const { cartoes, setCartoes, carregando: carregandoK, erro: erroK, recarregar: recarregarK } = useCartoes();
  const { lancamentos } = useLancamentos();
  const { porConta, porCartao } = useMemo(() => contarUso(lancamentos), [lancamentos]);

  const carregando = carregandoP || carregandoC || carregandoK;
  const erro = erroP || erroC || erroK;
  const recarregar = () => {
    recarregarP();
    recarregarC();
    recarregarK();
  };

  const [painel, setPainel] = useState<
    | { tipo: "plataforma"; item: PlataformaCadastro }
    | { tipo: "conta"; item: ContaCadastro }
    | { tipo: "cartao"; item: CartaoCadastro }
    | null
  >(null);
  const [confirmando, setConfirmando] = useState<Confirmacao | null>(null);
  const [acaoErro, setAcaoErro] = useState<string | null>(null);

  const abas: { chave: Aba; nome: string }[] = [
    { chave: "plataformas", nome: "Plataformas" },
    { chave: "contas", nome: "Contas de anúncio" },
    { chave: "cartoes", nome: "Cartões" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />

      <div className="bg-surface border-b border-border px-7 flex gap-1.5">
        {abas.map((a) => (
          <button
            key={a.chave}
            onClick={() => setAba(a.chave)}
            className="font-heading text-[14px] font-semibold bg-transparent border-none py-3.5 px-1.5 cursor-pointer whitespace-nowrap"
            style={{ borderBottom: `2px solid ${aba === a.chave ? "#101210" : "transparent"}`, color: aba === a.chave ? "#101210" : "#8A938B" }}
          >
            {a.nome}
          </button>
        ))}
      </div>

      {acaoErro && (
        <div className="bg-danger-bg border-b border-danger-border text-danger text-[13px] py-2 px-7 flex items-center gap-3">
          {acaoErro}
          <button onClick={() => setAcaoErro(null)} className="ml-auto bg-transparent border-none text-danger underline cursor-pointer">
            dispensar
          </button>
        </div>
      )}

      {carregando ? (
        <CarregandoState />
      ) : erro ? (
        <ErroState mensagem={erro} onRetry={recarregar} />
      ) : (
      <div className="py-5 px-7 pb-16 flex flex-col gap-3.5 max-w-[980px] mx-auto w-full">
        {aba === "plataformas" && (
          <>
            <div className="flex items-baseline justify-between">
              <h1 className="font-heading text-[19px] font-bold m-0">Plataformas</h1>
              {isEditor && (
                <button
                  onClick={() => setPainel({ tipo: "plataforma", item: { id: "", nome: "", ativa: true } })}
                  className="font-body text-[13px] font-bold bg-lima-ui text-ink border-none rounded-btn py-2 px-[15px] cursor-pointer"
                >
                  + Plataforma
                </button>
              )}
            </div>
            <div className="bg-surface border border-border rounded-card overflow-hidden max-w-[560px]">
              <div className="flex font-mono text-[10.5px] tracking-[0.06em] uppercase text-text-faint py-2.5 px-4">
                <span className="flex-1">Plataforma</span>
                <span className="w-[100px]">Contas</span>
                <span className="w-[80px]">Status</span>
                <span className="w-[110px] text-right">Ações</span>
              </div>
              {plataformas.map((p) => {
                const qtdContas = contas.filter((c) => c.plataforma === p.nome).length;
                return (
                  <div key={p.id} className="flex items-center py-2.5 px-4 border-b border-divider last:border-b-0">
                    <span className="flex-1 text-[14px] font-medium">{p.nome}</span>
                    <span className="w-[100px] font-mono text-[12.5px] text-text-muted">{qtdContas}</span>
                    <span className="w-[80px]">
                      <StatusBadge
                        ativa={p.ativa}
                        onClick={isEditor ? () => salvarPlataforma({ ...p, ativa: !p.ativa }) : undefined}
                      />
                    </span>
                    <span className="w-[110px] text-right whitespace-nowrap">
                      {isEditor && (
                        <>
                          <button
                            onClick={() => setPainel({ tipo: "plataforma", item: p })}
                            className="font-body text-[12px] bg-transparent border-none text-text-muted underline cursor-pointer py-0.5 px-1"
                          >
                            editar
                          </button>
                          {qtdContas === 0 && (
                            <button
                              onClick={() => setConfirmando({ tipo: "plataforma", id: p.id, texto: `Excluir a plataforma ${p.nome}? Essa ação não pode ser desfeita.` })}
                              className="font-body text-[12px] bg-transparent border-none text-danger-strong underline cursor-pointer py-0.5 px-1"
                            >
                              excluir
                            </button>
                          )}
                        </>
                      )}
                      {qtdContas > 0 && (
                        <span className="text-[11px] text-text-faint-2" title={`${qtdContas} conta(s) usam esta plataforma`}>
                          {qtdContas} conta(s)
                        </span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {aba === "contas" && (
          <>
            <div className="flex items-baseline justify-between">
              <h1 className="font-heading text-[19px] font-bold m-0">Contas de anúncio</h1>
              {isEditor && (
                <button
                  onClick={() =>
                    setPainel({ tipo: "conta", item: { id: "", nome: "", plataforma: plataformas[0]?.nome || "", cliente: "", idConta: "", ativa: true, qtdLancamentos: 0 } })
                  }
                  className="font-body text-[13px] font-bold bg-lima-ui text-ink border-none rounded-btn py-2 px-[15px] cursor-pointer"
                >
                  + Conta de anúncio
                </button>
              )}
            </div>
            <div className="bg-surface border border-border rounded-card overflow-hidden">
              <div className="flex font-mono text-[10.5px] tracking-[0.06em] uppercase text-text-faint py-2.5 px-4">
                <span className="w-[130px]">Plataforma</span>
                <span className="flex-1">Nome</span>
                <span className="flex-1">Cliente</span>
                <span className="w-[150px]">ID da conta</span>
                <span className="w-[76px]">Status</span>
                <span className="w-[160px] text-right">Ações</span>
              </div>
              {contas.map((c) => {
                const qtd = porConta.get(c.nome) || 0;
                return (
                <div key={c.id} className="flex items-center py-2.5 px-4 border-b border-divider last:border-b-0">
                  <span className="w-[130px] text-[12.5px] text-text-muted">{c.plataforma}</span>
                  <span className="flex-1 text-[14px] font-medium truncate pr-2">{c.nome}</span>
                  <span className="flex-1 text-[13px] text-text-muted truncate pr-2">{c.cliente}</span>
                  <span className="w-[150px] font-mono text-[12px] text-text-muted truncate">{c.idConta}</span>
                  <span className="w-[76px]">
                    <StatusBadge ativa={c.ativa} onClick={isEditor ? () => salvarConta({ ...c, ativa: !c.ativa }) : undefined} />
                  </span>
                  <span className="w-[160px] text-right whitespace-nowrap">
                    {isEditor && (
                      <>
                        <button
                          onClick={() => setPainel({ tipo: "conta", item: c })}
                          className="font-body text-[12px] bg-transparent border-none text-text-muted underline cursor-pointer py-0.5 px-1"
                        >
                          editar
                        </button>
                        {qtd === 0 && (
                          <button
                            onClick={() => setConfirmando({ tipo: "conta", id: c.id, texto: `Excluir a conta ${c.nome}? Essa ação não pode ser desfeita.` })}
                            className="font-body text-[12px] bg-transparent border-none text-danger-strong underline cursor-pointer py-0.5 px-1"
                          >
                            excluir
                          </button>
                        )}
                      </>
                    )}
                    {qtd > 0 && (
                      <span className="text-[11px] text-text-faint-2" title={`${qtd} lançamento(s) usam esta conta — desative em vez de excluir`}>
                        {qtd} lanç.
                      </span>
                    )}
                  </span>
                </div>
              );})}
            </div>
          </>
        )}

        {aba === "cartoes" && (
          <>
            <div className="flex items-baseline justify-between">
              <h1 className="font-heading text-[19px] font-bold m-0">Cartões</h1>
              {isEditor && (
                <button
                  onClick={() => setPainel({ tipo: "cartao", item: { id: "", bandeira: "Visa", final4: "", apelido: "", fechamento: undefined, vencimento: undefined, ativa: true, qtdLancamentos: 0 } })}
                  className="font-body text-[13px] font-bold bg-lima-ui text-ink border-none rounded-btn py-2 px-[15px] cursor-pointer"
                >
                  + Cartão
                </button>
              )}
            </div>
            <div className="bg-surface border border-border rounded-card overflow-hidden">
              <div className="flex font-mono text-[10.5px] tracking-[0.06em] uppercase text-text-faint py-2.5 px-4">
                <span className="w-[175px]">Cartão</span>
                <span className="flex-1">Apelido</span>
                <span className="w-[110px]">Fechamento</span>
                <span className="w-[110px]">Vencimento</span>
                <span className="w-[76px]">Status</span>
                <span className="w-[160px] text-right">Ações</span>
              </div>
              {cartoes.map((c) => {
                const qtd = porCartao.get(cartaoRotulo(c)) || 0;
                return (
                <div key={c.id} className="flex items-center py-2.5 px-4 border-b border-divider last:border-b-0">
                  <span className="w-[175px] font-mono text-[13px] whitespace-nowrap">
                    {c.bandeira} ···· {c.final4}
                  </span>
                  <span className="flex-1 text-[14px] truncate pr-2">{c.apelido}</span>
                  <span className="w-[110px] font-mono text-[12.5px] text-text-muted">dia {c.fechamento ?? "—"}</span>
                  <span className="w-[110px] font-mono text-[12.5px] text-text-muted">dia {c.vencimento ?? "—"}</span>
                  <span className="w-[76px]">
                    <StatusBadge ativa={c.ativa} onClick={isEditor ? () => salvarCartao({ ...c, ativa: !c.ativa }) : undefined} />
                  </span>
                  <span className="w-[160px] text-right whitespace-nowrap">
                    {isEditor && (
                      <>
                        <button
                          onClick={() => setPainel({ tipo: "cartao", item: c })}
                          className="font-body text-[12px] bg-transparent border-none text-text-muted underline cursor-pointer py-0.5 px-1"
                        >
                          editar
                        </button>
                        {qtd === 0 && (
                          <button
                            onClick={() => setConfirmando({ tipo: "cartao", id: c.id, texto: `Excluir o cartão ${c.bandeira} ···· ${c.final4}? Essa ação não pode ser desfeita.` })}
                            className="font-body text-[12px] bg-transparent border-none text-danger-strong underline cursor-pointer py-0.5 px-1"
                          >
                            excluir
                          </button>
                        )}
                      </>
                    )}
                    {qtd > 0 && (
                      <span className="text-[11px] text-text-faint-2" title={`${qtd} lançamento(s) usam este cartão — desative em vez de excluir`}>
                        {qtd} lanç.
                      </span>
                    )}
                  </span>
                </div>
              );})}
            </div>
          </>
        )}
      </div>
      )}

      {painel?.tipo === "plataforma" && (
        <PainelPlataforma item={painel.item} onClose={() => setPainel(null)} onSalvar={salvarPlataforma} />
      )}
      {painel?.tipo === "conta" && (
        <PainelConta
          item={painel.item}
          plataformasNomes={plataformas.map((p) => p.nome)}
          onClose={() => setPainel(null)}
          onSalvar={salvarConta}
        />
      )}
      {painel?.tipo === "cartao" && (
        <PainelCartao item={painel.item} onClose={() => setPainel(null)} onSalvar={salvarCartao} />
      )}

      {confirmando && (
        <ConfirmDialog
          title="Excluir cadastro?"
          text={confirmando.texto}
          onConfirm={async () => {
            try {
              if (confirmando.tipo === "plataforma") {
                await excluirPlataforma(confirmando.id);
                setPlataformas((ps) => ps.filter((x) => x.id !== confirmando.id));
              }
              if (confirmando.tipo === "conta") {
                await excluirConta(confirmando.id);
                setContas((cs) => cs.filter((x) => x.id !== confirmando.id));
              }
              if (confirmando.tipo === "cartao") {
                await excluirCartao(confirmando.id);
                setCartoes((cs) => cs.filter((x) => x.id !== confirmando.id));
              }
              setAcaoErro(null);
            } catch (e) {
              setAcaoErro((e as Error).message);
            }
            setConfirmando(null);
          }}
          onCancel={() => setConfirmando(null)}
        />
      )}
    </div>
  );

  async function salvarPlataforma(item: PlataformaCadastro) {
    try {
      if (item.id) {
        const atualizado = await atualizarPlataforma(item);
        setPlataformas((ps) => ps.map((x) => (x.id === item.id ? atualizado : x)));
      } else {
        const criado = await criarPlataforma(item);
        setPlataformas((ps) => [...ps, criado]);
      }
      setPainel(null);
      setAcaoErro(null);
    } catch (e) {
      setAcaoErro((e as Error).message);
    }
  }

  async function salvarConta(item: ContaCadastro) {
    try {
      if (item.id) {
        const atualizado = await atualizarConta(item);
        setContas((cs) => cs.map((x) => (x.id === item.id ? atualizado : x)));
      } else {
        const criado = await criarConta(item);
        setContas((cs) => [...cs, criado]);
      }
      setPainel(null);
      setAcaoErro(null);
    } catch (e) {
      setAcaoErro((e as Error).message);
    }
  }

  async function salvarCartao(item: CartaoCadastro) {
    try {
      if (item.id) {
        const atualizado = await atualizarCartao(item);
        setCartoes((cs) => cs.map((x) => (x.id === item.id ? atualizado : x)));
      } else {
        const criado = await criarCartao(item);
        setCartoes((cs) => [...cs, criado]);
      }
      setPainel(null);
      setAcaoErro(null);
    } catch (e) {
      setAcaoErro((e as Error).message);
    }
  }
}

function PainelPlataforma({ item, onClose, onSalvar }: { item: PlataformaCadastro; onClose: () => void; onSalvar: (p: PlataformaCadastro) => void }) {
  const [form, setForm] = useState(item);
  return (
    <SlideOverPanel
      title={item.id ? "Editar plataforma" : "Nova plataforma"}
      onClose={onClose}
      footer={
        <>
          <button onClick={() => onSalvar(form)} className="font-body text-[14px] font-bold bg-lima-ui text-ink border-none rounded-btn py-2.5 px-[18px] cursor-pointer">
            Salvar
          </button>
          <button onClick={onClose} className="font-body text-[13.5px] bg-surface border border-input-border rounded-btn py-2.5 px-4 cursor-pointer">
            Cancelar
          </button>
        </>
      }
    >
      <Field label="Nome">
        <input value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} className="text-[14px] py-2.5 px-2.5 border border-input-border rounded-sm" />
      </Field>
      <label className="flex items-center gap-2 text-[13.5px] cursor-pointer select-none border-t border-divider pt-3.5">
        <input type="checkbox" checked={form.ativa} onChange={() => setForm((f) => ({ ...f, ativa: !f.ativa }))} className="w-4 h-4 cursor-pointer" />
        Ativa
      </label>
    </SlideOverPanel>
  );
}

function PainelConta({
  item,
  plataformasNomes,
  onClose,
  onSalvar,
}: {
  item: ContaCadastro;
  plataformasNomes: string[];
  onClose: () => void;
  onSalvar: (c: ContaCadastro) => void;
}) {
  const [form, setForm] = useState(item);
  return (
    <SlideOverPanel
      title={item.id ? "Editar conta de anúncio" : "Nova conta de anúncio"}
      onClose={onClose}
      footer={
        <>
          <button onClick={() => onSalvar(form)} className="font-body text-[14px] font-bold bg-lima-ui text-ink border-none rounded-btn py-2.5 px-[18px] cursor-pointer">
            Salvar
          </button>
          <button onClick={onClose} className="font-body text-[13.5px] bg-surface border border-input-border rounded-btn py-2.5 px-4 cursor-pointer">
            Cancelar
          </button>
        </>
      }
    >
      <Field label="Nome da conta">
        <input value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} className="text-[14px] py-2.5 px-2.5 border border-input-border rounded-sm" />
      </Field>
      <Field label="Plataforma">
        <select value={form.plataforma} onChange={(e) => setForm((f) => ({ ...f, plataforma: e.target.value }))} className="text-[14px] py-2.5 px-2.5 border border-input-border rounded-sm">
          {plataformasNomes.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Cliente vinculado">
        <input
          value={form.cliente}
          onChange={(e) => setForm((f) => ({ ...f, cliente: e.target.value }))}
          placeholder="Nome do cliente da agência"
          className="text-[14px] py-2.5 px-2.5 border border-input-border rounded-sm"
        />
      </Field>
      <Field label="ID da conta na plataforma" hint="Usado para reconhecer a conta ao importar o CSV da Meta.">
        <input
          value={form.idConta}
          onChange={(e) => setForm((f) => ({ ...f, idConta: e.target.value }))}
          placeholder="ex.: 100000000000001"
          className="font-mono text-[14px] py-2.5 px-2.5 border border-input-border rounded-sm"
        />
      </Field>
      <label className="flex items-center gap-2 text-[13.5px] cursor-pointer select-none border-t border-divider pt-3.5">
        <input type="checkbox" checked={form.ativa} onChange={() => setForm((f) => ({ ...f, ativa: !f.ativa }))} className="w-4 h-4 cursor-pointer" />
        Ativa
      </label>
    </SlideOverPanel>
  );
}

function PainelCartao({ item, onClose, onSalvar }: { item: CartaoCadastro; onClose: () => void; onSalvar: (c: CartaoCadastro) => void }) {
  const [form, setForm] = useState(item);
  return (
    <SlideOverPanel
      title={item.id ? "Editar cartão" : "Novo cartão"}
      onClose={onClose}
      footer={
        <>
          <button onClick={() => onSalvar(form)} className="font-body text-[14px] font-bold bg-lima-ui text-ink border-none rounded-btn py-2.5 px-[18px] cursor-pointer">
            Salvar
          </button>
          <button onClick={onClose} className="font-body text-[13.5px] bg-surface border border-input-border rounded-btn py-2.5 px-4 cursor-pointer">
            Cancelar
          </button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Bandeira">
          <select value={form.bandeira} onChange={(e) => setForm((f) => ({ ...f, bandeira: e.target.value }))} className="text-[14px] py-2.5 px-2.5 border border-input-border rounded-sm">
            <option value="Visa">Visa</option>
            <option value="MasterCard">MasterCard</option>
            <option value="Amex">Amex</option>
            <option value="Elo">Elo</option>
          </select>
        </Field>
        <Field label="4 últimos dígitos">
          <input
            value={form.final4}
            onChange={(e) => setForm((f) => ({ ...f, final4: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
            maxLength={4}
            inputMode="numeric"
            className="font-mono text-[14px] py-2.5 px-2.5 border border-input-border rounded-sm"
          />
        </Field>
      </div>
      <Field label="Apelido">
        <input
          value={form.apelido}
          onChange={(e) => setForm((f) => ({ ...f, apelido: e.target.value }))}
          placeholder="ex.: Cartão do Bruno"
          className="text-[14px] py-2.5 px-2.5 border border-input-border rounded-sm"
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Dia de fechamento">
          <input
            value={form.fechamento ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, fechamento: e.target.value ? parseInt(e.target.value.replace(/\D/g, "").slice(0, 2), 10) : undefined }))}
            inputMode="numeric"
            className="font-mono text-[14px] py-2.5 px-2.5 border border-input-border rounded-sm"
          />
        </Field>
        <Field label="Dia de vencimento">
          <input
            value={form.vencimento ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, vencimento: e.target.value ? parseInt(e.target.value.replace(/\D/g, "").slice(0, 2), 10) : undefined }))}
            inputMode="numeric"
            className="font-mono text-[14px] py-2.5 px-2.5 border border-input-border rounded-sm"
          />
        </Field>
      </div>
      <span className="text-[11.5px] text-text-faint">
        Opcional — hoje o fechamento usado no filtro de período é sempre por data de lançamento, não pela fatura do cartão.
      </span>
      <label className="flex items-center gap-2 text-[13.5px] cursor-pointer select-none border-t border-divider pt-3.5">
        <input type="checkbox" checked={form.ativa} onChange={() => setForm((f) => ({ ...f, ativa: !f.ativa }))} className="w-4 h-4 cursor-pointer" />
        Ativo
      </label>
    </SlideOverPanel>
  );
}
