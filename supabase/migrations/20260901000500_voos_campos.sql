-- =============================================
-- ThaMu Viajando — voos: campos completos da planilha
-- Run AFTER 005_itens_cenario_rls.sql
-- =============================================

-- =======  UP  ========

ALTER TABLE voos ADD COLUMN IF NOT EXISTS companhia        VARCHAR(120);
ALTER TABLE voos ADD COLUMN IF NOT EXISTS partida          TIMESTAMP;
ALTER TABLE voos ADD COLUMN IF NOT EXISTS chegada          TIMESTAMP;
ALTER TABLE voos ADD COLUMN IF NOT EXISTS escalas          INTEGER;
ALTER TABLE voos ADD COLUMN IF NOT EXISTS aeroporto_escala VARCHAR(160);
ALTER TABLE voos ADD COLUMN IF NOT EXISTS tempo_escala     VARCHAR(40);
ALTER TABLE voos ADD COLUMN IF NOT EXISTS moeda            CHAR(3);
ALTER TABLE voos ADD COLUMN IF NOT EXISTS valor_unitario   NUMERIC(12,2);
ALTER TABLE voos ADD COLUMN IF NOT EXISTS pax              INTEGER;
ALTER TABLE voos ADD COLUMN IF NOT EXISTS status           VARCHAR(40);
ALTER TABLE voos ADD COLUMN IF NOT EXISTS link             VARCHAR(500);

ALTER TABLE voos ADD COLUMN IF NOT EXISTS total NUMERIC(12,2)
  GENERATED ALWAYS AS (valor_unitario * pax) STORED;

-- partida substitui data_voo; migra o que já existe antes de remover a coluna.
UPDATE voos SET partida = data_voo::TIMESTAMP WHERE partida IS NULL AND data_voo IS NOT NULL;

ALTER TABLE voos ALTER COLUMN partida SET NOT NULL;
ALTER TABLE voos DROP COLUMN IF EXISTS data_voo;

ALTER TABLE voos DROP CONSTRAINT IF EXISTS ck_voos_valor;
ALTER TABLE voos ADD CONSTRAINT ck_voos_valor
  CHECK (valor_unitario IS NULL OR valor_unitario >= 0);

ALTER TABLE voos DROP CONSTRAINT IF EXISTS ck_voos_pax;
ALTER TABLE voos ADD CONSTRAINT ck_voos_pax
  CHECK (pax IS NULL OR pax > 0);

ALTER TABLE voos DROP CONSTRAINT IF EXISTS ck_voos_escalas;
ALTER TABLE voos ADD CONSTRAINT ck_voos_escalas
  CHECK (escalas IS NULL OR escalas >= 0);

ALTER TABLE voos DROP CONSTRAINT IF EXISTS ck_voos_periodo;
ALTER TABLE voos ADD CONSTRAINT ck_voos_periodo
  CHECK (chegada IS NULL OR chegada >= partida);

NOTIFY pgrst, 'reload schema';

-- =======  DOWN  ========
-- ALTER TABLE voos ADD COLUMN IF NOT EXISTS data_voo DATE;
-- UPDATE voos SET data_voo = partida::DATE;
-- ALTER TABLE voos ALTER COLUMN data_voo SET NOT NULL;
-- ALTER TABLE voos DROP CONSTRAINT IF EXISTS ck_voos_valor;
-- ALTER TABLE voos DROP CONSTRAINT IF EXISTS ck_voos_pax;
-- ALTER TABLE voos DROP CONSTRAINT IF EXISTS ck_voos_escalas;
-- ALTER TABLE voos DROP CONSTRAINT IF EXISTS ck_voos_periodo;
-- ALTER TABLE voos DROP COLUMN IF EXISTS total;
-- ALTER TABLE voos DROP COLUMN IF EXISTS companhia;
-- ALTER TABLE voos DROP COLUMN IF EXISTS partida;
-- ALTER TABLE voos DROP COLUMN IF EXISTS chegada;
-- ALTER TABLE voos DROP COLUMN IF EXISTS escalas;
-- ALTER TABLE voos DROP COLUMN IF EXISTS aeroporto_escala;
-- ALTER TABLE voos DROP COLUMN IF EXISTS tempo_escala;
-- ALTER TABLE voos DROP COLUMN IF EXISTS moeda;
-- ALTER TABLE voos DROP COLUMN IF EXISTS valor_unitario;
-- ALTER TABLE voos DROP COLUMN IF EXISTS pax;
-- ALTER TABLE voos DROP COLUMN IF EXISTS status;
-- ALTER TABLE voos DROP COLUMN IF EXISTS link;
-- NOTIFY pgrst, 'reload schema';
