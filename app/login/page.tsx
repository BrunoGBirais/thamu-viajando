"use client";

import Image from "next/image";
import { useActionState } from "react";
import { login, type LoginState } from "./actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    login,
    undefined
  );

  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-gradient-to-br from-brand-navy via-brand-navy to-[#0f2247] px-4 py-12">
      {/* Manchas decorativas com as cores do logo */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand-blue/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-brand-red/30 blur-3xl" />

      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="h-1.5 bg-gradient-to-r from-brand-red via-brand-yellow to-brand-blue" />

        <form action={action} className="flex flex-col gap-5 p-8">
          <div className="flex flex-col items-center gap-3">
            <Image
              src="/logo.png"
              alt="ThaMu Viajando"
              width={200}
              height={125}
              priority
              className="h-auto w-[180px]"
            />
          </div>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-brand-navy">E-mail</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="voce@exemplo.com"
              className="h-11 rounded-lg border border-zinc-300 px-3 text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/30"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-brand-navy">Senha</span>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="h-11 rounded-lg border border-zinc-300 px-3 text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/30"
            />
          </label>

          {state?.error && (
            <p
              role="alert"
              className="rounded-lg border border-brand-red/20 bg-brand-red/10 px-3 py-2 text-sm text-brand-red"
            >
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="h-11 rounded-full bg-brand-red font-semibold text-white transition-colors hover:bg-brand-navy disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
