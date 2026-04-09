// ============================================
// API CLIENTE COMPARTIDO - Sistema de Conteo
// ============================================

const supabaseUrl = 'https://jeupnfxzawgrtddnhvij.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpldXBuZnh6YXdncnRkZG5odmlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0ODY5NTgsImV4cCI6MjA5MTA2Mjk1OH0.qmABLeL-3iJ3f6l7GdDnEshweuUtSM5YRSTSzby9N0g';

// ============================================
// COOKIES
// ============================================

function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name, value, days = 365) {
  document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=${days * 24 * 60 * 60};SameSite=Lax`;
}

function deleteCookie(name) {
  document.cookie = `${name}=;path=/;max-age=0`;
}

function getDeviceId() {
  let id = getCookie('device_id');
  if (!id) {
    id = 'dev_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    setCookie('device_id', id);
  }
  return id;
}

function getSesion() {
  const sesion = getCookie('sesion');
  return sesion ? JSON.parse(sesion) : null;
}

function guardarSesion(usuario, dias = 30) {
  setCookie('sesion', JSON.stringify(usuario), dias);
}

function clearSesion() {
  deleteCookie('sesion');
}

// ============================================
// API - GET con límites y manejo de errores
// ============================================

class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

async function apiGet(tabla, params = '') {
  // Agregar límite por defecto si no se especifica
  const limitParam = params.includes('limit=') ? '' : '&limit=100';
  
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/${tabla}${params}${limitParam}`, {
      headers: { 
        'apikey': supabaseKey, 
        'Authorization': `Bearer ${supabaseKey}`,
        'Accept': 'application/json'
      }
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new ApiError(
        `Error en ${tabla}: ${res.status}`,
        res.status,
        errorText
      );
    }
    
    const data = await res.json();
    return { success: true, data: Array.isArray(data) ? data : [], total: data?.length || 0 };
    
  } catch (e) {
    console.error(`API GET error (${tabla}):`, e);
    if (e instanceof ApiError) throw e;
    return { success: false, data: [], error: e.message };
  }
}

// ============================================
// API - POST
// ============================================

async function apiPost(tabla, data) {
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/${tabla}`, {
      method: 'POST',
      headers: { 
        'apikey': supabaseKey, 
        'Authorization': `Bearer ${supabaseKey}`, 
        'Content-Type': 'application/json', 
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(data)
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new ApiError(
        `Error creando en ${tabla}: ${res.status}`,
        res.status,
        errorText
      );
    }
    
    const result = await res.json();
    return { success: true, data: Array.isArray(result) ? result : [result] };
    
  } catch (e) {
    console.error(`API POST error (${tabla}):`, e);
    if (e instanceof ApiError) throw e;
    return { success: false, data: [], error: e.message };
  }
}

// ============================================
// API - PATCH
// ============================================

async function apiPatch(tabla, params, data) {
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/${tabla}${params}`, {
      method: 'PATCH',
      headers: { 
        'apikey': supabaseKey, 
        'Authorization': `Bearer ${supabaseKey}`, 
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(data)
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new ApiError(
        `Error actualizando ${tabla}: ${res.status}`,
        res.status,
        errorText
      );
    }
    
    const result = await res.json();
    return { success: true, data: Array.isArray(result) ? result : [result] };
    
  } catch (e) {
    console.error(`API PATCH error (${tabla}):`, e);
    if (e instanceof ApiError) throw e;
    return { success: false, data: [], error: e.message };
  }
}

// ============================================
// API - DELETE
// ============================================

async function apiDelete(tabla, params) {
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/${tabla}${params}`, {
      method: 'DELETE',
      headers: { 
        'apikey': supabaseKey, 
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    
    if (!res.ok && res.status !== 204) {
      const errorText = await res.text();
      throw new ApiError(
        `Error eliminando ${tabla}: ${res.status}`,
        res.status,
        errorText
      );
    }
    
    return { success: true };
    
  } catch (e) {
    console.error(`API DELETE error (${tabla}):`, e);
    if (e instanceof ApiError) throw e;
    return { success: false, error: e.message };
  }
}

// ============================================
// CONSULTAS COMUNES
// ============================================

async function verificarLicencia(licenciaId) {
  const result = await apiGet(`licencias?id=eq.${licenciaId}&activa=eq.true&select=id`);
  return result.success && result.data.length > 0;
}

async function verificarDispositivo(licenciaId) {
  const deviceId = getDeviceId();
  const result = await apiGet(`dispositivos?dispositivo_id=eq.${encodeURIComponent(deviceId)}&licencia_id=eq.${licenciaId}&select=id`);
  return result.success && result.data.length > 0;
}

async function verificarUsuario(email, password) {
  const result = await apiGet(`perfiles?email=eq.${encodeURIComponent(email)}&password=eq.${encodeURIComponent(password)}&estado=eq.ACTIVO&select=id,nombre,email,rol,estado,licencia_id`);
  return result.success && result.data.length > 0 ? result.data[0] : null;
}

async function crearUsuario(licenciaId, email, password, nombre, rol = 'contador') {
  return apiPost('perfiles', {
    licencia_id: licenciaId,
    email,
    password,
    nombre,
    rol,
    estado: 'ACTIVO'
  });
}

// ============================================
// GENERADORES
// ============================================

function generarCodigoLicencia() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let c = 'CNT-';
  for (let i = 0; i < 4; i++) c += chars[Math.floor(Math.random() * chars.length)];
  c += '-';
  for (let i = 0; i < 4; i++) c += chars[Math.floor(Math.random() * chars.length)];
  return c;
}

function generarPassword(length = 8) {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let p = '';
  for (let i = 0; i < length; i++) p += chars[Math.floor(Math.random() * chars.length)];
  return p;
}

// ============================================
// HASHING DE CONTRASEÑAS (Web Crypto API)
// ============================================

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function hashPasswordWithSalt(password, salt = '') {
  const combined = password + salt;
  return hashPassword(combined);
}

// ============================================
// VALIDACIONES
// ============================================

function validarEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function validarCodigoLicencia(codigo) {
  const re = /^CNT-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  return re.test(codigo);
}

// ============================================
// EXPORTAR A CSV
// ============================================

function exportarCSV(data, filename, columns) {
  if (!data || data.length === 0) return;
  
  const headers = columns.map(c => c.label);
  const rows = data.map(item => 
    columns.map(c => {
      const val = item[c.key];
      return typeof val === 'string' && val.includes(',') ? `"${val}"` : (val || '');
    })
  );
  
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// ============================================
// EXPORTAR
// ============================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    supabaseUrl,
    supabaseKey,
    getCookie,
    setCookie,
    deleteCookie,
    getDeviceId,
    getSesion,
    guardarSesion,
    clearSesion,
    apiGet,
    apiPost,
    apiPatch,
    apiDelete,
    verificarLicencia,
    verificarDispositivo,
    verificarUsuario,
    crearUsuario,
    generarCodigoLicencia,
    generarPassword,
    hashPassword,
    hashPasswordWithSalt,
    validarEmail,
    validarCodigoLicencia,
    exportarCSV,
    ApiError
  };
}