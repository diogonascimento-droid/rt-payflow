export function CarregandoState({ linhas = 6 }: { linhas?: number }) {
  return (
    <div className="p-7 flex flex-col gap-2">
      {Array.from({ length: linhas }).map((_, i) => (
        <div key={i} className="h-9 bg-surface border border-border rounded-sm animate-rtpulse" />
      ))}
    </div>
  );
}

export function ErroState({ mensagem, onRetry }: { mensagem: string; onRetry: () => void }) {
  return (
    <div className="flex-1 flex items-center justify-center py-20 px-7">
      <div className="max-w-[460px] flex flex-col gap-3 bg-surface border border-danger-border border-l-4 border-l-danger-strong rounded-card py-5 px-[22px]">
        <h2 className="font-heading text-[18px] font-bold m-0 text-danger">Não foi possível carregar os dados</h2>
        <p className="m-0 text-[14px] leading-relaxed text-text-muted">{mensagem}</p>
        <button
          onClick={onRetry}
          className="self-start font-body text-[13px] font-bold bg-ink text-text-on-dark border-none rounded-btn py-2 px-[18px] cursor-pointer"
        >
          Tentar de novo
        </button>
      </div>
    </div>
  );
}
