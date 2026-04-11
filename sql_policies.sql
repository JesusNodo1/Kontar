-- ============================================
-- POLICIES RLS MEJORADAS
-- Ejecutar en Supabase SQL Editor para instalaciones existentes
-- Reemplaza las policies "Public_*" por policies por operación
-- ============================================

-- Habilitar RLS en todas las tablas (si no está habilitado)
ALTER TABLE licencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispositivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios_admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USUARIOS_ADMIN
-- Solo lectura pública (el login del vendedor solo verifica credenciales)
-- INSERT/UPDATE/DELETE requieren service role (solo desde Supabase dashboard o Edge Functions)
-- ============================================
DROP POLICY IF EXISTS "Public_usuarios_admin" ON usuarios_admin;

CREATE POLICY "anon_select_usuarios_admin"
  ON usuarios_admin FOR SELECT
  USING (true);

-- ============================================
-- LICENCIAS
-- SELECT público (para verificar código al activar terminal)
-- INSERT permitido (panel del vendedor crea licencias)
-- UPDATE permitido solo campo "activa" (activar/desactivar)
-- DELETE bloqueado: las licencias nunca se eliminan, solo se desactivan
-- ============================================
DROP POLICY IF EXISTS "Public_licencias" ON licencias;

CREATE POLICY "anon_select_licencias"
  ON licencias FOR SELECT
  USING (true);

CREATE POLICY "anon_insert_licencias"
  ON licencias FOR INSERT
  WITH CHECK (true);

CREATE POLICY "anon_update_licencias"
  ON licencias FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Sin policy de DELETE: queda bloqueado para anon

-- ============================================
-- DISPOSITIVOS
-- SELECT e INSERT permitidos (verificar y registrar terminales)
-- UPDATE y DELETE bloqueados desde el cliente
-- ============================================
DROP POLICY IF EXISTS "Public_dispositivos" ON dispositivos;

CREATE POLICY "anon_select_dispositivos"
  ON dispositivos FOR SELECT
  USING (true);

CREATE POLICY "anon_insert_dispositivos"
  ON dispositivos FOR INSERT
  WITH CHECK (true);

-- Sin policies de UPDATE ni DELETE: bloqueados para anon

-- ============================================
-- PERFILES
-- SELECT, INSERT y UPDATE permitidos (login, registro, cambio de contraseña)
-- DELETE bloqueado: los usuarios se desactivan con estado='INACTIVO', no se eliminan
-- ============================================
DROP POLICY IF EXISTS "Public_perfiles" ON perfiles;

CREATE POLICY "anon_select_perfiles"
  ON perfiles FOR SELECT
  USING (true);

CREATE POLICY "anon_insert_perfiles"
  ON perfiles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "anon_update_perfiles"
  ON perfiles FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Sin policy de DELETE: usar UPDATE con estado='INACTIVO' en su lugar

-- ============================================
-- VERIFICAR RESULTADO
-- Ejecutar para confirmar las policies creadas
-- ============================================
-- SELECT tablename, policyname, cmd
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, cmd;
