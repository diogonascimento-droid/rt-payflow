"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { NavBar } from "@/components/NavBar";
import { Combobox } from "@/components/Combobox";
import { CarregandoState, ErroState } from "@/components/AsyncState";
import { SemPermissao } from "@/components/SemPermissao";
import { useAuth } from "@/lib/supabase/useAuth";
import { useCombobox } from "@/lib/useCombobox";
import { useContas, useCartoes } from "@/lib/supabase/hooks";
import {
  idsTransacaoExistentes,
  criarLoteImportacao,
  inserirLancamentosEmLote,
  marcarLoteDesfeito,
  excluirLancamentosDoLote,
  criarCartao,
  atualizarConta,
} from "@/lib/supabase/queries";
import { BRL, cartaoRotulo } from "@/lib/format";
import { parseMetaCsv, LinhaCsv } from "@/lib/csvImport";

type Step = "upload" | "lendo" | "erro" | "preview" | "resultado";
type ErroInfo = {
  tipo: "invalido" | "vazio" | "conta_desconhecida";
  nome: string;
  contaId?: string;
  periodo?: string;
  rows?: LinhaCsv[];
  linhasIgnoradas?: number;
};
type Arquivo = {
  nome: string;
  contaId: string;
  contaNome: string;
  periodo: string;
  transacoes: (LinhaCsv & { nova: boolean })[];
  linhasIgnoradas: number;
};

function parseCartaoCsv(raw: string): { bandeira: string; final4: string } {
  const partes = raw.trim().split(/\s+/);
  const final4 = partes[partes.length - 1];
  const bandeira = partes.slice(0, -1).join(" ").replace("····", "").trim() || partes[0];
  return { bandeira, final4 };
}

export default function ImportarCsvPage() {
  const { isEditor, carregando: carregandoAuth } = useAuth();
  const { contas, setContas, carregando: carregandoContas, erro: erroContas, recarregar: recarregarContas } = useContas();
  const { cartoes, setCartoes, carregando: carregandoCartoes, erro: erroCartoes, recarregar: recarregarCartoes } = useCartoes();

  const contasMeta = useMemo(() => contas.filter((c) => c.plataforma === "Meta"), [contas]);
  const CONTAS_META_POR_ID = useMemo(
    () => Object.fromEntries(contasMeta.filter((c) => c.idConta).map((c) => [c.idConta, c.nome])),
    [contasMeta]
  );
  const CARTAO_NOMES = useMemo(() => cartoes.map(cartaoRotulo), [cartoes]);

  const [step, setStep] = useState<Step>("upload");
  const [nomeArquivoLendo, setNomeArquivoLendo] = useState("");
  const [erro, setErro] = useState<ErroInfo | null>(null);
  const [arquivo, setArquivo] = useState<Arquivo | null>(null);
  const [contaTrocada, setContaTrocada] = useState<string | null>(null);
  const [cadastroAberto, setCadastroAberto] = useState<string | null>(null);
  const [bandeiraEscolhida, setBandeiraEscolhida] = useState<Record<string, string>>({});
  const [mostrarImportadas, setMostrarImportadas] = useState(false);
  const [buscaImportadas, setBuscaImportadas] = useState("");
  const [contaMapeada, setContaMapeada] = useState("");
  const [resultado, setResultado] = useState<{ qtd: number; valor: string; conta: string; arquivo: string; loteId: string } | null>(null);
  const [resultadoDesfeito, setResultadoDesfeito] = useState(false);
  const [erroAcao, setErroAcao] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const nomesContasMeta = contasMeta.map((c) => c.nome);
  const mapCombo = useCombobox(nomesContasMeta, contaMapeada, (nome) => setContaMapeada(nome));
  const trocarCombo = useCombobox(nomesContasMeta, "", (nome) => setContaTrocada(nome));

  async function montarPreview(
    contaId: string,
    contaNome: string,
    periodo: string,
    rows: LinhaCsv[],
    nome: string,
    linhasIgnoradas: number
  ) {
    let existentes: Set<string>;
    try {
      existentes = await idsTransacaoExistentes(rows.map((r) => r.id));
    } catch (e) {
      setStep("erro");
      setErro({ tipo: "invalido", nome });
      setErroAcao((e as Error).message);
      return;
    }
    const transacoes = rows.map((r) => ({ ...r, nova: !existentes.has(r.id) }));
    const qtdNovas = transacoes.filter((t) => t.nova).length;
    if (qtdNovas === 0) {
      setStep("erro");
      setErro({ tipo: "vazio", nome });
      return;
    }
    setArquivo({ nome, contaId, contaNome, periodo, transacoes, linhasIgnoradas });
    setContaTrocada(null);
    setMostrarImportadas(false);
    setBuscaImportadas("");
    setStep("preview");
  }

  async function processarResultadoParse(nome: string, texto: string) {
    const r = parseMetaCsv(texto);
    if (!r.ok) {
      setStep("erro");
      setErro({ tipo: r.tipo, nome, contaId: r.contaId, periodo: r.periodo, rows: r.rows });
      return;
    }
    const contaNome = CONTAS_META_POR_ID[r.contaId];
    if (!contaNome) {
      setStep("erro");
      setErro({ tipo: "conta_desconhecida", nome, contaId: r.contaId, periodo: r.periodo, rows: r.rows, linhasIgnoradas: r.linhasIgnoradas });
      return;
    }
    await montarPreview(r.contaId, contaNome, r.periodo, r.rows, nome, r.linhasIgnoradas);
  }

  function lerArquivo(file: File) {
    setStep("lendo");
    setNomeArquivoLendo(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const texto = String(e.target?.result || "");
      setTimeout(() => processarResultadoParse(file.name, texto), 350);
    };
    reader.onerror = () => {
      setStep("erro");
      setErro({ tipo: "invalido", nome: file.name });
    };
    reader.readAsText(file);
  }

  const novas = arquivo ? arquivo.transacoes.filter((t) => t.nova) : [];
  const importadas = arquivo ? arquivo.transacoes.filter((t) => !t.nova) : [];
  const totalNovasNum = novas.reduce((s, t) => s + t.valor, 0);

  const cartaoDesconhecidoVistos = new Set<string>();
  const contagemPorCartao = new Map<string, number>();
  novas.forEach((t) => contagemPorCartao.set(t.cartao, (contagemPorCartao.get(t.cartao) || 0) + 1));

  const cartoesDesconhecidosUnicos = useMemo(() => {
    const set = new Set<string>();
    novas.forEach((t) => {
      if (!CARTAO_NOMES.includes(t.cartao)) set.add(t.cartao);
    });
    return set;
  }, [novas, CARTAO_NOMES]);

  const buscaLower = buscaImportadas.toLowerCase();
  const importadasFiltradas = buscaLower ? importadas.filter((t) => (t.data + t.id + t.cartao).toLowerCase().includes(buscaLower)) : importadas;

  async function confirmarImportacao() {
    if (!arquivo) return;
    const contaFinal = contaTrocada || arquivo.contaNome;
    try {
      const lote = await criarLoteImportacao({
        arquivoNome: arquivo.nome,
        plataforma: "Meta",
        conta: contaFinal,
        contaId: arquivo.contaId,
        periodoLabel: arquivo.periodo,
        totalLinhas: arquivo.transacoes.length,
        totalImportado: novas.length,
        totalDuplicado: importadas.length,
        valorImportado: totalNovasNum,
      });
      await inserirLancamentosEmLote(
        novas.map((t) => ({
          data: t.data,
          plataforma: "Meta",
          conta: contaFinal,
          cartao: t.cartao,
          valor: t.valor,
          origem: "csv" as const,
          idTransacaoExterna: t.id,
          loteId: lote.id,
        }))
      );
      setResultado({ qtd: novas.length, valor: BRL(totalNovasNum), conta: contaFinal, arquivo: arquivo.nome, loteId: lote.id });
      setResultadoDesfeito(false);
      setStep("resultado");
      setErroAcao(null);
    } catch (e) {
      setErroAcao((e as Error).message);
    }
  }

  async function desfazerImportacao() {
    if (!resultado) return;
    try {
      await excluirLancamentosDoLote(resultado.loteId);
      await marcarLoteDesfeito(resultado.loteId);
      setResultadoDesfeito(true);
      setStep("upload");
      setErro(null);
      setArquivo(null);
      setResultado(null);
      setErroAcao(null);
    } catch (e) {
      setErroAcao((e as Error).message);
    }
  }

  async function cadastrarCartao(chave: string, cartaoCsv: string) {
    const { bandeira, final4 } = parseCartaoCsv(cartaoCsv);
    const bandeiraFinal = bandeiraEscolhida[chave] || bandeira || "Visa";
    try {
      const criado = await criarCartao({ bandeira: bandeiraFinal, final4, apelido: "", ativa: true });
      setCartoes((cs) => [...cs, criado]);
      setCadastroAberto(null);
    } catch (e) {
      setErroAcao((e as Error).message);
    }
  }

  const passos = [
    { rotulo: "1 Upload", ativo: step === "upload" || step === "lendo" || step === "erro" },
    { rotulo: "2 Pré-visualização", ativo: step === "preview" },
    { rotulo: "3 Resultado", ativo: step === "resultado" },
  ];

  const carregandoCadastros = carregandoContas || carregandoCartoes;
  const erroCadastros = erroContas || erroCartoes;

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />

      <div className="bg-surface border-b border-border py-2.5 px-7 flex items-center gap-2">
        {passos.map((p, i) => (
          <span key={p.rotulo} className="flex items-center gap-2">
            <span
              className="font-mono text-[11px] tracking-[0.06em] uppercase"
              style={{ color: p.ativo ? "#101210" : "#B0B5AC", fontWeight: p.ativo ? 700 : 400 }}
            >
              {p.rotulo}
            </span>
            {i < passos.length - 1 && <span className="text-input-border text-[11px]">›</span>}
          </span>
        ))}
      </div>

      {erroAcao && (
        <div className="bg-danger-bg border-b border-danger-border text-danger text-[13px] py-2 px-7 flex items-center gap-3">
          {erroAcao}
          <button onClick={() => setErroAcao(null)} className="ml-auto bg-transparent border-none text-danger underline cursor-pointer">
            dispensar
          </button>
        </div>
      )}

      {carregandoCadastros || carregandoAuth ? (
        <CarregandoState />
      ) : erroCadastros ? (
        <ErroState
          mensagem={erroCadastros}
          onRetry={() => {
            recarregarContas();
            recarregarCartoes();
          }}
        />
      ) : !isEditor ? (
        <SemPermissao />
      ) : (
      <>
      {step === "upload" && (
        <div className="flex-1 flex items-center justify-center py-16 px-7">
          <div className="max-w-[560px] w-full flex flex-col gap-4">
            <div className="text-center flex flex-col gap-1.5">
              <h1 className="font-heading text-[22px] font-bold m-0">Importar faturamento da Meta</h1>
              <p className="m-0 text-[13.5px] text-text-muted text-pretty">
                Exporte o relatório de cobrança no Gerenciador de Anúncios e arraste o CSV aqui.
              </p>
            </div>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files?.[0];
                if (f) lerArquivo(f);
              }}
              onClick={() => inputRef.current?.click()}
              className="cursor-pointer bg-surface border-2 border-dashed border-input-border rounded-card py-10 px-6 flex flex-col items-center gap-3 text-center"
            >
              <div className="w-9 h-[3px] bg-lima-ui rounded-[2px]" />
              <span className="font-heading text-[15px] font-bold">Arraste o CSV aqui</span>
              <span className="text-[13px] text-text-faint">ou clique para selecionar o arquivo</span>
              <input
                ref={inputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) lerArquivo(f);
                }}
              />
            </div>
            <span className="text-[12px] text-text-faint-2 text-center">
              Aceita o relatório de cobrança da Meta (Data, ID da transação, Forma de pagamento, Valor, Moeda). Não fazemos
              leitura por conta/cliente dentro do Meta nesta versão.
            </span>
          </div>
        </div>
      )}

      {step === "lendo" && (
        <div className="flex-1 flex items-center justify-center py-16 px-7">
          <div className="flex flex-col items-center gap-2.5">
            <div className="w-[220px] h-2 bg-[#E4E7E1] rounded-[4px] overflow-hidden">
              <div className="w-3/5 h-full bg-ink animate-rtpulse" />
            </div>
            <span className="font-mono text-[13px] text-text-muted">Lendo {nomeArquivoLendo}…</span>
          </div>
        </div>
      )}

      {step === "erro" && erro && (
        <div className="flex-1 flex items-center justify-center py-16 px-7">
          <div className="max-w-[520px] w-full flex flex-col gap-3.5 bg-surface border border-danger-border border-l-4 border-l-danger-strong rounded-card py-[22px] px-6">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[11px] text-text-faint-2">{erro.nome}</span>
              <h2 className="font-heading text-[18px] font-bold m-0 text-danger">
                {erro.tipo === "invalido" && "Esse arquivo não parece ser um relatório de cobrança da Meta"}
                {erro.tipo === "vazio" && "Nenhuma transação nova encontrada nesse arquivo"}
                {erro.tipo === "conta_desconhecida" && "Nenhuma conta cadastrada usa este ID"}
              </h2>
            </div>
            <p className="m-0 text-[14px] leading-relaxed text-[#3A423C]">
              {erro.tipo === "invalido" &&
                "Exporte o relatório de cobrança pelo Gerenciador de Anúncios da Meta (menu Faturamento → Exportar) e tente novamente."}
              {erro.tipo === "vazio" &&
                "O cabeçalho é válido, mas todas as transações do arquivo já foram importadas anteriormente (ou não há linhas de cobrança na tabela)."}
              {erro.tipo === "conta_desconhecida" &&
                `ID ${erro.contaId} não corresponde a nenhuma conta Meta cadastrada. Associe manualmente ou cadastre o ID em Cadastros.`}
            </p>

            {erro.tipo === "conta_desconhecida" && (
              <div className="flex flex-col gap-2 bg-[#F7F8F5] rounded-sm p-3.5 relative">
                <span className="font-mono text-[11px] tracking-[0.08em] uppercase text-[#5C665E]">Associar a uma conta cadastrada</span>
                <Combobox combo={mapCombo} placeholder="Buscar conta…" />
                <span className="text-[11px] text-text-faint">Isso salva o ID nessa conta — da próxima vez o reconhecimento é automático.</span>
                <button
                  disabled={!contaMapeada}
                  onClick={async () => {
                    if (!erro.rows || !erro.contaId) return;
                    const conta = contasMeta.find((c) => c.nome === contaMapeada);
                    try {
                      if (conta && conta.idConta !== erro.contaId) {
                        const atualizado = await atualizarConta({ ...conta, idConta: erro.contaId });
                        setContas((cs) => cs.map((x) => (x.id === atualizado.id ? atualizado : x)));
                      }
                    } catch (e) {
                      setErroAcao((e as Error).message);
                    }
                    await montarPreview(erro.contaId, contaMapeada, erro.periodo || "—", erro.rows, erro.nome, erro.linhasIgnoradas || 0);
                    setContaMapeada("");
                  }}
                  className="self-start font-body text-[13.5px] font-bold bg-ink text-text-on-dark border-none rounded-btn py-2 px-4 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Continuar com esta conta
                </button>
              </div>
            )}

            <div className="flex gap-2.5">
              <button
                onClick={() => {
                  setStep("upload");
                  setErro(null);
                }}
                className="font-body text-[13.5px] bg-surface border border-input-border rounded-btn py-2 px-4 cursor-pointer whitespace-nowrap"
              >
                Voltar e trocar arquivo
              </button>
            </div>
          </div>
        </div>
      )}

      {step === "preview" && arquivo && (
        <div className="py-6 px-7 pb-[100px] flex flex-col gap-[18px] max-w-[1040px] mx-auto w-full">
          <div className="flex items-baseline justify-between flex-wrap gap-2">
            <div className="flex flex-col gap-0.5">
              <h1 className="font-heading text-[19px] font-bold m-0">{arquivo.nome}</h1>
              <span className="font-mono text-[12px] text-text-faint">Período do relatório: {arquivo.periodo}</span>
              {arquivo.linhasIgnoradas > 0 && (
                <span className="font-mono text-[11.5px] text-text-faint-2">
                  {arquivo.linhasIgnoradas} linha{arquivo.linhasIgnoradas > 1 ? "s" : ""} de crédito Meta ignorada
                  {arquivo.linhasIgnoradas > 1 ? "s" : ""} (não é cobrança de cartão)
                </span>
              )}
            </div>
            <button
              onClick={() => {
                setStep("upload");
                setArquivo(null);
              }}
              className="font-body text-[13px] bg-transparent border-none text-text-muted underline cursor-pointer"
            >
              trocar arquivo
            </button>
          </div>

          <div className="bg-surface border border-border rounded-card py-3.5 px-[18px] flex items-center gap-4 flex-wrap relative">
            <span className="font-mono text-[10.5px] tracking-[0.1em] uppercase bg-success-bg text-success rounded-[3px] py-1 px-2 whitespace-nowrap">
              Conta reconhecida
            </span>
            <div className="flex flex-col gap-0.5">
              <span className="text-[14.5px] font-medium">{contaTrocada || arquivo.contaNome}</span>
              <span className="font-mono text-[11.5px] text-text-faint">ID {arquivo.contaId}</span>
            </div>
            <div className="ml-auto w-[220px]">
              <Combobox combo={trocarCombo} placeholder="Trocar conta…" />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 bg-surface border border-border rounded-card overflow-hidden">
            <div className="py-4 px-[18px] border-r border-divider">
              <div className="font-mono text-[10.5px] tracking-[0.1em] uppercase text-text-faint">Transações</div>
              <div className="font-mono font-semibold text-[22px] tabular-nums">{arquivo.transacoes.length}</div>
            </div>
            <div className="py-4 px-[18px] border-r border-divider">
              <div className="font-mono text-[10.5px] tracking-[0.1em] uppercase text-text-faint">Já importadas</div>
              <div className="font-mono font-semibold text-[22px] tabular-nums text-text-faint-2">{importadas.length}</div>
            </div>
            <div className="py-4 px-[18px] border-r border-divider">
              <div className="font-mono text-[10.5px] tracking-[0.1em] uppercase text-text-faint">Novas</div>
              <div className="font-mono font-semibold text-[22px] tabular-nums">{novas.length}</div>
            </div>
            <div className="py-4 px-[18px]">
              <div className="font-mono text-[10.5px] tracking-[0.1em] uppercase text-text-faint">A adicionar</div>
              <div className="font-display text-[30px] tabular-nums text-[#8A6D00] whitespace-nowrap tracking-[0.01em]">{BRL(totalNovasNum)}</div>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-card overflow-hidden">
            <div className="flex font-mono text-[10.5px] tracking-[0.08em] uppercase text-text-faint py-2.5 px-[18px] border-b border-divider">
              <span className="w-[88px] shrink-0">Data</span>
              <span className="flex-1 min-w-0">ID da transação</span>
              <span className="w-[150px] shrink-0">Cartão</span>
              <span className="w-[110px] shrink-0 text-right">Valor</span>
            </div>
            {novas.map((t, idx) => {
              const desconhecido = !CARTAO_NOMES.includes(t.cartao);
              const jaVisto = cartaoDesconhecidoVistos.has(t.cartao);
              const primeiraOcorrencia = desconhecido && !jaVisto;
              if (desconhecido) cartaoDesconhecidoVistos.add(t.cartao);
              const chave = "cad_" + t.cartao;
              return (
                <div key={t.id + idx}>
                  <div className="flex items-center py-2.5 px-[18px] border-b border-[#F6F7F4] border-l-[3px] border-l-lima-ui bg-[#FFFDF0]">
                    <span className="font-mono text-[12.5px] w-[88px] shrink-0">{t.data}</span>
                    <span className="font-mono text-[11.5px] text-text-faint flex-1 min-w-0 truncate">{t.id}</span>
                    <span className="w-[150px] shrink-0 font-mono text-[12.5px] whitespace-nowrap">{t.cartao}</span>
                    <span className="font-mono text-[13.5px] font-medium w-[110px] shrink-0 text-right tabular-nums">{BRL(t.valor)}</span>
                  </div>
                  {primeiraOcorrencia && (
                    <div className="py-0 px-[18px] pl-[88px] pb-2.5 bg-[#FFFDF0] border-b border-[#F6F7F4]">
                      {cadastroAberto === chave ? (
                        <div className="flex items-center gap-2 flex-wrap bg-surface border border-warning-border rounded-sm py-2.5 px-3">
                          <span className="text-[12.5px] text-warning">Cadastrar {t.cartao} como</span>
                          <select
                            value={bandeiraEscolhida[chave] || parseCartaoCsv(t.cartao).bandeira}
                            onChange={(e) => setBandeiraEscolhida((b) => ({ ...b, [chave]: e.target.value }))}
                            className="text-[13px] py-1.5 px-2 border border-input-border rounded-sm"
                          >
                            <option value="Visa">Visa</option>
                            <option value="MasterCard">MasterCard</option>
                            <option value="Amex">Amex</option>
                            <option value="Elo">Elo</option>
                          </select>
                          <button
                            onClick={() => cadastrarCartao(chave, t.cartao)}
                            className="font-body text-[12.5px] font-bold bg-ink text-text-on-dark border-none rounded-btn py-1.5 px-3 cursor-pointer whitespace-nowrap"
                          >
                            Cadastrar · aplica a {contagemPorCartao.get(t.cartao) || 1} iguais
                          </button>
                          <button onClick={() => setCadastroAberto(null)} className="font-body text-[12.5px] bg-transparent border-none text-text-faint cursor-pointer">
                            cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setCadastroAberto(chave)}
                          className="font-mono text-[11.5px] bg-surface border border-warning-border text-warning rounded-pill py-1 px-2.5 cursor-pointer"
                        >
                          cartão não cadastrado · cadastrar ({contagemPorCartao.get(t.cartao) || 1}×)
                        </button>
                      )}
                    </div>
                  )}
                  {desconhecido && !primeiraOcorrencia && (
                    <div className="py-0 px-[18px] pl-[88px] pb-2.5 bg-[#FFFDF0] border-b border-[#F6F7F4]">
                      <span className="font-mono text-[11px] text-[#B0A15C]">cadastro pendente · veja a primeira ocorrência acima</span>
                    </div>
                  )}
                </div>
              );
            })}

            <button
              onClick={() => setMostrarImportadas((v) => !v)}
              className="w-full text-left bg-[#FAFBF8] border-none border-t border-divider py-2.5 px-[18px] text-[13px] cursor-pointer text-text-muted"
            >
              {mostrarImportadas ? "Ocultar" : "Mostrar"} as {importadas.length} já importadas
            </button>
            {mostrarImportadas && (
              <>
                <div className="py-2.5 px-[18px] border-b border-divider bg-[#FAFBF8]">
                  <input
                    value={buscaImportadas}
                    onChange={(e) => setBuscaImportadas(e.target.value)}
                    placeholder="Buscar por data, cartão ou ID…"
                    className="w-full text-[13px] py-2 px-2.5 border border-input-border rounded-sm bg-surface box-border"
                  />
                </div>
                {importadasFiltradas.map((t, idx) => (
                  <div key={t.id + idx} className="flex items-center py-2 px-[18px] border-b border-[#F6F7F4] text-[#9AA29B]">
                    <span className="font-mono text-[12px] w-[88px] shrink-0">{t.data}</span>
                    <span className="font-mono text-[11.5px] flex-1 min-w-0 truncate">{t.id}</span>
                    <span className="font-mono text-[12px] w-[150px] shrink-0 whitespace-nowrap">{t.cartao}</span>
                    <span className="font-mono text-[13px] w-[110px] shrink-0 text-right tabular-nums">{BRL(t.valor)}</span>
                  </div>
                ))}
                {buscaLower && importadasFiltradas.length === 0 && (
                  <div className="py-3 px-[18px] text-[12.5px] text-text-faint-2">Nenhuma transação importada corresponde à busca.</div>
                )}
              </>
            )}
          </div>

          <div className="fixed left-0 right-0 bottom-0 bg-surface border-t border-border py-3.5 px-7 flex items-center justify-center gap-3 z-10">
            <div className="max-w-[1040px] w-full flex items-center gap-3">
              <button
                onClick={() => {
                  setStep("upload");
                  setArquivo(null);
                }}
                className="font-body text-[14px] bg-surface border border-input-border rounded-btn py-2.5 px-5 cursor-pointer whitespace-nowrap"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarImportacao}
                disabled={cartoesDesconhecidosUnicos.size > 0}
                title={
                  cartoesDesconhecidosUnicos.size > 0
                    ? "Cadastre (ou associe) todos os cartões não reconhecidos antes de confirmar"
                    : undefined
                }
                className="ml-auto font-body text-[14px] font-bold bg-lima-ui text-ink border-none rounded-btn py-2.5 px-[22px] cursor-pointer whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {cartoesDesconhecidosUnicos.size > 0
                  ? `Cadastre ${cartoesDesconhecidosUnicos.size} cartão${cartoesDesconhecidosUnicos.size > 1 ? "ões" : ""} pra continuar`
                  : `Confirmar importação · ${novas.length} novas`}
              </button>
            </div>
          </div>
        </div>
      )}

      {step === "resultado" && resultado && (
        <div className="flex-1 flex items-center justify-center py-16 px-7">
          <div className="max-w-[480px] w-full flex flex-col gap-4 bg-surface border border-border rounded-card py-7 px-[26px]">
            <span className="font-mono text-[11px] tracking-[0.1em] uppercase text-success">Importação concluída</span>
            <h1 className="font-heading text-[22px] font-bold m-0">{resultado.qtd} transações novas importadas</h1>
            <div className="font-display text-[38px] tabular-nums">{resultado.valor}</div>
            <div className="text-[13.5px] text-text-muted">
              {resultado.conta} · {resultado.arquivo}
            </div>
            <div className="flex gap-2.5 border-t border-divider pt-4 flex-wrap">
              <button
                onClick={desfazerImportacao}
                className="font-body text-[13.5px] font-bold bg-surface border border-danger-strong text-danger rounded-btn py-2.5 px-4 cursor-pointer whitespace-nowrap"
              >
                Desfazer importação
              </button>
              <button
                onClick={() => {
                  setStep("upload");
                  setErro(null);
                  setArquivo(null);
                  setResultadoDesfeito(false);
                  setResultado(null);
                }}
                className="font-body text-[13.5px] bg-surface border border-input-border rounded-btn py-2.5 px-4 cursor-pointer whitespace-nowrap"
              >
                Importar outro arquivo
              </button>
              <Link
                href="/"
                className="font-body text-[13.5px] font-bold bg-ink text-text-on-dark rounded-btn py-2.5 px-4 no-underline whitespace-nowrap"
              >
                Ir para a Visão geral
              </Link>
            </div>
            {resultadoDesfeito && (
              <div className="text-[12.5px] text-success bg-success-bg rounded-[5px] py-2 px-2.5">
                Importação desfeita — nenhuma transação foi adicionada ao fechamento.
              </div>
            )}
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}
