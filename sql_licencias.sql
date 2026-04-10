-- =============================================================================
-- SISTEMA DE CONTEO DE INVENTARIO - ESQUEMA COMPLETO DE BASE DE DATOS
-- =============================================================================

-- 1. TABLAS MAESTRAS

-- Licencias: Gestiona el acceso multi-tenant
CREATE TABLE IF NOT EXISTS licencias (
    id SERIAL PRIMARY KEY,
    codigo TEXT UNIQUE NOT NULL,
    nombre_empresa TEXT NOT NULL,
    email TEXT NOT NULL,
    telefono TEXT,
    limite_dispositivos INT DEFAULT 1,
    activa BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Usuarios del Panel de Vendedor (Administradores del Sistema)
CREATE TABLE IF NOT EXISTS usuarios_admin (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    nombre TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Usuarios de la aplicación (Clientes)
CREATE TABLE IF NOT EXISTS perfiles (
    id SERIAL PRIMARY KEY,
    licencia_id INT REFERENCES licencias(id),
    nombre TEXT NOT NULL,
    email TEXT NOT NULL,
    password TEXT NOT NULL,
    rol TEXT NOT NULL CHECK (rol IN ('administrador', 'contador')),
    estado TEXT DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(email, licencia_id)
);

-- Terminales registradas vinculadas a una licencia
CREATE TABLE IF NOT EXISTS dispositivos (
    id SERIAL PRIMARY KEY,
    licencia_id INT REFERENCES licencias(id),
    dispositivo_id TEXT NOT NULL,
    nombre_dispositivo TEXT,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(dispositivo_id, licencia_id)
);

-- 2. TABLAS DE OPERACIÓN

-- Inventarios: Sesiones de conteo globales
CREATE TABLE IF NOT EXISTS inventarios (
    id SERIAL PRIMARY KEY,
    licencia_id INT REFERENCES licencias(id),
    nombre TEXT NOT NULL,
    sucursal TEXT NOT NULL,
    deposito TEXT,
    fecha_inicio DATE NOT NULL,
    fecha_limite DATE NOT NULL,
    estado TEXT DEFAULT 'abierto' CHECK (estado IN ('abierto', 'finalizado')),
    total_productos INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Zonas: Divisiones físicas dentro de un inventario
CREATE TABLE IF NOT EXISTS zonas (
    id SERIAL PRIMARY KEY,
    inventario_id INT REFERENCES inventarios(id),
    nombre TEXT NOT NULL,
    descripcion TEXT,
    finalizada BOOLEAN DEFAULT FALSE,
    total_productos INT DEFAULT 0,
    productos_contados INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Productos: Catálogo de productos por licencia
CREATE TABLE IF NOT EXISTS productos (
    id SERIAL PRIMARY KEY,
    licencia_id INT REFERENCES licencias(id),
    sku TEXT,
    nombre TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conteos: Registros individuales de conteo por producto y zona
CREATE TABLE IF NOT EXISTS conteo_producto (
    id SERIAL PRIMARY KEY,
    zona_id INT REFERENCES zonas(id),
    producto_id INT REFERENCES productos(id),
    cantidad INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ÍNDICES PARA OPTIMIZACIÓN
CREATE INDEX IF NOT EXISTS idx_perfiles_licencia ON perfiles(licencia_id);
CREATE INDEX IF NOT EXISTS idx_dispositivos_id ON dispositivos(dispositivo_id);
CREATE INDEX IF NOT EXISTS idx_inventarios_licencia ON inventarios(licencia_id);
CREATE INDEX IF NOT EXISTS idx_zonas_inv ON zonas(inventario_id);
CREATE INDEX IF NOT EXISTS idx_productos_licencia ON productos(licencia_id);
CREATE INDEX IF NOT EXISTS idx_conteo_zona ON conteo_producto(zona_id);

-- 4. SEGURIDAD (RLS - Row Level Security)
-- Habilitar RLS en todas las tablas
ALTER TABLE licencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios_admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispositivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE zonas ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE conteo_producto ENABLE ROW LEVEL SECURITY;

-- Políticas Públicas (Ajustar según necesidad de seguridad real)
DROP POLICY IF EXISTS "Public_licencias" ON licencias;
CREATE POLICY "Public_licencias" ON licencias FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public_usuarios_admin" ON usuarios_admin;
CREATE POLICY "Public_usuarios_admin" ON usuarios_admin FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public_perfiles" ON perfiles;
CREATE POLICY "Public_perfiles" ON perfiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public_dispositivos" ON dispositivos;
CREATE POLICY "Public_dispositivos" ON dispositivos FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public_inventarios" ON inventarios;
CREATE POLICY "Public_inventarios" ON inventarios FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public_zonas" ON zonas;
CREATE POLICY "Public_zonas" ON zonas FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public_productos" ON productos;
CREATE POLICY "Public_productos" ON productos FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public_conteo_producto" ON conteo_producto;
CREATE POLICY "Public_conteo_producto" ON conteo_producto FOR ALL USING (true) WITH CHECK (true);

-- 5. DATOS INICIALES DE PRUEBA

-- Administrador del sistema (Vendedor)
INSERT INTO usuarios_admin (email, password, nombre) 
VALUES ('admin@conteo.com', 'admin123', 'Administrador')
ON CONFLICT (email) DO NOTHING;

-- Licencia Demo
INSERT INTO licencias (codigo, nombre_empresa, email, telefono, limite_dispositivos, activa)
VALUES ('CNT-DEMO-TEST', 'Empresa Demo', 'demo@empresa.com', '+54 11 1234 5678', 5, true)
ON CONFLICT DO NOTHING;

-- Usuario Demo (Admin de la empresa cliente)
-- Nota: Se asume que la licencia demo tiene ID 1
INSERT INTO perfiles (nombre, email, password, rol, licencia_id, estado)
VALUES ('Demo Admin', 'demo@empresa.com', '12345', 'administrador', 1, 'ACTIVO')
ON CONFLICT DO NOTHING;
