"use client";

import { UseComboboxReturn } from "@/lib/useCombobox";

export function Combobox({
  combo,
  placeholder,
  mono = false,
  hasError = false,
  className = "",
}: {
  combo: UseComboboxReturn;
  placeholder?: string;
  mono?: boolean;
  hasError?: boolean;
  className?: string;
}) {
  return (
    <div className="relative">
      <input
        value={combo.inputValue}
        onFocus={combo.onFocus}
        onChange={combo.onChange}
        onBlur={combo.onBlur}
        placeholder={placeholder}
        className={
          (mono ? "font-mono " : "") +
          "text-[14px] py-2.5 px-3 rounded-sm bg-surface text-text-body outline-none w-full box-border border " +
          (hasError ? "border-danger-strong" : "border-input-border") +
          " " +
          className
        }
      />
      {combo.open && (
        <div className="absolute top-[42px] left-0 right-0 bg-surface border border-input-border rounded-sm shadow-[0_10px_22px_rgba(16,18,16,0.14)] max-h-[180px] overflow-auto z-30">
          {combo.filtered.map((opt) => (
            <div
              key={opt}
              onMouseDown={() => combo.selecionar(opt)}
              className={(mono ? "font-mono " : "") + "py-2 px-3 text-[13.5px] cursor-pointer hover:bg-workspace"}
            >
              {opt}
            </div>
          ))}
          {combo.filtered.length === 0 && (
            <div className="py-2 px-3 text-[12.5px] text-text-faint-2">Nenhum resultado encontrado</div>
          )}
        </div>
      )}
    </div>
  );
}
