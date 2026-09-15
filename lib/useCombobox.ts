"use client";

import { useState, useMemo, useCallback } from "react";

export function useCombobox(options: string[], value: string, onChange: (v: string) => void) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () => (query ? options.filter((o) => o.toLowerCase().includes(query.toLowerCase())) : options),
    [options, query]
  );

  const onFocus = useCallback(() => {
    setOpen(true);
    setQuery("");
  }, []);

  const onBlur = useCallback(() => {
    setTimeout(() => setOpen(false), 130);
  }, []);

  const selecionar = useCallback(
    (opt: string) => {
      onChange(opt);
      setOpen(false);
      setQuery("");
    },
    [onChange]
  );

  return {
    inputValue: open ? query : value,
    open,
    filtered,
    onFocus,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value),
    onBlur,
    selecionar,
  };
}

export type UseComboboxReturn = ReturnType<typeof useCombobox>;
