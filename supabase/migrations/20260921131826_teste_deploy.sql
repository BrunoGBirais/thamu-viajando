-- =============================================
-- ThaMu Viajando — tabela descartável para conferir o pipeline de migrations
-- Existe só para provar que um push na dev e um merge na main aplicam SQL nos
-- projetos certos. Depois de confirmado, apagar com uma migration nova (o CLI
-- nunca roda o bloco DOWN daqui).
-- =============================================

-- =======  UP  ========

CREATE TABLE IF NOT EXISTS teste_deploy (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  marca      text NOT NULL,
  aplicada_em timestamptz NOT NULL DEFAULT now()
);

-- Linha fixa para dar o carimbo de quando a migration rodou em cada projeto.
-- O id é constante e o ON CONFLICT torna a migration idempotente.
INSERT INTO teste_deploy (id, marca)
VALUES ('00000000-0000-0000-0000-000000000001', '20260921131826_teste_deploy')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE teste_deploy ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE teste_deploy FROM anon;

DROP POLICY IF EXISTS teste_deploy_all_authenticated ON teste_deploy;
CREATE POLICY teste_deploy_all_authenticated
  ON teste_deploy
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

NOTIFY pgrst, 'reload schema';

-- =======  DOWN  ========
-- DROP POLICY IF EXISTS teste_deploy_all_authenticated ON teste_deploy;
-- DROP TABLE IF EXISTS teste_deploy;
