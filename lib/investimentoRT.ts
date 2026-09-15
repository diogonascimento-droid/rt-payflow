export const TAG_INVESTIMENTO_RT = "Investimento RT";

/** A planilha original usa "Investimento RT" como texto livre na observação (sem #). */
export function temTagInvestimentoRT(obs?: string | null): boolean {
  return !!obs && obs.toLowerCase().includes("investimento rt");
}
