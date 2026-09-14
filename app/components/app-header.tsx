"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { logout } from "@/app/actions";

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

  const displayName = name ?? email ?? "Usuário";

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
      <header className="sticky top-0 z-50 flex h-[var(--header-h)] flex-col bg-white shadow-sm">
        <div className="h-1 bg-gradient-to-r from-brand-red via-brand-yellow to-brand-blue" />
        <div className="flex flex-1 items-center gap-4 px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            aria-expanded={open}
            className="rounded-lg p-2 text-brand-navy transition-colors hover:bg-zinc-100"
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <Image
            src="/logo.png"
            alt="ThaMu Viajando"
            width={360}
            height={225}
            priority
            className="h-24 w-auto"
          />

          <div ref={userMenuRef} className="relative ml-auto">
            <button
              type="button"
              onClick={() => setUserMenuOpen((value) => !value)}
              aria-haspopup="menu"
              aria-expanded={userMenuOpen}
              className="flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3 transition-colors hover:bg-zinc-100"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-navy text-white">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </span>
              <span className="hidden max-w-[12rem] truncate text-sm font-medium text-brand-navy sm:block">
                {displayName}
              </span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
                className={`text-brand-navy transition-transform ${
                  userMenuOpen ? "rotate-180" : ""
                }`}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {userMenuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full mt-2 w-60 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl"
              >
                <div className="border-b border-zinc-200 px-4 py-3">
                  <p className="truncate font-medium text-brand-navy">
                    {displayName}
                  </p>
                  {email && (
                    <p className="truncate text-xs text-zinc-500">{email}</p>
                  )}
                </div>

                {isAdmin && (
                  <Link
                    href="/usuarios"
                    role="menuitem"
                    onClick={() => setUserMenuOpen(false)}
                    className="block px-4 py-3 text-sm font-medium text-brand-navy transition-colors hover:bg-brand-blue/10"
                  >
                    Gestão de usuários
                  </Link>
                )}

                <form action={logout} className="border-t border-zinc-200">
                  <button
                    type="submit"
                    role="menuitem"
                    className="w-full px-4 py-3 text-left text-sm font-medium text-brand-red transition-colors hover:bg-brand-red/10"
                  >
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
        className={`fixed inset-x-0 bottom-0 top-[var(--header-h)] z-30 bg-black/40 transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        aria-hidden={!open}
        className={`fixed left-0 top-[var(--header-h)] z-40 flex h-[calc(100%-var(--header-h))] w-72 flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="border-b border-zinc-200 bg-brand-navy px-4 py-4">
          <span className="font-semibold text-white">Menu</span>
        </div>

        {email && (
          <div className="border-b border-zinc-200 px-4 py-4">
            <p className="text-xs uppercase tracking-wide text-zinc-500">
              Conectado como
            </p>
            <p className="truncate font-medium text-brand-navy">{email}</p>
          </div>
        )}

        <nav className="flex flex-1 flex-col gap-1 p-3">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            tabIndex={open ? 0 : -1}
            className="rounded-lg px-3 py-2.5 font-medium text-brand-navy transition-colors hover:bg-brand-blue/10"
          >
            Início
          </Link>
          <Link
            href="/clientes"
            onClick={() => setOpen(false)}
            tabIndex={open ? 0 : -1}
            className="rounded-lg px-3 py-2.5 font-medium text-brand-navy transition-colors hover:bg-brand-blue/10"
          >
            Clientes
          </Link>
          <Link
            href="/criar-proposta"
            onClick={() => setOpen(false)}
            tabIndex={open ? 0 : -1}
            className="rounded-lg px-3 py-2.5 font-medium text-brand-navy transition-colors hover:bg-brand-blue/10"
          >
            Criar proposta
          </Link>
          <Link
            href="/templates"
            onClick={() => setOpen(false)}
            tabIndex={open ? 0 : -1}
            className="rounded-lg px-3 py-2.5 font-medium text-brand-navy transition-colors hover:bg-brand-blue/10"
          >
            Templates
          </Link>
          {isAdmin && (
            <Link
              href="/usuarios"
              onClick={() => setOpen(false)}
              tabIndex={open ? 0 : -1}
              className="rounded-lg px-3 py-2.5 font-medium text-brand-navy transition-colors hover:bg-brand-blue/10"
            >
              Gestão de usuários
            </Link>
          )}
        </nav>
      </aside>
    </>
  );
}
