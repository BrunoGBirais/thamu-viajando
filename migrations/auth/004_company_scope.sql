-- =============================================
-- ThaMu Viajando — 004: Scope admin functions by company_name
-- Only users with raw_user_meta_data->>'company_name' = 'thamu_viajando'
-- are visible/manageable from this project.
-- Run AFTER 003_admin_guards.sql
-- =============================================

-- =======  UP  ========

-- list_users: filter by company_name
DROP FUNCTION IF EXISTS thamu_viajando_admin_list_users();
CREATE OR REPLACE FUNCTION thamu_viajando_admin_list_users()
RETURNS TABLE(
  user_id    UUID,
  email      TEXT,
  full_name  TEXT,
  role       TEXT,
  created_at TIMESTAMPTZ
)
SECURITY DEFINER
SET search_path = auth, public
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  IF NOT thamu_viajando_is_admin() THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores.' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
    SELECT
      u.id AS user_id,
      u.email::TEXT,
      COALESCE(u.raw_user_meta_data->>'full_name', '')::TEXT AS full_name,
      COALESCE(u.raw_user_meta_data->>'role', 'visualizador')::TEXT AS role,
      u.created_at
    FROM auth.users u
    WHERE u.raw_user_meta_data->>'company_name' = 'thamu_viajando'
    ORDER BY u.created_at DESC;
END;
$$;

-- confirm_user: admin-only + same company
CREATE OR REPLACE FUNCTION thamu_viajando_admin_confirm_user(p_user_id UUID)
RETURNS VOID
SECURITY DEFINER
SET search_path = auth, public
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT thamu_viajando_is_admin() THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores.' USING ERRCODE = '42501';
  END IF;
  UPDATE auth.users
  SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb)
                           || jsonb_build_object('company_name', 'thamu_viajando'),
      email_confirmed_at = NOW(),
      updated_at = NOW()
  WHERE id = p_user_id
    AND (
      raw_user_meta_data->>'company_name' = 'thamu_viajando'
      OR raw_user_meta_data->>'company_name' IS NULL
    );
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuário não encontrado ou pertence a outra empresa.' USING ERRCODE = '42501';
  END IF;
END;
$$;

-- update_user: admin-only + same company
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
  new_meta JSONB;
BEGIN
  IF NOT thamu_viajando_is_admin() THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores.' USING ERRCODE = '42501';
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

-- delete_user: admin-only + same company
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
  DELETE FROM auth.users
  WHERE id = p_user_id
    AND raw_user_meta_data->>'company_name' = 'thamu_viajando';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuário não encontrado ou pertence a outra empresa.' USING ERRCODE = '42501';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION thamu_viajando_admin_list_users() TO authenticated;
GRANT EXECUTE ON FUNCTION thamu_viajando_admin_confirm_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION thamu_viajando_admin_update_user(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION thamu_viajando_admin_delete_user(UUID) TO authenticated;

NOTIFY pgrst, 'reload schema';

-- =======  BACKFILL  ========
-- Mark existing admin/visualizador users as belonging to this project.
-- Review this list before running if the DB is shared across companies.
UPDATE auth.users
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb)
                         || jsonb_build_object('company_name', 'thamu_viajando')
WHERE raw_user_meta_data->>'company_name' IS NULL;

-- =======  DOWN  ========
-- Reverts to 003 versions (no company scope).
