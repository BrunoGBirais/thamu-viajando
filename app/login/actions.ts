"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { error?: string } | undefined;

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Preencha e-mail e senha." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // A mensagem ao usuário é sempre a mesma; o motivo real (URL/chave errada,
    // rede, credencial) só aparece aqui, nos logs do servidor (Vercel → Logs).
    console.error("login:", error.status, error.code, error.message);
    return { error: "E-mail ou senha inválidos." };
  }

  redirect("/");
}
