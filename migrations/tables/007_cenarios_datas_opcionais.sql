-- =============================================
-- ThaMu Viajando — cenarios: datas opcionais
-- Run AFTER 006_voos_campos.sql
-- =============================================

-- =======  UP  ========

ALTER TABLE cenarios ALTER COLUMN data_inicio DROP NOT NULL;
ALTER TABLE cenarios ALTER COLUMN data_fim    DROP NOT NULL;

NOTIFY pgrst, 'reload schema';

-- =======  DOWN  ========
-- ALTER TABLE cenarios ALTER COLUMN data_inicio SET NOT NULL;
-- ALTER TABLE cenarios ALTER COLUMN data_fim    SET NOT NULL;
-- NOTIFY pgrst, 'reload schema';
