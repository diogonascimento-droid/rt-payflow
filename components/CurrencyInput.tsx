"use client";

import { BRL } from "@/lib/format";

const TECLAS_PERMITIDAS = ["Tab", "Shift", "Control", "Meta", "Alt", "Enter", "Escape", "ArrowLeft", "ArrowRight"];

/**
 * Campo de valor monetário controlado dígito a dígito (não faz parse do texto
 * já formatado — evita o bug clássico de digitar sobre um valor mascarado).
 */
export function CurrencyInput({
  centavos,
  onChange,
  className,
  hasError,
  autoFocus,
  mostrarPrefixo = true,
  placeholder,
}: {
  centavos: number;
  onChange: (centavos: number) => void;
  className?: string;
  hasError?: boolean;
  autoFocus?: boolean;
  mostrarPrefixo?: boolean;
  placeholder?: string;
}) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.metaKey || e.ctrlKey || TECLAS_PERMITIDAS.includes(e.key)) return;
    e.preventDefault();
    if (e.key >= "0" && e.key <= "9") {
      const novo = centavos * 10 + Number(e.key);
      if (novo <= 999999999) onChange(novo);
    } else if (e.key === "Backspace") {
      onChange(Math.floor(centavos / 10));
    } else if (e.key === "Delete") {
      onChange(0);
    }
  };

  const valorFormatado = mostrarPrefixo
    ? BRL(centavos / 100)
    : (centavos / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <input
      value={centavos === 0 && placeholder !== undefined ? "" : valorFormatado}
      onChange={() => {}}
      onKeyDown={handleKeyDown}
      inputMode="numeric"
      autoFocus={autoFocus}
      placeholder={placeholder}
      style={hasError ? { borderColor: "#C64A32" } : undefined}
      className={className}
    />
  );
}
