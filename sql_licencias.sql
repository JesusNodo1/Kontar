-- ============================================
-- TABLAS PARA EL SISTEMA DE LICENCIAS
-- ============================================

-- Tabla licencias
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

-- Agregar columnas de login a perfiles (si no existen)
alter table perfiles add column if not exists email text;
alter table perfiles add column if not exists password text;
alter table perfiles add column if not exists licencia_id int;
alter table perfiles add column if not exists estado text default 'ACTIVO';

-- Actualizar el campo rol si existe y agregar valor por defecto
alter table perfiles alter column rol set default 'contador';

-- Tabla usuarios_admin (para el panel de licencias - SOLO NOSOTROS)
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

-- Policies para licencias
drop policy if exists "Public licencias" on licencias;
create policy "Public licencias" on licencias for all using (true) with check (true);

-- Policies para dispositivos
drop policy if exists "Public_dispositivos" on dispositivos;
create policy "Public_dispositivos" on dispositivos for all using (true) with check (true);

-- Policies para usuarios_admin
drop policy if exists "Public usuarios_admin" on usuarios_admin;
create policy "Public usuarios_admin" on usuarios_admin for all using (true) with check (true);

-- Policies para perfiles (con licencia)
drop policy if exists "Select_perfiles" on perfiles;
drop policy if exists "Insert_perfiles" on perfiles;
drop policy if exists "Update_perfiles" on perfiles;
create policy "Select_perfiles" on perfiles for select using (true);
create policy "Insert_perfiles" on perfiles for insert with check (true);
create policy "Update_perfiles" on perfiles for update using (true);

-- Policies para inventarios (con licencia)
drop policy if exists "Select_inventarios" on inventarios;
drop policy if exists "Insert_inventarios" on inventarios;
drop policy if exists "Update_inventarios" on inventarios;
create policy "Select_inventarios" on inventarios for select using (true);
create policy "Insert_inventarios" on inventarios for insert with check (true);
create policy "Update_inventarios" on inventarios for update using (true);

-- Policies para productos (con licencia)
drop policy if exists "Select_productos" on productos;
drop policy if exists "Insert_productos" on productos;
drop policy if exists "Update_productos" on productos;
drop policy if exists "Delete_productos" on productos;
create policy "Select_productos" on productos for select using (true);
create policy "Insert_productos" on productos for insert with check (true);
create policy "Update_productos" on productos for update using (true);
create policy "Delete_productos" on productos for delete using (true);

-- Policies para zonas (con licencia)
drop policy if exists "Select_zonas" on zonas;
drop policy if exists "Insert_zonas" on zonas;
drop policy if exists "Update_zonas" on zonas;
create policy "Select_zonas" on zonas for select using (true);
create policy "Insert_zonas" on zonas for insert with check (true);
create policy "Update_zonas" on zonas for update using (true);

-- Policies para conteo_producto (con licencia)
drop policy if exists "Select_conteo" on conteo_producto;
drop policy if exists "Insert_conteo" on conteo_producto;
drop policy if exists "Update_conteo" on conteo_producto;
drop policy if exists "Delete_conteo" on conteo_producto;
create policy "Select_conteo" on conteo_producto for select using (true);
create policy "Insert_conteo" on conteo_producto for insert with check (true);
create policy "Update_conteo" on conteo_producto for update using (true);
create policy "Delete_conteo" on conteo_producto for delete using (true);

-- Usuario admin inicial para licencias.html
insert into usuarios_admin (email, password, nombre) 
values ('admin@conteo.com', 'admin123', 'Administrador')
on conflict (email) do nothing;
