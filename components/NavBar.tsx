"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/supabase/useAuth";

const ITENS = [
  { href: "/", label: "Visão geral", somenteEditor: false },
  { href: "/lancamentos", label: "Lançamentos", somenteEditor: false },
  { href: "/novo-lancamento", label: "Novo lançamento", somenteEditor: true },
  { href: "/importar-csv", label: "Importar CSV", somenteEditor: true },
  { href: "/cadastros", label: "Cadastros", somenteEditor: false },
  { href: "/investimento-educacao", label: "Educação", somenteEditor: false },
];

export function NavBar({ right }: { right?: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isEditor, sair } = useAuth();

  return (
    <div className="bg-ink text-text-on-dark px-7 py-3.5 flex items-center gap-5 flex-wrap">
      <Link href="/" className="block shrink-0">
        <Image src="/rt-payflow-logo.png" alt="RT PayFlow" width={112} height={56} priority />
      </Link>
      <div className="flex gap-0.5 text-[13.5px] flex-wrap">
        {ITENS.filter((item) => isEditor || !item.somenteEditor).map((item) => {
          const ativo = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                "py-1.5 px-3.5 rounded-pill whitespace-nowrap no-underline " +
                (ativo ? "bg-ink-2 text-text-on-dark" : "text-text-on-dark-muted hover:text-text-on-dark")
              }
            >
              {item.label}
            </Link>
          );
        })}
      </div>
      {right && <div className="ml-auto flex items-center gap-2.5 flex-wrap">{right}</div>}
      {user && (
        <div className={"flex items-center gap-2.5 flex-wrap" + (right ? "" : " ml-auto")}>
          <span className="font-mono text-[11.5px] text-text-on-dark-muted whitespace-nowrap" title={isEditor ? "Pode editar" : "Somente visualização"}>
            {user.email}
          </span>
          <button
            onClick={sair}
            className="font-body text-[12.5px] bg-transparent border border-[#3A413C] text-text-on-dark-muted rounded-btn py-1 px-2.5 cursor-pointer whitespace-nowrap hover:text-text-on-dark"
          >
            Sair
          </button>
        </div>
      )}
    </div>
  );
}
