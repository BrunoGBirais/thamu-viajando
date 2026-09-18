-- =============================================
-- ThaMu Viajando — 005: Prevent self-role change
-- An admin (or any logged-in user) cannot change their
-- OWN role via thamu_viajando_admin_update_user.
-- Run AFTER 004_company_scope.sql
-- =============================================

-- =======  UP  ========

DROP FUNCTION IF EXISTS thamu_viajando_admin_update_user(UUID, TEXT, TEXT);
CREATE OR REPLACE FUNCTION thamu_viajando_admin_update_user(
  p_user_id   UUID,
  p_full_name TEXT,
  p_role      TEXT DEFAULT NULL
)
RETURNS VOID
SECURITY DEFINER
SET search_path = auth, public
LANGUAGE plpgsql
AS $$
DECLARE
  new_meta      JSONB;
  current_role  TEXT;
BEGIN
  IF NOT thamu_viajando_is_admin() THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores.' USING ERRCODE = '42501';
  END IF;

  -- Prevent a user from changing their own role.
  IF p_role IS NOT NULL AND p_user_id = auth.uid() THEN
    SELECT COALESCE(raw_user_meta_data->>'role', 'visualizador')
      INTO current_role
      FROM auth.users
     WHERE id = p_user_id;

    IF current_role IS DISTINCT FROM p_role THEN
      RAISE EXCEPTION 'Você não pode alterar o seu próprio cargo.' USING ERRCODE = '42501';
    END IF;
  END IF;

  new_meta := jsonb_build_object('full_name', p_full_name);
  IF p_role IS NOT NULL THEN
    new_meta := new_meta || jsonb_build_object('role', p_role);
  END IF;

  UPDATE auth.users
  SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || new_meta,
      updated_at = NOW()
  WHERE id = p_user_id
    AND raw_user_meta_data->>'company_name' = 'thamu_viajando';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuário não encontrado ou pertence a outra empresa.' USING ERRCODE = '42501';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION thamu_viajando_admin_update_user(UUID, TEXT, TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';

-- =======  DOWN  ========
-- Reverts to 004 version (no self-role-change guard).
