// ============================================
// API CORE - SISTEMA DE CONTEO
// Centraliza toda la comunicación con Supabase y gestión de sesión
// ============================================

const CONFIG = {
  supabaseUrl: 'https://jeupnfxzawgrtddnhvij.supabase.co',
  supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpldXBuZnh6YXdncnRkZG5odmlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0ODY5NTgsImV4cCI6MjA5MTA2Mjk1OH0.qmABLeL-3iJ3f6l7GdDnEshweuUtSM5YRSTSzby9N0g',
  VERSION: 'v=4'
};

// ============================================
// GESTIÓN DE COOKIES Y SESIÓN
// ============================================

export const CookieManager = {
  get(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  },

  set(name, value, days = 365) {
    const secure = location.protocol === 'https:' ? ';Secure' : '';
    document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=${days * 24 * 60 * 60};SameSite=Strict${secure}`;
  },

  delete(name) {
    document.cookie = `${name}=;path=/;max-age=0`;
  },

  getDeviceId() {
    let id = this.get('device_id');
    if (!id) {
      id = 'dev_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      this.set('device_id', id);
    }
    return id;
  },

  getSesion() {
    const sesion = this.get('sesion');
    return sesion ? JSON.parse(sesion) : null;
  },

  guardarSesion(usuario, dias = 30) {
    this.set('sesion', JSON.stringify(usuario), dias);
  },

  clearSesion() {
    this.delete('sesion');
  }
};

// ============================================
// CLIENTE API CON RETRY Y MANEJO DE ERRORES
// ============================================

async function fetchWithRetry(url, options = {}, retries = 3, delay = 1000) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return res;
      if (res.status === 503 && attempt < retries - 1) {
        await new Promise(r => setTimeout(r, delay));
        delay *= 2;
        continue;
      }
      return res;
    } catch (e) {
      if (attempt < retries - 1) {
        await new Promise(r => setTimeout(r, delay));
        delay *= 2;
        continue;
      }
      throw e;
    }
  }
  throw new Error('Max retries exceeded');
}

export const Api = {
  async get(tabla, params = '') {
    const limitParam = params.includes('limit=') ? '' : '&limit=100';
    try {
      const res = await fetchWithRetry(`${CONFIG.supabaseUrl}/rest/v1/${tabla}${params}${limitParam}`, {
        headers: { 'apikey': CONFIG.supabaseKey, 'Authorization': `Bearer ${CONFIG.supabaseKey}` }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return { success: true, data: Array.isArray(data) ? data : [], total: data?.length || 0 };
    } catch (e) {
      console.error(`API GET error (${tabla}):`, e);
      return { success: false, data: [], error: e.message };
    }
  },

  async post(tabla, data) {
    try {
      const res = await fetchWithRetry(`${CONFIG.supabaseUrl}/rest/v1/${tabla}`, {
        method: 'POST',
        headers: { 
          'apikey': CONFIG.supabaseKey, 
          'Authorization': `Bearer ${CONFIG.supabaseKey}`, 
          'Content-Type': 'application/json', 
          'Prefer': 'return=representation' 
        },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      return { success: true, data: Array.isArray(result) ? result : [result] };
    } catch (e) {
      console.error(`API POST error (${tabla}):`, e);
      return { success: false, data: [], error: e.message };
    }
  },

  async patch(tabla, params, data) {
    try {
      const res = await fetchWithRetry(`${CONFIG.supabaseUrl}/rest/v1/${tabla}${params}`, {
        method: 'PATCH',
        headers: { 
          'apikey': CONFIG.supabaseKey, 
          'Authorization': `Bearer ${CONFIG.supabaseKey}`, 
          'Content-Type': 'application/json', 
          'Prefer': 'return=representation' 
        },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      return { success: true, data: Array.isArray(result) ? result : [result] };
    } catch (e) {
      console.error(`API PATCH error (${tabla}):`, e);
      return { success: false, data: [], error: e.message };
    }
  },

  async delete(tabla, params) {
    try {
      const res = await fetchWithRetry(`${CONFIG.supabaseUrl}/rest/v1/${tabla}${params}`, {
        method: 'DELETE',
        headers: { 
          'apikey': CONFIG.supabaseKey, 
          'Authorization': `Bearer ${CONFIG.supabaseKey}`
        }
      });
      if (!res.ok && res.status !== 204) throw new Error(`HTTP ${res.status}`);
      return { success: true };
    } catch (e) {
      console.error(`API DELETE error (${tabla}):`, e);
      return { success: false, error: e.message };
    }
  }
};

// ============================================
// HELPERS DE VALIDACIÓN Y UTILIDADES
// ============================================

export const Utils = {
  validarEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  validarCodigoLicencia(codigo) {
    return /^CNT-[A-Z0-9]{4}-[A-Z0-9]{4}$/i.test(codigo);
  },

  generarCodigoLicencia() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let c = 'CNT-';
    for (let i = 0; i < 4; i++) c += chars[Math.floor(Math.random() * chars.length)];
    c += '-';
    for (let i = 0; i < 4; i++) c += chars[Math.floor(Math.random() * chars.length)];
    return c;
  },

  generarPassword(length = 8) {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
    let p = '';
    for (let i = 0; i < length; i++) p += chars[Math.floor(Math.random() * chars.length)];
    return p;
  },

  async hashPassword(password) {
    const encoder = new TextEncoder();
    const salt = 'ConteoApp_Salt_2026';
    const data = encoder.encode(password + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  },

  exportarCSV(data, filename, columns) {
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
};