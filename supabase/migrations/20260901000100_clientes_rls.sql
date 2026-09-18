-- =============================================
-- ThaMu Viajando — clientes: Row Level Security
-- Sem RLS, qualquer portador da anon key (que é pública)
-- consegue ler e escrever a tabela inteira.
-- Run AFTER schema.sql
-- =============================================

-- =======  UP  ========

ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE clientes FROM anon;

DROP POLICY IF EXISTS clientes_select_authenticated ON clientes;
CREATE POLICY clientes_select_authenticated
  ON clientes
  FOR SELECT
  TO authenticated
  USING (true);

NOTIFY pgrst, 'reload schema';

-- =======  DOWN  ========
-- DROP POLICY IF EXISTS clientes_select_authenticated ON clientes;
-- ALTER TABLE clientes DISABLE ROW LEVEL SECURITY;
