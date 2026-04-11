-- ============================================
-- ACTUALIZAR SEGÚN TU ESTRUCTURA EXISTENTE
-- ============================================

-- 1. Agregar licencia_id a inventarios (ya lo agregaste)
-- 2. Agregar licencia_id a productos (ya lo agregaste)
-- 3. Agregar licencia_id a zonas (ya lo agregaste)
-- 4. Agregar licencia_id a conteo_producto (ya lo agregaste)

-- Tabla licencias (nueva)
create table if not exists licencias (
    id serial primary key,
    codigo text unique not null,
    nombre_empresa text not null,
    email text not null,
    telefono text,
    limite_dispositivos int default 1,
    activa boolean default true,
    created_at timestamp with time zone default now()
);

-- Tabla usuarios_admin (panel del vendedor - NOSOTROS)
create table if not exists usuarios_admin (
    id serial primary key,
    email text unique not null,
    password text not null,
    nombre text not null,
    created_at timestamp with time zone default now()
);

-- Tabla dispositivos (terminales registradas)
create table if not exists dispositivos (
    id serial primary key,
    licencia_id int references licencias(id),
    dispositivo_id text not null,
    nombre_dispositivo text,
    registered_at timestamp with time zone default now()
);

-- Agregar columnas faltantes a perfiles si no existen
alter table perfiles add column if not exists password text;
alter table perfiles add column if not exists licencia_id int;
alter table perfiles add column if not exists estado text default 'ACTIVO';

-- Habilitar RLS
alter table licencias enable row level security;
alter table dispositivos enable row level security;
alter table usuarios_admin enable row level security;
alter table perfiles enable row level security;

-- Policies por operación (más restrictivas que "FOR ALL")

-- usuarios_admin: solo lectura (login del vendedor)
drop policy if exists "Public_usuarios_admin" on usuarios_admin;
create policy "anon_select_usuarios_admin" on usuarios_admin for select using (true);

-- licencias: lectura + escritura, sin DELETE
drop policy if exists "Public_licencias" on licencias;
create policy "anon_select_licencias" on licencias for select using (true);
create policy "anon_insert_licencias" on licencias for insert with check (true);
create policy "anon_update_licencias" on licencias for update using (true) with check (true);

-- dispositivos: lectura + insert, sin UPDATE ni DELETE
drop policy if exists "Public_dispositivos" on dispositivos;
create policy "anon_select_dispositivos" on dispositivos for select using (true);
create policy "anon_insert_dispositivos" on dispositivos for insert with check (true);

-- perfiles: lectura + escritura, sin DELETE
drop policy if exists "Public_perfiles" on perfiles;
create policy "anon_select_perfiles" on perfiles for select using (true);
create policy "anon_insert_perfiles" on perfiles for insert with check (true);
create policy "anon_update_perfiles" on perfiles for update using (true) with check (true);

-- Usuario admin inicial
insert into usuarios_admin (email, password, nombre) 
values ('admin@conteo.com', 'admin123', 'Administrador')
on conflict (email) do nothing;

-- Crear una licencia de ejemplo
insert into licencias (codigo, nombre_empresa, email, telefono, limite_dispositivos, activa)
values ('CNT-DEMO-TEST', 'Empresa Demo', 'demo@empresa.com', '+54 11 1234 5678', 5, true);

-- Crear usuario demo en perfiles (password texto plano: "12345")
insert into perfiles (nombre, email, password, rol, licencia_id, estado)
values ('Demo Admin', 'demo@empresa.com', '12345', 'administrador', 1, 'ACTIVO');