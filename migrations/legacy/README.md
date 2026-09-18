# Migrations históricas (não rode mais)

Estes arquivos construíram o banco antes da adoção do Supabase CLI. Eles eram aplicados à mão no
SQL Editor, nesta ordem: `tables/schema.sql`, `tables/002…012`, `auth/001…006`, `storage/001`.

Hoje a fonte da verdade é [`supabase/migrations/`](../../supabase/migrations), aplicada
automaticamente pelo GitHub Actions: push em `dev` aplica no projeto de desenvolvimento, merge em
`main` aplica no de produção. O estado que estes arquivos produziram está congelado na migration
de baseline (`*_remote_schema.sql`), gerada a partir do banco real.

Ficam aqui só como documentação de como cada pedaço do schema nasceu, e do porquê — os comentários
explicam decisões que o dump do baseline não preserva.

**Não execute nada desta pasta.** Em especial, `tables/schema.sql` começa com
`DROP TABLE IF EXISTS passeios … clientes`: rodá-lo contra um banco com dados apaga os clientes.

Para mudar o schema agora: `npx supabase migration new nome_da_mudanca`.
