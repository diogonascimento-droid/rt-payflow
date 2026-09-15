"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

function LoginContent() {
  const searchParams = useSearchParams();
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(
    searchParams.get("erro") === "dominio"
      ? "Não foi possível entrar com essa conta. Confirme se ela pertence ao domínio rtpublicity.com.br e tente de novo."
      : null
  );

  async function entrar() {
    if (carregando) return;
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
    <div
      style={{
        minHeight: "100vh",
        background: "#0C0E0C",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        padding: 24,
      }}
    >
      <style>{`
        @keyframes rtgrid { from { background-position: 0 0; } to { background-position: 64px 64px; } }
        @keyframes rtglow1 { 0%,100% { transform: translate(-6%,-8%) scale(1); } 50% { transform: translate(4%,6%) scale(1.15); } }
        @keyframes rtglow2 { 0%,100% { transform: translate(5%,4%) scale(1); } 50% { transform: translate(-4%,-6%) scale(1.1); } }
        @keyframes rtspin { to { transform: rotate(360deg); } }
      `}</style>

      <div
        style={{
          position: "absolute",
          inset: "-10%",
          backgroundImage: "radial-gradient(circle,#1B1E1A 1px,transparent 1px)",
          backgroundSize: "32px 32px",
          opacity: 0.5,
          animation: "rtgrid 14s linear infinite",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 520,
          height: 520,
          left: -120,
          top: -100,
          background: "radial-gradient(circle,rgba(235,205,0,0.16),transparent 70%)",
          filter: "blur(10px)",
          animation: "rtglow1 16s ease-in-out infinite",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 460,
          height: 460,
          right: -100,
          bottom: -120,
          background: "radial-gradient(circle,rgba(235,205,0,0.10),transparent 70%)",
          filter: "blur(10px)",
          animation: "rtglow2 19s ease-in-out infinite",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 2,
          width: "100%",
          maxWidth: 380,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 28,
        }}
      >
        <img src="/rt-payflow-logo.png" alt="RT PayFlow" style={{ width: 150, display: "block" }} />

        <div
          style={{
            width: "100%",
            background: "#151714",
            border: "1px solid #262922",
            borderRadius: 10,
            padding: "32px 28px",
            display: "flex",
            flexDirection: "column",
            gap: 20,
            alignItems: "center",
            boxShadow: "0 24px 60px rgba(0,0,0,0.4)",
          }}
        >
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 6 }}>
            <h1 className="font-heading" style={{ fontSize: 19, fontWeight: 700, color: "#F2F4F0", margin: 0 }}>
              Entrar no RT PayFlow
            </h1>
            <p style={{ fontSize: 13, color: "#8A938B", margin: 0, lineHeight: 1.5 }}>
              Acesso restrito à equipe de performance da RT Publicity
            </p>
          </div>

          {erro && (
            <div
              style={{
                width: "100%",
                background: "#241713",
                border: "1px solid #4A2A20",
                borderLeft: "3px solid #C64A32",
                borderRadius: 6,
                padding: "10px 12px",
                fontSize: 12.5,
                color: "#E8A896",
                lineHeight: 1.4,
              }}
            >
              {erro}
            </div>
          )}

          <button
            onClick={entrar}
            disabled={carregando}
            className="font-body"
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              background: "#FFFFFF",
              color: "#1F2320",
              border: "1px solid #DADDD6",
              borderRadius: 7,
              padding: "12px 16px",
              fontSize: 14.5,
              fontWeight: 500,
              cursor: carregando ? "default" : "pointer",
              minHeight: 48,
            }}
          >
            {carregando ? (
              <>
                <span
                  style={{
                    width: 17,
                    height: 17,
                    border: "2px solid #C8CCC5",
                    borderTopColor: "#1F2320",
                    borderRadius: "50%",
                    animation: "rtspin 0.7s linear infinite",
                    display: "inline-block",
                  }}
                />
                <span>Entrando…</span>
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 48 48" style={{ flex: "none" }}>
                  <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l6-6C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.4-.1-2.4-.4-3.5z" />
                  <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l6-6C34.6 5.1 29.6 3 24 3 15.9 3 8.9 7.6 6.3 14.7z" />
                  <path fill="#4CAF50" d="M24 45c5.5 0 10.5-2.1 14.3-5.5l-6.6-5.6C29.6 35.7 26.9 37 24 37c-5.2 0-9.6-3.1-11.3-7.5l-6.6 5.1C8.8 40.3 15.8 45 24 45z" />
                  <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1 2.9-3 5.3-5.6 6.9l6.6 5.6C39.9 37.6 43 31.6 43 24c0-1.4-.1-2.4-.4-3.5z" />
                </svg>
                <span>Entrar com Google</span>
              </>
            )}
          </button>

          <span style={{ fontSize: 11.5, color: "#5E665F", textAlign: "center", lineHeight: 1.5 }}>
            Sem acesso de cliente ou contador externo — só contas @rtpublicity.com.br
          </span>
        </div>

        <span
          className="font-mono"
          style={{ fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase", color: "#4A524C" }}
        >
          RT Publicity · uso interno
        </span>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
