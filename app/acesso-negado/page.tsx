"use client";

import { supabase } from "@/lib/supabase/client";

export default function AcessoNegadoPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ink px-4">
      <div className="w-full max-w-[420px] bg-surface border border-danger-border border-l-4 border-l-danger-strong rounded-card py-8 px-7 flex flex-col gap-4 text-center items-center">
        <h1 className="font-heading text-[19px] font-bold m-0 text-danger">Acesso não permitido</h1>
        <p className="m-0 text-[13.5px] text-text-muted leading-relaxed">
          O RT PayFlow só pode ser acessado com uma conta Google do domínio <strong>@rtpublicity.com.br</strong>. Entre
          novamente com a conta certa.
        </p>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            window.location.href = "/login";
          }}
          className="font-body text-[13.5px] font-bold bg-ink text-text-on-dark border-none rounded-btn py-2.5 px-5 cursor-pointer"
        >
          Voltar para o login
        </button>
      </div>
    </div>
  );
}
