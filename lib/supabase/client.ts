import { createBrowserClient } from "@supabase/ssr";
import { supabaseUrl } from "./env";

// Cliente do Supabase para código que roda no navegador (componentes "use client").
export function createClient() {
  return createBrowserClient(
    supabaseUrl(),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
