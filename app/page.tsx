import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "./components/app-header";

const ICONE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  viewBox: "0 0 24 24",
  width: 22,
  height: 22,
  "aria-hidden": true,
} as const;

const ATALHOS = [
  {
    href: "/criar-proposta",
    titulo: "Criar proposta",
    texto: "Monte uma proposta a partir de um template do Canva.",
    icone: (
      <svg {...ICONE}>
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8z" />
        <path d="M14 3v6h5M9 14h6M9 17.5h4" />
      </svg>
    ),
  },
  {
    href: "/clientes",
    titulo: "Clientes",
    texto: "Consulte o funil, os cenários e os itens de cada viagem.",
    icone: (
      <svg {...ICONE}>
        <path d="M16 20v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20" />
        <circle cx="9" cy="7.5" r="3.5" />
        <path d="M22 20v-1.5a4 4 0 0 0-3-3.87M16 4.13a4 4 0 0 1 0 6.74" />
      </svg>
    ),
  },
  {
    href: "/templates",
    titulo: "Templates",
    texto: "Ajuste os campos e o layout dos modelos de proposta.",
    icone: (
      <svg {...ICONE}>
        <rect x="3" y="3" width="18" height="18" rx="2.5" />
        <path d="M3 9h18M9 9v12" />
      </svg>
    ),
  },
];

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
  const primeiroNome = metadata?.full_name?.split(" ")[0];

  return (
    <>
      <AppHeader
        email={email}
        name={metadata?.full_name}
        isAdmin={isAdmin === true}
      />
      <main className="app-canvas flex-1 px-4 py-12 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-[2.75rem] font-extrabold text-brand-navy sm:text-[4rem]">
            {primeiroNome ? `Olá, ${primeiroNome}` : "Bem-vindo de volta!"}
          </h1>
          <p className="mt-3 text-lg text-muted">
            Por onde você quer começar hoje?
          </p>

          {/* O primeiro atalho é o trabalho principal do dia, então ganha o navy cheio. */}
          <nav
            aria-label="Atalhos"
            className="animate-rise mt-10 grid overflow-hidden rounded-2xl border border-line bg-surface shadow-sm sm:grid-cols-3"
          >
            {ATALHOS.map((atalho, indice) => {
              const destaque = indice === 0;

              return (
                <Link
                  key={atalho.href}
                  href={atalho.href}
                  className={`group flex flex-col gap-4 p-6 transition-colors duration-150 sm:p-7 ${
                    destaque
                      ? "bg-brand-navy text-white hover:bg-[#213f75]"
                      : "border-t border-line hover:bg-surface-muted sm:border-l sm:border-t-0"
                  }`}
                >
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                      destaque
                        ? "bg-brand-yellow text-brand-navy"
                        : "bg-surface-sunken text-brand-navy"
                    }`}
                  >
                    {atalho.icone}
                  </span>
                  <span>
                    <span
                      className={`flex items-center gap-2 font-display text-xl font-bold ${
                        destaque ? "text-white" : "text-brand-navy"
                      }`}
                    >
                      {atalho.titulo}
                      <svg
                        {...ICONE}
                        width={18}
                        height={18}
                        strokeWidth={2.2}
                        className="transition-transform duration-150 group-hover:translate-x-0.5"
                      >
                        <path d="m9 6 6 6-6 6" />
                      </svg>
                    </span>
                    <span
                      className={`mt-1.5 block ${
                        destaque ? "text-white/75" : "text-muted"
                      }`}
                    >
                      {atalho.texto}
                    </span>
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      </main>
    </>
  );
}
