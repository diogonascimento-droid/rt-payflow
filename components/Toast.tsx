export function Toast({
  text,
  actionLabel = "Desfazer",
  onAction,
  className = "",
}: {
  text: string;
  actionLabel?: string;
  onAction: () => void;
  className?: string;
}) {
  return (
    <div
      className={
        "flex items-center gap-3.5 bg-ink text-text-on-dark rounded-card py-3 px-4 text-[13.5px] animate-rtup shadow-[0_8px_24px_rgba(16,18,16,0.24)] " +
        className
      }
    >
      <span className="flex-1 min-w-0">{text}</span>
      <button
        onClick={onAction}
        className="font-body text-[13.5px] font-bold bg-transparent text-lima-ui border-none cursor-pointer underline whitespace-nowrap"
      >
        {actionLabel}
      </button>
    </div>
  );
}
