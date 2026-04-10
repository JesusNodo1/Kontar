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

-- Policies
drop policy if exists "Public_licencias" on licencias;
create policy "Public_licencias" on licencias for all using (true) with check (true);

drop policy if exists "Public_dispositivos" on dispositivos;
create policy "Public_dispositivos" on dispositivos for all using (true) with check (true);

drop policy if exists "Public_usuarios_admin" on usuarios_admin;
create policy "Public_usuarios_admin" on usuarios_admin for all using (true) with check (true);

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