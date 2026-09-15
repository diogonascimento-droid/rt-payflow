export function SlideOverPanel({
  title,
  onClose,
  children,
  footer,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <>
      <div onClick={onClose} className="fixed inset-0 bg-black/32 z-[49]" />
      <div className="fixed top-0 right-0 bottom-0 w-[380px] bg-surface z-50 shadow-[-14px_0_34px_rgba(16,18,16,0.2)] flex flex-col">
        <header className="py-[18px] px-[22px] border-b border-[#E7EAE5] flex items-center justify-between">
          <h2 className="font-heading text-[16px] font-bold m-0">{title}</h2>
          <button onClick={onClose} className="text-[18px] bg-transparent border-none text-text-faint cursor-pointer hover:text-ink">
            ✕
          </button>
        </header>
        <div className="flex-1 overflow-auto py-[18px] px-[22px] flex flex-col gap-3.5">{children}</div>
        <footer className="border-t border-[#E7EAE5] py-3.5 px-[22px] flex gap-2.5">{footer}</footer>
      </div>
    </>
  );
}

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="flex flex-col gap-1.5 relative">
      <span className="font-mono text-[10.5px] tracking-[0.1em] uppercase text-[#5C665E]">{label}</span>
      {children}
      {hint && <span className="text-[11.5px] text-text-faint">{hint}</span>}
    </label>
  );
}
