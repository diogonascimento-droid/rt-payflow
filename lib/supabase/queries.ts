import { supabase } from "./client";
import {
  rowToLancamento, rowToConta, rowToCartao, rowToPlataforma, rowToLote,
  brParaIso, LancamentoRow, ContaRow, CartaoRow, PlataformaRow, LoteRow,
} from "./mappers";
import { Lancamento, ContaCadastro, CartaoCadastro, PlataformaCadastro, LoteImportacao } from "@/lib/types";

function falhar(acao: string, error: { message: string }): never {
  throw new Error(`${acao}: ${error.message}`);
}

// ---------- Lançamentos ----------

export async function listarLancamentos(): Promise<Lancamento[]> {
  const { data, error } = await supabase.from("lancamentos").select("*").order("data", { ascending: false });
  if (error) falhar("Não foi possível carregar os lançamentos", error);
  return (data as LancamentoRow[]).map(rowToLancamento);
}

export async function criarLancamento(l: Omit<Lancamento, "id">): Promise<Lancamento> {
  const { data, error } = await supabase
    .from("lancamentos")
    .insert({
      data: brParaIso(l.data),
      plataforma: l.plataforma,
      conta: l.conta,
      cartao: l.cartao,
      valor: l.valor,
      origem: l.origem,
      obs: l.obs || null,
      id_transacao_externa: l.idTransacaoExterna || null,
      lote_id: l.loteId || null,
    })
    .select()
    .single();
  if (error) falhar("Não foi possível registrar o lançamento", error);
  return rowToLancamento(data as LancamentoRow);
}

export async function atualizarLancamento(l: Lancamento): Promise<Lancamento> {
  const { data, error } = await supabase
    .from("lancamentos")
    .update({
      data: brParaIso(l.data),
      plataforma: l.plataforma,
      conta: l.conta,
      cartao: l.cartao,
      valor: l.valor,
      obs: l.obs || null,
    })
    .eq("id", l.id)
    .select()
    .single();
  if (error) falhar("Não foi possível salvar as alterações", error);
  return rowToLancamento(data as LancamentoRow);
}

export async function excluirLancamentos(ids: string[]): Promise<void> {
  const { error } = await supabase.from("lancamentos").delete().in("id", ids);
  if (error) falhar("Não foi possível excluir", error);
}

/** IDs de transação externa já existentes no banco, restritos aos que vieram no CSV (evita baixar a tabela toda). */
export async function idsTransacaoExistentes(ids: string[]): Promise<Set<string>> {
  if (ids.length === 0) return new Set();
  const { data, error } = await supabase
    .from("lancamentos")
    .select("id_transacao_externa")
    .in("id_transacao_externa", ids);
  if (error) falhar("Não foi possível checar duplicidade", error);
  return new Set((data as { id_transacao_externa: string }[]).map((r) => r.id_transacao_externa));
}

export async function inserirLancamentosEmLote(
  linhas: Omit<Lancamento, "id">[]
): Promise<Lancamento[]> {
  if (linhas.length === 0) return [];
  const { data, error } = await supabase
    .from("lancamentos")
    .insert(
      linhas.map((l) => ({
        data: brParaIso(l.data),
        plataforma: l.plataforma,
        conta: l.conta,
        cartao: l.cartao,
        valor: l.valor,
        origem: l.origem,
        obs: l.obs || null,
        id_transacao_externa: l.idTransacaoExterna || null,
        lote_id: l.loteId || null,
      }))
    )
    .select();
  if (error) falhar("Não foi possível importar as transações", error);
  return (data as LancamentoRow[]).map(rowToLancamento);
}

// ---------- Contas ----------

export async function listarContas(): Promise<ContaCadastro[]> {
  const { data, error } = await supabase.from("contas").select("*").order("nome");
  if (error) falhar("Não foi possível carregar as contas", error);
  return (data as ContaRow[]).map((r) => rowToConta(r));
}

export async function criarConta(c: Omit<ContaCadastro, "id" | "qtdLancamentos">): Promise<ContaCadastro> {
  const { data, error } = await supabase
    .from("contas")
    .insert({ nome: c.nome, plataforma: c.plataforma, cliente: c.cliente, id_conta: c.idConta, ativa: c.ativa })
    .select()
    .single();
  if (error) falhar("Não foi possível criar a conta", error);
  return rowToConta(data as ContaRow);
}

export async function atualizarConta(c: ContaCadastro): Promise<ContaCadastro> {
  const { data, error } = await supabase
    .from("contas")
    .update({ nome: c.nome, plataforma: c.plataforma, cliente: c.cliente, id_conta: c.idConta, ativa: c.ativa })
    .eq("id", c.id)
    .select()
    .single();
  if (error) falhar("Não foi possível salvar a conta", error);
  return rowToConta(data as ContaRow, c.qtdLancamentos);
}

export async function excluirConta(id: string): Promise<void> {
  const { error } = await supabase.from("contas").delete().eq("id", id);
  if (error) falhar("Não foi possível excluir a conta", error);
}

// ---------- Cartões ----------

export async function listarCartoes(): Promise<CartaoCadastro[]> {
  const { data, error } = await supabase.from("cartoes").select("*").order("bandeira");
  if (error) falhar("Não foi possível carregar os cartões", error);
  return (data as CartaoRow[]).map((r) => rowToCartao(r));
}

export async function criarCartao(c: Omit<CartaoCadastro, "id" | "qtdLancamentos">): Promise<CartaoCadastro> {
  const { data, error } = await supabase
    .from("cartoes")
    .insert({
      bandeira: c.bandeira, final4: c.final4, apelido: c.apelido,
      fechamento: c.fechamento ?? null, vencimento: c.vencimento ?? null, ativa: c.ativa,
    })
    .select()
    .single();
  if (error) falhar("Não foi possível criar o cartão", error);
  return rowToCartao(data as CartaoRow);
}

export async function atualizarCartao(c: CartaoCadastro): Promise<CartaoCadastro> {
  const { data, error } = await supabase
    .from("cartoes")
    .update({
      bandeira: c.bandeira, final4: c.final4, apelido: c.apelido,
      fechamento: c.fechamento ?? null, vencimento: c.vencimento ?? null, ativa: c.ativa,
    })
    .eq("id", c.id)
    .select()
    .single();
  if (error) falhar("Não foi possível salvar o cartão", error);
  return rowToCartao(data as CartaoRow, c.qtdLancamentos);
}

export async function excluirCartao(id: string): Promise<void> {
  const { error } = await supabase.from("cartoes").delete().eq("id", id);
  if (error) falhar("Não foi possível excluir o cartão", error);
}

// ---------- Plataformas ----------

export async function listarPlataformas(): Promise<PlataformaCadastro[]> {
  const { data, error } = await supabase.from("plataformas").select("*").order("nome");
  if (error) falhar("Não foi possível carregar as plataformas", error);
  return (data as PlataformaRow[]).map(rowToPlataforma);
}

export async function criarPlataforma(p: Omit<PlataformaCadastro, "id">): Promise<PlataformaCadastro> {
  const { data, error } = await supabase.from("plataformas").insert({ nome: p.nome, ativa: p.ativa }).select().single();
  if (error) falhar("Não foi possível criar a plataforma", error);
  return rowToPlataforma(data as PlataformaRow);
}

export async function atualizarPlataforma(p: PlataformaCadastro): Promise<PlataformaCadastro> {
  const { data, error } = await supabase
    .from("plataformas")
    .update({ nome: p.nome, ativa: p.ativa })
    .eq("id", p.id)
    .select()
    .single();
  if (error) falhar("Não foi possível salvar a plataforma", error);
  return rowToPlataforma(data as PlataformaRow);
}

export async function excluirPlataforma(id: string): Promise<void> {
  const { error } = await supabase.from("plataformas").delete().eq("id", id);
  if (error) falhar("Não foi possível excluir a plataforma", error);
}

// ---------- Lotes de importação ----------

export async function criarLoteImportacao(l: Omit<LoteImportacao, "id" | "criadoEm">): Promise<LoteImportacao> {
  const { data, error } = await supabase
    .from("lotes_importacao")
    .insert({
      arquivo_nome: l.arquivoNome,
      plataforma: l.plataforma,
      conta: l.conta,
      conta_id: l.contaId,
      periodo_label: l.periodoLabel,
      total_linhas: l.totalLinhas,
      total_importado: l.totalImportado,
      total_duplicado: l.totalDuplicado,
      valor_importado: l.valorImportado,
      desfeito: l.desfeito ?? false,
    })
    .select()
    .single();
  if (error) falhar("Não foi possível registrar o lote de importação", error);
  return rowToLote(data as LoteRow);
}

export async function marcarLoteDesfeito(id: string): Promise<void> {
  const { error } = await supabase.from("lotes_importacao").update({ desfeito: true }).eq("id", id);
  if (error) falhar("Não foi possível desfazer a importação", error);
}

export async function excluirLancamentosDoLote(loteId: string): Promise<void> {
  const { error } = await supabase.from("lancamentos").delete().eq("lote_id", loteId);
  if (error) falhar("Não foi possível remover os lançamentos do lote", error);
}
