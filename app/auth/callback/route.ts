import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await supabaseServer();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const email = data.user?.email?.toLowerCase() || "";
      if (!email.endsWith("@rtpublicity.com.br")) {
        await supabase.auth.signOut();
        return NextResponse.redirect(`${origin}/login?erro=dominio`);
      }
      return NextResponse.redirect(`${origin}/`);
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}
