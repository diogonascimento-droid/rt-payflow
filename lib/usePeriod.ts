"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { fmtData, mesmoDia, MESES, parseBR } from "./format";

const HOJE = new Date();

export type PeriodoCelula = {
  vazio: boolean;
  dia?: number;
  selecionado?: boolean;
  emIntervalo?: boolean;
  data?: Date;
};

function gradeDoMes(mesExibido: Date): (Date | null)[] {
  const ano = mesExibido.getFullYear();
  const mes = mesExibido.getMonth();
  const offset = (new Date(ano, mes, 1).getDay() + 6) % 7;
  const ultimoDia = new Date(ano, mes + 1, 0).getDate();
  const celulas: (Date | null)[] = [];
  for (let i = 0; i < offset; i++) celulas.push(null);
  for (let d = 1; d <= ultimoDia; d++) celulas.push(new Date(ano, mes, d));
  while (celulas.length < 42) celulas.push(null);
  return celulas;
}

export function usePeriod(inicial?: { inicio: Date; fim: Date }, datasDisponiveis?: string[]) {
  const inicioPadrao = inicial?.inicio ?? new Date(HOJE.getFullYear(), HOJE.getMonth(), 1);
  const fimPadrao = inicial?.fim ?? new Date(HOJE.getFullYear(), HOJE.getMonth() + 1, 0);

  const [aberto, setAberto] = useState(false);
  const [periodoInicio, setPeriodoInicio] = useState(inicioPadrao);
  const [periodoFim, setPeriodoFim] = useState(fimPadrao);
  const [calInicio, setCalInicio] = useState<Date | null>(inicioPadrao);
  const [calFim, setCalFim] = useState<Date | null>(fimPadrao);
  const [calMesExibido, setCalMesExibido] = useState(new Date(inicioPadrao.getFullYear(), inicioPadrao.getMonth(), 1));

  const abrir = useCallback(() => {
    setCalInicio(periodoInicio);
    setCalFim(periodoFim);
    setCalMesExibido(new Date(periodoInicio.getFullYear(), periodoInicio.getMonth(), 1));
    setAberto(true);
  }, [periodoInicio, periodoFim]);

  const fechar = useCallback(() => setAberto(false), []);

  const selecionarData = useCallback(
    (d: Date) => {
      if (!calInicio || (calInicio && calFim)) {
        setCalInicio(d);
        setCalFim(null);
        return;
      }
      if (d < calInicio) {
        setCalFim(calInicio);
        setCalInicio(d);
      } else {
        setCalFim(d);
      }
    },
    [calInicio, calFim]
  );

  const definirIntervalo = useCallback((inicio: Date, fim: Date, fecharDepois: boolean) => {
    setPeriodoInicio(inicio);
    setPeriodoFim(fim);
    setCalInicio(inicio);
    setCalFim(fim);
    setCalMesExibido(new Date(inicio.getFullYear(), inicio.getMonth(), 1));
    if (fecharDepois) setAberto(false);
  }, []);

  const aplicar = useCallback(() => {
    const ini = calInicio ?? periodoInicio;
    const fim = calFim ?? ini;
    definirIntervalo(ini < fim ? ini : fim, ini < fim ? fim : ini, true);
  }, [calInicio, calFim, periodoInicio, definirIntervalo]);

  const periodoTotal = useCallback(() => {
    if (!datasDisponiveis || datasDisponiveis.length === 0) return;
    const datas = datasDisponiveis.map(parseBR);
    const min = datas.reduce((m, d) => (d < m ? d : m), datas[0]);
    const max = datas.reduce((m, d) => (d > m ? d : m), datas[0]);
    definirIntervalo(min, max, true);
  }, [datasDisponiveis, definirIntervalo]);

  const ajustouAutomaticamente = useRef(false);
  useEffect(() => {
    if (ajustouAutomaticamente.current || inicial) return;
    if (!datasDisponiveis || datasDisponiveis.length === 0) return;
    ajustouAutomaticamente.current = true;
    const maisRecente = datasDisponiveis.reduce(
      (max, s) => (parseBR(s) > max ? parseBR(s) : max),
      parseBR(datasDisponiveis[0])
    );
    definirIntervalo(
      new Date(maisRecente.getFullYear(), maisRecente.getMonth(), 1),
      new Date(maisRecente.getFullYear(), maisRecente.getMonth() + 1, 0),
      false
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datasDisponiveis]);

  const celulas = useMemo(
    () =>
      gradeDoMes(calMesExibido).map((d): PeriodoCelula => {
        if (!d) return { vazio: true };
        return {
          vazio: false,
          dia: d.getDate(),
          selecionado: mesmoDia(d, calInicio) || mesmoDia(d, calFim),
          emIntervalo: !!(calInicio && calFim && d > calInicio && d < calFim),
          data: d,
        };
      }),
    [calMesExibido, calInicio, calFim]
  );

  return {
    aberto,
    abrir,
    fechar,
    periodoInicio,
    periodoFim,
    rotulo: fmtData(periodoInicio) + " – " + fmtData(periodoFim),
    calLabel: MESES[calMesExibido.getMonth()] + " " + calMesExibido.getFullYear(),
    celulas,
    rotuloSelecao:
      calInicio && calFim
        ? fmtData(calInicio) + " – " + fmtData(calFim)
        : calInicio
        ? "Selecione a data final"
        : "Selecione a data inicial",
    selecionarData,
    mesAnterior: () => setCalMesExibido((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1)),
    mesProximo: () => setCalMesExibido((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1)),
    mesAtual: () => definirIntervalo(new Date(HOJE.getFullYear(), HOJE.getMonth(), 1), new Date(HOJE.getFullYear(), HOJE.getMonth() + 1, 0), true),
    mesPassado: () => definirIntervalo(new Date(HOJE.getFullYear(), HOJE.getMonth() - 1, 1), new Date(HOJE.getFullYear(), HOJE.getMonth(), 0), true),
    esteAno: () => definirIntervalo(new Date(HOJE.getFullYear(), 0, 1), new Date(HOJE.getFullYear(), 11, 31), true),
    periodoTotal,
    temDatasDisponiveis: !!datasDisponiveis && datasDisponiveis.length > 0,
    aplicar,
  };
}

export type UsePeriodReturn = ReturnType<typeof usePeriod>;
