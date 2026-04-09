# Conteo de Inventario - Sistema Multi-Tenant

Sistema de conteo de inventario con gestión de licencias para múltiples clientes.

## Requisitos

- Hosting con PHP (Hostinger u otro)
- Base de datos Supabase
- Dominio con SSL (HTTPS)

## Archivos

```
Conteo/
├── .htaccess          # Configuración del servidor
├── admin.html         # Panel de administración
├── Contador.html      # App móvil (PWA)
├── licencias.html      # Panel del vendedor
├── login.html         # Login/Registro
├── manifest.json      # Configuración PWA
├── styles.css        # Estilos
├── sw.js             # Service Worker
└── sql_licencias.sql # Schema de base de datos (NO subir)
```

## Instalación

### 1. Subir archivos

Subir todos los archivos a la carpeta `public_html` de Hostinger, excepto `sql_licencias.sql`.

### 2. Configurar Supabase

1. Ir a [Supabase](https://supabase.com)
2. Crear nuevo proyecto
3. Copiar la URL y la API Key (anon/public)

### 3. Ejecutar SQL

En el SQL Editor de Supabase, ejecutar el contenido de `sql_licencias.sql`.

### 4. Configurar API Key

En cada archivo HTML, verificar que la URL de Supabase y API Key sean correctas:

```javascript
const supabaseUrl = 'https://tu-proyecto.supabase.co';
const supabaseKey = 'tu-api-key';
```

### 5. Crear usuario admin

Ejecutar en SQL Editor:

```sql
INSERT INTO usuarios_admin (email, password, nombre) 
VALUES ('admin@tuempresa.com', 'tu-password', 'Administrador');
```

## URLs del Sistema

| Página | Descripción |
|--------|-------------|
| `/login.html` | Login y registro de terminales |
| `/admin.html` | Panel de administración |
| `/Contador.html` | App móvil para contadores |
| `/licencias.html` | Gestión de licencias (vendedor) |

## Flujo de Uso

### Para el Vendedor

1. Acceder a `/licencias.html`
2. Login con credenciales de admin
3. Crear licencia → se genera automáticamente:
   - Código de licencia (CNT-XXXX-XXXX)
   - Usuario admin con contraseña temporal

### Para el Cliente

1. Primera vez: Ir a `/login.html` → "Activar terminal"
   - Ingresar email y código de licencia
   - Se registra la terminal y crea usuario admin
   - Redirige a login

2. Iniciar sesión: `/login.html`
   - Ingresar email y contraseña
   - Redirige según rol:
     - Administrador → `/admin.html`
     - Contador → `/Contador.html`

## Roles de Usuario

| Rol | Descripción | Acceso |
|-----|-------------|--------|
| `administrador` | Admin de la licencia | admin.html |
| `contador` | Usuario de conteo | Contador.html |

## PWA - Instalar en Móvil

1. Acceder al sitio desde el móvil
2. Aparecerá opción "Instalar" o usar menú del navegador
3. La app funciona offline con datos en caché

## Seguridad

- Cookies con `SameSite=Lax` para sesiones
- Verificación de terminal registrada en cada acceso
- Contraseñas almacenadas en texto plano (para desarrollo)

## Soporte

Para soporte técnico, contactar al administrador del sistema.
