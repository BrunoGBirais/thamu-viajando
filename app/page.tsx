import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "./components/app-header";
import { PageHeader } from "./components/ui/card";

const ICONE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
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
    tom: "from-brand-blue to-[#1071a0]",
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
    tom: "from-brand-navy to-[#0b1d3a]",
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
    tom: "from-brand-yellow to-brand-red",
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
      <main className="app-canvas flex-1 px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-5xl space-y-10">
          <PageHeader
            eyebrow="ThaMu Viajando"
            title={
              primeiroNome ? `Olá, ${primeiroNome}` : "Bem-vindo de volta!"
            }
            description="Por onde você quer começar hoje?"
          />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ATALHOS.map((atalho, indice) => (
              <Link
                key={atalho.href}
                href={atalho.href}
                style={{ animationDelay: `${indice * 70}ms` }}
                className="animate-rise group relative overflow-hidden rounded-2xl border border-line bg-surface p-6 shadow-sm transition duration-300 ease-out-expo hover:-translate-y-1 hover:border-brand-blue/40 hover:shadow-lg"
              >
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${atalho.tom} text-white shadow-sm transition-transform duration-300 group-hover:scale-110`}
                >
                  {atalho.icone}
                </span>
                <h2 className="mt-5 text-base font-semibold tracking-tight text-brand-navy">
                  {atalho.titulo}
                </h2>
                <p className="mt-1.5 text-sm text-muted">{atalho.texto}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-blue">
                  Abrir
                  <svg
                    {...ICONE}
                    width={16}
                    height={16}
                    strokeWidth={2}
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  >
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
