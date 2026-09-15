"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./client";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isEditor, setIsEditor] = useState(false);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;

    async function carregar(u: User | null) {
      setUser(u);
      if (!u?.email) {
        setIsEditor(false);
        setCarregando(false);
        return;
      }
      const { data } = await supabase.from("editores").select("email").eq("email", u.email.toLowerCase()).maybeSingle();
      if (ativo) {
        setIsEditor(!!data);
        setCarregando(false);
      }
    }

    supabase.auth.getUser().then(({ data }) => carregar(data.user));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      carregar(session?.user ?? null);
    });

    return () => {
      ativo = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function sair() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return { user, isEditor, carregando, sair };
}
