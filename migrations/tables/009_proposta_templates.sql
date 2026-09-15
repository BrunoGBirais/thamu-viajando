-- =============================================
-- ThaMu Viajando — proposta_templates
-- Layout vem de uma imagem exportada do Canva; só os campos são dinâmicos.
-- =============================================

-- =======  UP  ========

CREATE TABLE IF NOT EXISTS proposta_templates (
    id               INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome             VARCHAR(160) NOT NULL,
    canva_design_id  VARCHAR(80),
    -- Uma URL por página do template, na ordem.
    paginas          TEXT[] NOT NULL,
    largura_mm       NUMERIC(6,2) NOT NULL DEFAULT 210,
    altura_mm        NUMERIC(6,2) NOT NULL DEFAULT 297,
    -- Posições em % da página; ver lib/proposta/template.ts.
    campos           JSONB NOT NULL DEFAULT '[]'::jsonb,
    ativo            BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em        TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT ck_proposta_templates_paginas CHECK (cardinality(paginas) > 0)
);

ALTER TABLE proposta_templates ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE proposta_templates FROM anon;

DROP POLICY IF EXISTS proposta_templates_all_authenticated ON proposta_templates;
CREATE POLICY proposta_templates_all_authenticated
  ON proposta_templates
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

NOTIFY pgrst, 'reload schema';

-- =======  EXEMPLO  ========
-- Suba os PNGs exportados do Canva no Storage e ajuste as coordenadas (em % da página).
-- fontSize também é % da largura da página, então o layout escala em qualquer tamanho.
--
-- INSERT INTO proposta_templates (nome, canva_design_id, paginas, largura_mm, altura_mm, campos) VALUES (
--   'Proposta praia — 2 páginas',
--   'DAGxxxxxxxx',
--   ARRAY[
--     'https://<projeto>.supabase.co/storage/v1/object/public/propostas/template-1-p1.png',
--     'https://<projeto>.supabase.co/storage/v1/object/public/propostas/template-1-p2.png'
--   ],
--   285.75, 357.19,   -- 1080x1350 px
--   '[
--     {"campo":"cliente.nome","pagina":1,"x":10,"y":62,"w":80,"fontSize":5,"align":"center","peso":700},
--     {"campo":"cenario.destino","pagina":1,"x":10,"y":70,"w":80,"fontSize":3.5,"align":"center"},
--     {"campo":"cenario.data_inicio","formato":"data","pagina":1,"x":10,"y":76,"w":38,"fontSize":2.6,"align":"right"},
--     {"campo":"cenario.data_fim","formato":"data","pagina":1,"x":52,"y":76,"w":38,"fontSize":2.6},
--     {"tipo":"lista","fonte":"voos","pagina":2,"x":12,"y":30,"w":76,"fontSize":2.4,
--      "linha":"{cia} · {origem} → {destino} · {data_partida:data} · {total:moeda}"},
--     {"tipo":"lista","fonte":"passeios","pagina":2,"x":12,"y":60,"w":76,"fontSize":2.4,
--      "linha":"{descricao} · {cidade} · {valor_total:moeda}"}
--   ]'::jsonb
-- );

-- =======  DOWN  ========
-- DROP TABLE IF EXISTS proposta_templates;
