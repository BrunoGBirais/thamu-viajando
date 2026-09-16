import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "../components/app-header";
import { Card } from "../components/ui/card";
import { UsersManager, type UserRow } from "./users-manager";

type ListedUser = {
  user_id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeZone: "America/Bahia",
});

export default async function UsuariosPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    redirect("/login");
  }

  const email = data.claims.email as string | undefined;
  const metadata = data.claims.user_metadata as
    | { full_name?: string }
    | undefined;
  const currentUserId = data.claims.sub as string;

  const { data: isAdmin } = await supabase.rpc("thamu_viajando_is_admin");

  let users: UserRow[] = [];
  let loadError: string | null = null;

  if (isAdmin === true) {
    const { data: rows, error } = await supabase.rpc(
      "thamu_viajando_admin_list_users"
    );

    if (error) {
      loadError = error.message;
    } else {
      users = ((rows ?? []) as ListedUser[]).map((row) => ({
        user_id: row.user_id,
        email: row.email,
        full_name: row.full_name,
        role: row.role,
        createdAtLabel: dateFormatter.format(new Date(row.created_at)),
      }));
    }
  }

  return (
    <>
      <AppHeader
        email={email}
        name={metadata?.full_name}
        isAdmin={isAdmin === true}
      />
      <main className="app-canvas flex-1 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-5xl">
          {isAdmin !== true ? (
            <Card className="p-10 text-center">
              <h1 className="text-xl font-semibold tracking-tight text-brand-navy">
                Acesso restrito
              </h1>
              <p className="mt-2 text-sm text-muted">
                Somente administradores podem gerenciar usuários.
              </p>
            </Card>
          ) : loadError ? (
            <Card className="border-brand-red/25 bg-brand-red/5 p-6 text-sm font-medium text-brand-red">
              Não foi possível carregar os usuários: {loadError}
            </Card>
          ) : (
            <UsersManager users={users} currentUserId={currentUserId} />
          )}
        </div>
      </main>
    </>
  );
}
