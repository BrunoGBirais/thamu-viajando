-- =============================================
-- ThaMu Viajando — contexto do template para o agente de IA
-- A descrição vai no payload enviado ao n8n junto com a descrição de cada campo.
-- =============================================

-- =======  UP  ========

ALTER TABLE proposta_templates
  ADD COLUMN IF NOT EXISTS descricao TEXT;

COMMENT ON COLUMN proposta_templates.descricao IS
  'Contexto do modelo para a IA: tom, público e o que cada seção representa.';

NOTIFY pgrst, 'reload schema';

-- =======  DOWN  ========
-- ALTER TABLE proposta_templates DROP COLUMN IF EXISTS descricao;
