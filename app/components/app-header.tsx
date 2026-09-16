"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { logout } from "@/app/actions";

const ICONE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  viewBox: "0 0 24 24",
  width: 18,
  height: 18,
  "aria-hidden": true,
} as const;

const NAV: { href: string; label: string; icon: ReactNode; admin?: boolean }[] = [
  {
    href: "/",
    label: "Início",
    icon: (
      <svg {...ICONE}>
        <path d="m3 10.5 9-7 9 7V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
      </svg>
    ),
  },
  {
    href: "/clientes",
    label: "Clientes",
    icon: (
      <svg {...ICONE}>
        <path d="M16 20v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20" />
        <circle cx="9" cy="7.5" r="3.5" />
        <path d="M22 20v-1.5a4 4 0 0 0-3-3.87M16 4.13a4 4 0 0 1 0 6.74" />
      </svg>
    ),
  },
  {
    href: "/criar-proposta",
    label: "Criar proposta",
    icon: (
      <svg {...ICONE}>
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8z" />
        <path d="M14 3v6h5M9 14h6M9 17.5h4" />
      </svg>
    ),
  },
  {
    href: "/templates",
    label: "Templates",
    icon: (
      <svg {...ICONE}>
        <rect x="3" y="3" width="18" height="18" rx="2.5" />
        <path d="M3 9h18M9 9v12" />
      </svg>
    ),
  },
  {
    href: "/usuarios",
    label: "Gestão de usuários",
    admin: true,
    icon: (
      <svg {...ICONE}>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
      </svg>
    ),
  },
];

function iniciais(nome: string) {
  return nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? "")
    .join("");
}

export function AppHeader({
  email,
  name,
  isAdmin = false,
}: {
  email?: string;
  name?: string;
  isAdmin?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const displayName = name ?? email ?? "Usuário";
  const itens = NAV.filter((item) => !item.admin || isAdmin);

  const ehAtivo = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  useEffect(() => {
    if (!open && !userMenuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      setUserMenuOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, userMenuOpen]);

  useEffect(() => {
    if (!userMenuOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!userMenuRef.current?.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [userMenuOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 h-[var(--header-h)] border-b border-line/80 bg-surface/80 backdrop-blur-xl">
        <div className="brand-rule h-0.5" />
        <div className="flex h-[calc(var(--header-h)-0.125rem)] items-center gap-3 px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            aria-expanded={open}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-brand-navy transition hover:bg-surface-sunken active:scale-95 lg:hidden"
          >
            <svg {...ICONE} width={22} height={22} strokeWidth={2}>
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>

          <Link href="/" className="flex shrink-0 items-center">
            <Image
              src="/logo.png"
              alt="ThaMu Viajando"
              width={360}
              height={225}
              priority
              className="h-10 w-auto transition-transform duration-300 hover:scale-105"
            />
          </Link>

          {/* Em telas largas a navegação fica no header; abaixo disso vira gaveta. */}
          <nav className="ml-3 hidden items-center gap-1 lg:flex">
            {itens.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition duration-200 ${
                  ehAtivo(item.href)
                    ? "bg-brand-navy/8 text-brand-navy"
                    : "text-muted hover:bg-surface-sunken hover:text-brand-navy"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>

          <div ref={userMenuRef} className="relative ml-auto">
            <button
              type="button"
              onClick={() => setUserMenuOpen((value) => !value)}
              aria-haspopup="menu"
              aria-expanded={userMenuOpen}
              className="flex items-center gap-2.5 rounded-full border border-transparent py-1 pl-1 pr-2.5 transition hover:border-line hover:bg-surface-muted"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-blue to-brand-navy text-xs font-bold text-white shadow-sm">
                {iniciais(displayName) || "U"}
              </span>
              <span className="hidden max-w-[12rem] truncate text-sm font-medium text-brand-navy sm:block">
                {displayName}
              </span>
              <svg
                {...ICONE}
                width={14}
                height={14}
                className={`text-subtle transition-transform duration-200 ${
                  userMenuOpen ? "rotate-180" : ""
                }`}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {userMenuOpen && (
              <div
                role="menu"
                className="animate-pop absolute right-0 top-full mt-2 w-64 origin-top-right overflow-hidden rounded-2xl border border-line bg-surface p-1.5 shadow-xl"
              >
                <div className="px-3 py-2.5">
                  <p className="truncate text-sm font-semibold text-brand-navy">
                    {displayName}
                  </p>
                  {email && <p className="truncate text-xs text-muted">{email}</p>}
                </div>

                <div className="my-1 h-px bg-line" />

                {isAdmin && (
                  <Link
                    href="/usuarios"
                    role="menuitem"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-brand-navy transition hover:bg-brand-blue/8"
                  >
                    <svg {...ICONE} width={16} height={16}>
                      <circle cx="12" cy="8" r="3.5" />
                      <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
                    </svg>
                    Gestão de usuários
                  </Link>
                )}

                <form action={logout}>
                  <button
                    type="submit"
                    role="menuitem"
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-brand-red transition hover:bg-brand-red/8"
                  >
                    <svg {...ICONE} width={16} height={16}>
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                    </svg>
                    Sair
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </header>

      <div
        onClick={() => setOpen(false)}
        aria-hidden="true"
        className={`fixed inset-x-0 bottom-0 top-[var(--header-h)] z-30 bg-brand-navy/30 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        aria-hidden={!open}
        className={`fixed left-0 top-[var(--header-h)] z-40 flex h-[calc(100%-var(--header-h))] w-72 flex-col border-r border-line bg-surface shadow-2xl transition-transform duration-300 ease-out-expo lg:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {email && (
          <div className="border-b border-line px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-subtle">
              Conectado como
            </p>
            <p className="mt-1 truncate text-sm font-semibold text-brand-navy">
              {email}
            </p>
          </div>
        )}

        <nav className="flex flex-1 flex-col gap-1 p-3">
          {itens.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              tabIndex={open ? 0 : -1}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                ehAtivo(item.href)
                  ? "bg-brand-navy text-white shadow-sm"
                  : "text-brand-navy hover:bg-brand-blue/8"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}
