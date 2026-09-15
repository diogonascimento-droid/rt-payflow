"use client";

import { UsePeriodReturn } from "@/lib/usePeriod";

export function PeriodPicker({
  period,
  variant = "dark",
  align = "left",
}: {
  period: UsePeriodReturn;
  variant?: "dark" | "light";
  align?: "left" | "right";
}) {
  return (
    <div className="relative">
      <button
        onClick={period.abrir}
        className={
          "flex items-center gap-2 font-mono text-[12.5px] rounded-btn px-3.5 py-2 cursor-pointer whitespace-nowrap " +
          (variant === "dark" ? "bg-ink-2 text-text-on-dark" : "bg-[#F1F3EE] text-text-body border border-[#DCE0D9]")
        }
      >
        {period.rotulo}
      </button>
      {period.aberto && (
        <>
          <div onClick={period.fechar} className="fixed inset-0 z-[39]" />
          <div
            className={
              "absolute top-11 z-40 bg-surface text-text-body border border-input-border rounded-card shadow-[0_16px_34px_rgba(16,18,16,0.22)] p-3.5 flex gap-4 " +
              (align === "right" ? "right-0" : "left-0")
            }
          >
            <div className="flex flex-col gap-1 pr-3.5 border-r border-[#E7EAE5] min-w-[118px]">
              <span className="font-mono text-[10px] tracking-[0.08em] uppercase text-text-faint-2 mb-1">Atalhos</span>
              <button onClick={period.mesAtual} className="text-left text-[13px] bg-transparent border-none py-1.5 px-1.5 rounded-[5px] cursor-pointer hover:bg-workspace">
                Mês atual
              </button>
              <button onClick={period.mesPassado} className="text-left text-[13px] bg-transparent border-none py-1.5 px-1.5 rounded-[5px] cursor-pointer hover:bg-workspace">
                Mês passado
              </button>
              <button onClick={period.esteAno} className="text-left text-[13px] bg-transparent border-none py-1.5 px-1.5 rounded-[5px] cursor-pointer hover:bg-workspace">
                Este ano
              </button>
              {period.temDatasDisponiveis && (
                <button onClick={period.periodoTotal} className="text-left text-[13px] bg-transparent border-none py-1.5 px-1.5 rounded-[5px] cursor-pointer hover:bg-workspace">
                  Período total
                </button>
              )}
            </div>
            <div className="flex flex-col gap-2 w-[238px]">
              <div className="flex items-center justify-between">
                <button onClick={period.mesAnterior} className="text-[15px] bg-transparent border-none cursor-pointer text-text-muted px-2 py-0.5">
                  ‹
                </button>
                <span className="font-heading text-[13px] font-bold">{period.calLabel}</span>
                <button onClick={period.mesProximo} className="text-[15px] bg-transparent border-none cursor-pointer text-text-muted px-2 py-0.5">
                  ›
                </button>
              </div>
              <div className="grid grid-cols-7 gap-0.5 font-mono text-[10px] text-text-faint-2 text-center">
                <span>S</span><span>T</span><span>Q</span><span>Q</span><span>S</span><span>S</span><span>D</span>
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {period.celulas.map((c, i) =>
                  c.vazio ? (
                    <span key={i} />
                  ) : (
                    <button
                      key={i}
                      onClick={() => c.data && period.selecionarData(c.data)}
                      className="font-mono text-[12px] py-1.5 border-none rounded-[4px] cursor-pointer"
                      style={{
                        background: c.selecionado ? "#101210" : c.emIntervalo ? "#EDEFEA" : "transparent",
                        color: c.selecionado ? "#F2F4F0" : "#1F2320",
                      }}
                    >
                      {c.dia}
                    </button>
                  )
                )}
              </div>
              <div className="flex items-center justify-between mt-1 border-t border-[#E7EAE5] pt-2.5">
                <span className="font-mono text-[11px] text-text-muted">{period.rotuloSelecao}</span>
                <button onClick={period.aplicar} className="font-body text-[12.5px] font-bold bg-ink text-text-on-dark border-none rounded-[6px] px-3.5 py-1.5 cursor-pointer">
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
