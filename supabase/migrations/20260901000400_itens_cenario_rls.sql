-- =============================================
-- ThaMu Viajando — voos / transporte / passeios: Row Level Security
-- Run AFTER 004_cenarios_rls.sql
-- =============================================

-- =======  UP  ========

ALTER TABLE voos ENABLE ROW LEVEL SECURITY;
ALTER TABLE transporte ENABLE ROW LEVEL SECURITY;
ALTER TABLE passeios ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE voos FROM anon;
REVOKE ALL ON TABLE transporte FROM anon;
REVOKE ALL ON TABLE passeios FROM anon;

DROP POLICY IF EXISTS voos_all_authenticated ON voos;
CREATE POLICY voos_all_authenticated
  ON voos
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS transporte_all_authenticated ON transporte;
CREATE POLICY transporte_all_authenticated
  ON transporte
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS passeios_all_authenticated ON passeios;
CREATE POLICY passeios_all_authenticated
  ON passeios
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

NOTIFY pgrst, 'reload schema';

-- =======  DOWN  ========
-- DROP POLICY IF EXISTS voos_all_authenticated ON voos;
-- DROP POLICY IF EXISTS transporte_all_authenticated ON transporte;
-- DROP POLICY IF EXISTS passeios_all_authenticated ON passeios;
-- ALTER TABLE voos DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE transporte DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE passeios DISABLE ROW LEVEL SECURITY;
