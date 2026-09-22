// URL do projeto Supabase, lida num lugar só pelos clientes e pelo proxy.
//
// O supabase-js monta os endpoints concatenando na URL recebida, então um
// "/rest/v1/" colado junto na variável faz o login chamar
// /rest/v1/auth/v1/token — rota do PostgREST, que responde 404 e aparece na
// tela como "senha inválida". Aqui a URL volta à base e o log avisa para
// corrigir a variável na Vercel.
//
// A referência a process.env.NEXT_PUBLIC_SUPABASE_URL precisa ficar literal:
// o Next a substitui pelo valor no build, inclusive no bundle do navegador.

let avisado = false;

export function supabaseUrl() {
  const bruta = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const limpa = bruta
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/(rest|auth)\/v1$/, "");

  if (limpa !== bruta && !avisado) {
    avisado = true;
    console.warn(
      `NEXT_PUBLIC_SUPABASE_URL corrigida de "${bruta}" para "${limpa}". ` +
        "Ajuste a variável: ela deve ser só https://<ref>.supabase.co."
    );
  }

  return limpa;
}
