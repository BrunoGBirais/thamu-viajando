-- =============================================
-- ThaMu Viajando — proposta_valores
-- Valores digitados à mão (campos com origem "manual") por cenário + template.
-- Run AFTER 009_proposta_templates.sql
-- =============================================

-- =======  UP  ========

CREATE TABLE IF NOT EXISTS proposta_valores (
    id             INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cenario_id     INTEGER NOT NULL REFERENCES cenarios(id) ON DELETE CASCADE,
    template_id    INTEGER NOT NULL REFERENCES proposta_templates(id) ON DELETE CASCADE,
    -- { "<chave do campo>": "texto digitado" }; ver lib/proposta/template.ts.
    valores        JSONB NOT NULL DEFAULT '{}'::jsonb,
    atualizado_em  TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_proposta_valores_cenario_template UNIQUE (cenario_id, template_id),
    CONSTRAINT ck_proposta_valores_objeto CHECK (jsonb_typeof(valores) = 'object')
);

ALTER TABLE proposta_valores ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE proposta_valores FROM anon;

DROP POLICY IF EXISTS proposta_valores_all_authenticated ON proposta_valores;
CREATE POLICY proposta_valores_all_authenticated
  ON proposta_valores
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

NOTIFY pgrst, 'reload schema';

-- =======  DOWN  ========
-- DROP TABLE IF EXISTS proposta_valores;
