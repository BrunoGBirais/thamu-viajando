-- =============================================
-- ThaMu Viajando — clientes: permissão de edição
-- Run AFTER 002_clientes_rls.sql
-- =============================================

-- =======  UP  ========

DROP POLICY IF EXISTS clientes_update_authenticated ON clientes;
CREATE POLICY clientes_update_authenticated
  ON clientes
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

NOTIFY pgrst, 'reload schema';

-- =======  DOWN  ========
-- DROP POLICY IF EXISTS clientes_update_authenticated ON clientes;
