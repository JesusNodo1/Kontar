-- Verificar estructura de tablas existentes
-- Ejecutar esto en Supabase SQL Editor para verificar

-- 1. Ver si existe la tabla licencias
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'licencias'
);

-- 2. Ver si existe la tabla dispositivos
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'dispositivos'
);

-- 3. Ver registros en licencias
SELECT id, codigo, nombre_empresa, activa FROM licencias;

-- 4. Ver registros en dispositivos
SELECT * FROM dispositivos;

-- 5. Ver políticas existentes
SELECT tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';

-- ============================================
-- CREAR TABLAS FALTANTES
-- ============================================

-- Tabla licencias (si no existe)
CREATE TABLE IF NOT EXISTS licencias (
    id serial primary key,
    codigo text unique not null,
    nombre_empresa text not null,
    email text not null,
    telefono text,
    limite_dispositivos int default 1,
    activa boolean default true,
    created_at timestamp with time zone default now()
);

-- Tabla dispositivos (si no existe)
CREATE TABLE IF NOT EXISTS dispositivos (
    id serial primary key,
    licencia_id int references licencias(id),
    dispositivo_id text not null,
    nombre_dispositivo text,
    registered_at timestamp with time zone default now()
);

-- Tabla usuarios_admin (si no existe)
CREATE TABLE IF NOT EXISTS usuarios_admin (
    id serial primary key,
    email text unique not null,
    password text not null,
    nombre text not null,
    created_at timestamp with time zone default now()
);

-- ============================================
-- POLÍTICAS (Policies) - IMPORTANTE
-- ============================================

-- Habilitar RLS si no está habilitado
ALTER TABLE licencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispositivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios_admin ENABLE ROW LEVEL SECURITY;

-- Policies para licencias (acceso público total)
DROP POLICY IF EXISTS "Public_licencias" ON licencias;
CREATE POLICY "Public_licencias" ON licencias FOR ALL USING (true) WITH CHECK (true);

-- Policies para dispositivos
DROP POLICY IF EXISTS "Public_dispositivos" ON dispositivos;
CREATE POLICY "Public_dispositivos" ON dispositivos FOR ALL USING (true) WITH CHECK (true);

-- Policies para usuarios_admin
DROP POLICY IF EXISTS "Public_usuarios_admin" ON usuarios_admin;
CREATE POLICY "Public_usuarios_admin" ON usuarios_admin FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- USUARIO ADMIN INICIAL
-- ============================================
INSERT INTO usuarios_admin (email, password, nombre) 
VALUES ('admin@conteo.com', 'admin123', 'Administrador')
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- LICENCIA DE EJEMPLO (si no existe)
-- ============================================
INSERT INTO licencias (codigo, nombre_empresa, email, telefono, limite_dispositivos, activa)
SELECT 'CNT-DEMO-TEST', 'Empresa Demo', 'demo@empresa.com', '+54 11 1234 5678', 5, true
WHERE NOT EXISTS (SELECT 1 FROM licencias WHERE codigo = 'CNT-DEMO-TEST');

-- ============================================
-- VERIFICAR PERMISOS API
-- ============================================
-- En Supabase: Settings -> API -> Table Permissions
-- Asegurate de que perfiles, inventarios, productos, zonas, conteo_producto, licencias, dispositivos tengan permisos de SELECT, INSERT, UPDATE, DELETE