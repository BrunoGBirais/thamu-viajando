-- =============================================
-- ThaMu Viajando — bucket das imagens de fundo dos templates de proposta
-- Público de propósito: são artes, não dados de cliente, e o <img> do
-- documento precisa carregá-las sem token.
-- =============================================

-- =======  UP  ========

INSERT INTO storage.buckets (id, name, public)
VALUES ('propostas', 'propostas', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS propostas_read_public ON storage.objects;
CREATE POLICY propostas_read_public
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'propostas');

DROP POLICY IF EXISTS propostas_write_authenticated ON storage.objects;
CREATE POLICY propostas_write_authenticated
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'propostas');

DROP POLICY IF EXISTS propostas_update_authenticated ON storage.objects;
CREATE POLICY propostas_update_authenticated
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'propostas')
  WITH CHECK (bucket_id = 'propostas');

-- =======  DOWN  ========
-- DROP POLICY IF EXISTS propostas_update_authenticated ON storage.objects;
-- DROP POLICY IF EXISTS propostas_write_authenticated ON storage.objects;
-- DROP POLICY IF EXISTS propostas_read_public ON storage.objects;
-- DELETE FROM storage.buckets WHERE id = 'propostas';
