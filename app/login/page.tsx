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
    <div className="flex flex-1 items-center justify-center bg-brand-navy px-4 py-12">
      {/* O cartão é um envelope de correio aéreo: borda listrada nas cores do pin do logo. */}
      <div className="airmail animate-rise w-full max-w-sm rounded-3xl bg-white p-2 shadow-2xl">
        <form
          action={action}
          className="flex flex-col gap-5 rounded-2xl bg-surface px-7 pb-8 pt-6"
        >
          <Image
            src="/logo.png"
            alt="ThaMu Viajando"
            width={200}
            height={125}
            priority
            className="mx-auto h-auto w-[180px]"
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
            variant="primary"
            size="lg"
            disabled={pending}
            className="mt-1 w-full"
          >
            {pending ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </div>
    </div>
  );
}
