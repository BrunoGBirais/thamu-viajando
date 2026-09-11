"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type UserFormState = { error?: string; success?: string } | undefined;

const COMPANY_NAME = "thamu_viajando";

// Devolve o client autenticado só se quem chamou for admin no banco.
async function getAdminSession() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    redirect("/login");
  }

  const { data: isAdmin } = await supabase.rpc("thamu_viajando_is_admin");

  return isAdmin === true ? supabase : null;
}

function readRole(formData: FormData) {
  return formData.get("is_admin") === "on" ? "admin" : "visualizador";
}

export async function createUser(
  _prevState: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  const supabase = await getAdminSession();

  if (!supabase) {
    return { error: "Acesso negado: apenas administradores." };
  }

  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!fullName || !email || !password) {
    return { error: "Preencha nome, e-mail e senha." };
  }

  if (password.length < 8) {
    return { error: "A senha precisa ter pelo menos 8 caracteres." };
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      error: "Configure SUPABASE_SERVICE_ROLE_KEY no .env.local para criar usuários.",
    };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role: readRole(formData),
      company_name: COMPANY_NAME,
    },
  });

  if (error) {
    console.error("createUser:", error.message);
    return {
      error: error.status === 422
        ? "Já existe um usuário com esse e-mail."
        : "Não foi possível criar o usuário.",
    };
  }

  revalidatePath("/usuarios");
  return { success: "Usuário criado com sucesso." };
}

export async function updateUser(
  _prevState: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  const supabase = await getAdminSession();

  if (!supabase) {
    return { error: "Acesso negado: apenas administradores." };
  }

  const userId = String(formData.get("user_id") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();

  if (!userId || !fullName) {
    return { error: "Informe o nome do usuário." };
  }

  const { error } = await supabase.rpc("thamu_viajando_admin_update_user", {
    p_user_id: userId,
    p_full_name: fullName,
    p_role: readRole(formData),
  });

  if (error) {
    console.error("updateUser:", error.message);
    return { error: error.message };
  }

  revalidatePath("/usuarios");
  return { success: "Usuário atualizado." };
}

export async function deleteUser(
  _prevState: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  const supabase = await getAdminSession();

  if (!supabase) {
    return { error: "Acesso negado: apenas administradores." };
  }

  const userId = String(formData.get("user_id") ?? "");

  if (!userId) {
    return { error: "Usuário inválido." };
  }

  const { error } = await supabase.rpc("thamu_viajando_admin_delete_user", {
    p_user_id: userId,
  });

  if (error) {
    console.error("deleteUser:", error.message);
    return { error: error.message };
  }

  revalidatePath("/usuarios");
  return { success: "Usuário excluído." };
}
