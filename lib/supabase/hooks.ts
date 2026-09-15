"use client";

import { useCallback, useEffect, useState } from "react";
import { Lancamento, ContaCadastro, CartaoCadastro, PlataformaCadastro } from "@/lib/types";
import { listarLancamentos, listarContas, listarCartoes, listarPlataformas } from "./queries";

function useSupabaseList<T>(fetcher: () => Promise<T[]>) {
  const [dados, setDados] = useState<T[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const recarregar = useCallback(() => {
    setCarregando(true);
    setErro(null);
    fetcher()
      .then((d) => setDados(d))
      .catch((e: Error) => setErro(e.message))
      .finally(() => setCarregando(false));
  }, [fetcher]);

  useEffect(() => {
    recarregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { dados, setDados, carregando, erro, recarregar };
}

export function useLancamentos() {
  const r = useSupabaseList<Lancamento>(listarLancamentos);
  return { lancamentos: r.dados, setLancamentos: r.setDados, carregando: r.carregando, erro: r.erro, recarregar: r.recarregar };
}

export function useContas() {
  const r = useSupabaseList<ContaCadastro>(listarContas);
  return { contas: r.dados, setContas: r.setDados, carregando: r.carregando, erro: r.erro, recarregar: r.recarregar };
}

export function useCartoes() {
  const r = useSupabaseList<CartaoCadastro>(listarCartoes);
  return { cartoes: r.dados, setCartoes: r.setDados, carregando: r.carregando, erro: r.erro, recarregar: r.recarregar };
}

export function usePlataformas() {
  const r = useSupabaseList<PlataformaCadastro>(listarPlataformas);
  return { plataformas: r.dados, setPlataformas: r.setDados, carregando: r.carregando, erro: r.erro, recarregar: r.recarregar };
}

/** Conta quantos lançamentos usam cada valor de `conta` / `cartao` (pra bloquear exclusão em Cadastros). */
export function contarUso(lancamentos: Lancamento[]) {
  const porConta = new Map<string, number>();
  const porCartao = new Map<string, number>();
  lancamentos.forEach((l) => {
    porConta.set(l.conta, (porConta.get(l.conta) || 0) + 1);
    porCartao.set(l.cartao, (porCartao.get(l.cartao) || 0) + 1);
  });
  return { porConta, porCartao };
}
