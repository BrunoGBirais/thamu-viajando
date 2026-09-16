"use client";

import Image from "next/image";
import { useActionState } from "react";
import { Button } from "@/app/components/ui/button";
import { Field, FormFeedback, Input } from "@/app/components/ui/form";
import { login, type LoginState } from "./actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    login,
    undefined
  );

  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-[#0c1c3a] px-4 py-12">
      {/* Manchas decorativas com as cores do logo */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-brand-blue/25 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 h-[26rem] w-[26rem] rounded-full bg-brand-red/25 blur-[100px]" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-brand-yellow/12 blur-[90px]" />

      <div className="animate-pop relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/12 bg-surface/95 shadow-2xl backdrop-blur-xl">
        <div className="brand-rule h-1.5" />

        <form action={action} className="flex flex-col gap-5 p-8">
          <Image
            src="/logo.png"
            alt="ThaMu Viajando"
            width={200}
            height={125}
            priority
            className="mx-auto h-auto w-[170px]"
          />

          <Field label="E-mail" htmlFor="login-email">
            <Input
              id="login-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="voce@exemplo.com"
            />
          </Field>

          <Field label="Senha" htmlFor="login-password">
            <Input
              id="login-password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </Field>

          <FormFeedback error={state?.error} />

          <Button
            type="submit"
            variant="danger"
            size="lg"
            disabled={pending}
            className="w-full rounded-full"
          >
            {pending ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </div>
    </div>
  );
}
