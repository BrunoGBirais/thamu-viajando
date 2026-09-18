-- =============================================
-- ThaMu Viajando — cenarios: Row Level Security
-- Run AFTER 003_clientes_update_rls.sql
-- =============================================

-- =======  UP  ========

ALTER TABLE cenarios ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE cenarios FROM anon;

DROP POLICY IF EXISTS cenarios_all_authenticated ON cenarios;
CREATE POLICY cenarios_all_authenticated
  ON cenarios
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

NOTIFY pgrst, 'reload schema';

-- =======  DOWN  ========
-- DROP POLICY IF EXISTS cenarios_all_authenticated ON cenarios;
-- ALTER TABLE cenarios DISABLE ROW LEVEL SECURITY;
