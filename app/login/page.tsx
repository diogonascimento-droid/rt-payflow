"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function entrarComGoogle() {
    setCarregando(true);
    setErro(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { hd: "rtpublicity.com.br", prompt: "select_account" },
      },
    });
    if (error) {
      setErro(error.message);
      setCarregando(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink px-4">
      <div className="w-full max-w-[380px] bg-surface border border-border rounded-card py-9 px-8 flex flex-col items-center gap-6 text-center">
        <img src="/rt-payflow-logo.svg" alt="RT PayFlow" style={{ height: 32 }} />
        <div className="flex flex-col gap-1.5">
          <h1 className="font-heading text-[19px] font-bold m-0">Entrar no RT PayFlow</h1>
          <p className="m-0 text-[13.5px] text-text-muted">Acesso restrito a contas Google @rtpublicity.com.br</p>
        </div>

        <button
          onClick={entrarComGoogle}
          disabled={carregando}
          className="w-full flex items-center justify-center gap-2.5 font-body text-[14px] font-medium bg-surface border border-input-border rounded-btn py-3 px-4 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
            <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.95v2.33A9 9 0 0 0 9 18z" />
            <path fill="#FBBC05" d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.95A9 9 0 0 0 0 9c0 1.45.35 2.83.95 4.05z" />
            <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.59-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .95 4.95l3.02 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
          </svg>
          Entrar com Google
        </button>

        {erro && (
          <div className="w-full text-[13px] text-danger bg-danger-bg border border-danger-border rounded-sm py-2 px-3">{erro}</div>
        )}
      </div>
    </div>
  );
}
