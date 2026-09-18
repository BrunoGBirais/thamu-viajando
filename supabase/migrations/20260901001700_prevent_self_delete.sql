-- =============================================
-- ThaMu Viajando — 006: Prevent self-delete
-- A logged-in user cannot delete their OWN account
-- via thamu_viajando_admin_delete_user.
-- Run AFTER 005_prevent_self_role_change.sql
-- =============================================

-- =======  UP  ========

CREATE OR REPLACE FUNCTION thamu_viajando_admin_delete_user(p_user_id UUID)
RETURNS VOID
SECURITY DEFINER
SET search_path = auth, public
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT thamu_viajando_is_admin() THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores.' USING ERRCODE = '42501';
  END IF;

  -- Prevent a user from deleting themselves.
  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Você não pode excluir o seu próprio usuário.' USING ERRCODE = '42501';
  END IF;

  DELETE FROM auth.users
  WHERE id = p_user_id
    AND raw_user_meta_data->>'company_name' = 'thamu_viajando';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuário não encontrado ou pertence a outra empresa.' USING ERRCODE = '42501';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION thamu_viajando_admin_delete_user(UUID) TO authenticated;

NOTIFY pgrst, 'reload schema';

-- =======  DOWN  ========
-- Reverts to 004 version (no self-delete guard).
