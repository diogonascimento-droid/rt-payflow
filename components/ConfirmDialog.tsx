export function ConfirmDialog({
  title,
  text,
  confirmLabel = "Excluir",
  onConfirm,
  onCancel,
}: {
  title: string;
  text: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 z-[59] flex items-center justify-center">
      <div className="bg-surface rounded-card p-6 max-w-[380px] flex flex-col gap-3">
        <h2 className="font-heading text-[17px] font-bold m-0">{title}</h2>
        <p className="m-0 text-[13.5px] leading-relaxed text-text-muted">{text}</p>
        <div className="flex gap-2.5 mt-1.5">
          <button
            onClick={onConfirm}
            className="font-body text-[13.5px] font-bold bg-danger-strong text-white border-none rounded-btn py-2 px-4 cursor-pointer"
          >
            {confirmLabel}
          </button>
          <button
            onClick={onCancel}
            className="font-body text-[13.5px] bg-surface border border-input-border rounded-btn py-2 px-4 cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
