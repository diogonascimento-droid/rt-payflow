"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const ITENS = [
  { href: "/", label: "Visão geral" },
  { href: "/lancamentos", label: "Lançamentos" },
  { href: "/novo-lancamento", label: "Novo lançamento" },
  { href: "/importar-csv", label: "Importar CSV" },
  { href: "/cadastros", label: "Cadastros" },
];

export function NavBar({ right }: { right?: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="bg-ink text-text-on-dark px-7 py-3.5 flex items-center gap-5 flex-wrap">
      <Link href="/" className="block shrink-0">
        <Image src="/rt-payflow-logo.svg" alt="RT PayFlow" width={112} height={27} priority />
      </Link>
      <div className="flex gap-0.5 text-[13.5px] flex-wrap">
        {ITENS.map((item) => {
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
    </div>
  );
}
