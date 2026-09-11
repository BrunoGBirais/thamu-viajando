import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "./components/app-header";

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  // Sem sessão válida, manda para o login.
  if (!data?.claims) {
    redirect("/login");
  }

  const email = data.claims.email as string | undefined;
  const metadata = data.claims.user_metadata as
    | { full_name?: string }
    | undefined;

  const { data: isAdmin } = await supabase.rpc("thamu_viajando_is_admin");

  return (
    <>
      <AppHeader
        email={email}
        name={metadata?.full_name}
        isAdmin={isAdmin === true}
      />
      <main className="flex flex-1 flex-col items-center justify-center gap-4 bg-zinc-50 px-4 py-12">
        <h1 className="text-3xl font-semibold text-brand-navy">
          Bem-vindo de volta!
        </h1>
        {email && <p className="text-lg text-zinc-600">{email}</p>}
      </main>
    </>
  );
}
