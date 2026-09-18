-- =============================================
-- ThaMu Viajando — restaura as FKs de voos/transporte/passeios -> cenarios
-- Sem elas o PostgREST recusa o embed cenarios?select=*,voos(*) (PGRST200)
-- Run AFTER 007_cenarios_datas_opcionais.sql
-- =============================================

-- =======  UP  ========

DELETE FROM voos       WHERE cenario_id NOT IN (SELECT id FROM cenarios);
DELETE FROM transporte WHERE cenario_id NOT IN (SELECT id FROM cenarios);
DELETE FROM passeios   WHERE cenario_id NOT IN (SELECT id FROM cenarios);

ALTER TABLE voos DROP CONSTRAINT IF EXISTS fk_voos_cenarios;
ALTER TABLE voos ADD CONSTRAINT fk_voos_cenarios
  FOREIGN KEY (cenario_id) REFERENCES cenarios(id) ON DELETE CASCADE;

ALTER TABLE transporte DROP CONSTRAINT IF EXISTS fk_transporte_cenarios;
ALTER TABLE transporte ADD CONSTRAINT fk_transporte_cenarios
  FOREIGN KEY (cenario_id) REFERENCES cenarios(id) ON DELETE CASCADE;

ALTER TABLE passeios DROP CONSTRAINT IF EXISTS fk_passeios_cenarios;
ALTER TABLE passeios ADD CONSTRAINT fk_passeios_cenarios
  FOREIGN KEY (cenario_id) REFERENCES cenarios(id) ON DELETE CASCADE;

NOTIFY pgrst, 'reload schema';

-- =======  DOWN  ========
-- ALTER TABLE voos DROP CONSTRAINT IF EXISTS fk_voos_cenarios;
-- ALTER TABLE transporte DROP CONSTRAINT IF EXISTS fk_transporte_cenarios;
-- ALTER TABLE passeios DROP CONSTRAINT IF EXISTS fk_passeios_cenarios;
-- NOTIFY pgrst, 'reload schema';
