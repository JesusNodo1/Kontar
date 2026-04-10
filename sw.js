const CACHE_NAME = 'conteo-v4';
const DATA_CACHE = 'conteo-data-v2';
const API_QUEUE = 'conteo-queue-v2';
const VERSION = 'v=4';

const STATIC_ASSETS = [
  '/Contador.html',
  '/login.html',
  '/admin.html',
  '/styles.css',
  '/manifest.json',
  'https://cdn.jsdelivr.net/npm/react@18.3.1/+esm',
  'https://cdn.jsdelivr.net/npm/react-dom@18.3.1/client/+esm',
  'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap'
];

const DB_NAME = 'ConteoOfflineDB';
const DB_VERSION = 2;

let db = null;

function openDB() {
  return new Promise((resolve, reject) => {
    if (db) return resolve(db);
    
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => { db = request.result; resolve(db); };
    
    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      
       if (!database.objectStoreNames.contains('sesion')) {
         database.createObjectStore('sesion', { keyPath: 'id' });
       }
       if (!database.objectStoreNames.contains('licencias')) {
         database.createObjectStore('licencias', { keyPath: 'id' });
       }
       if (!database.objectStoreNames.contains('inventarios')) {
         database.createObjectStore('inventarios', { keyPath: 'id' });
       }

      if (!database.objectStoreNames.contains('zonas')) {
        database.createObjectStore('zonas', { keyPath: 'id' });
      }
      if (!database.objectStoreNames.contains('productos')) {
        database.createObjectStore('productos', { keyPath: 'id' });
      }
       if (!database.objectStoreNames.contains('conteo_producto')) {
         database.createObjectStore('conteo_producto', { keyPath: 'id', autoIncrement: true });
       }

      if (!database.objectStoreNames.contains('queue')) {
        const queueStore = database.createObjectStore('queue', { keyPath: 'id', autoIncrement: true });
        queueStore.createIndex('timestamp', 'timestamp');
      }
      if (!database.objectStoreNames.contains('metadata')) {
        database.createObjectStore('metadata', { keyPath: 'key' });
      }
    };
  });
}

async function dbGet(storeName, key) {
  try {
    const database = await openDB();
    if (!database.objectStoreNames.contains(storeName)) {
      return null;
    }
    return new Promise((resolve) => {
      const tx = database.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    });
  } catch (e) {
    return null;
  }
}

async function dbGetAll(storeName) {
  try {
    const database = await openDB();
    if (!database.objectStoreNames.contains(storeName)) {
      return [];
    }
    return new Promise((resolve, reject) => {
      const tx = database.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve([]);
    });
  } catch (e) {
    return [];
  }
}

async function dbPut(storeName, data) {
  try {
    const database = await openDB();
    if (!database.objectStoreNames.contains(storeName)) {
      return null;
    }
    return new Promise((resolve) => {
      const tx = database.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.put(data);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    });
  } catch (e) {
    return null;
  }
}

async function dbDelete(storeName, key) {
  try {
    const database = await openDB();
    if (!database.objectStoreNames.contains(storeName)) {
      return;
    }
    const tx = database.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).delete(key);
  } catch (e) {}
}

async function dbClear(storeName) {
  try {
    const database = await openDB();
    if (!database.objectStoreNames.contains(storeName)) {
      return;
    }
    const tx = database.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).clear();
  } catch (e) {}
}

async function addToQueue(operation) {
  const queueItem = {
    ...operation,
    timestamp: Date.now(),
    synced: false
  };
  return await dbPut('queue', queueItem);
}

async function getPendingQueue() {
  const items = await dbGetAll('queue');
  return items.filter(item => !item.synced).sort((a, b) => a.timestamp - b.timestamp);
}

async function markQueueItemSynced(id) {
  const item = await dbGet('queue', id);
  if (item) {
    item.synced = true;
    item.syncedAt = Date.now();
    await dbPut('queue', item);
  }
}

async function processQueue(supabaseUrl, supabaseKey) {
  const pending = await getPendingQueue();
  
  for (const item of pending) {
    try {
      const { method, tabla, params, data } = item;
      
      let url = `${supabaseUrl}/rest/v1/${tabla}`;
      if (params) url += params;
      
      const fetchOptions = {
        method: method || 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      };
      
      if (data && (method === 'POST' || method === 'PATCH')) {
        fetchOptions.body = JSON.stringify(data);
      }
      
      const response = await fetch(url, fetchOptions);
      
      if (response.ok) {
        await markQueueItemSynced(item.id);
        
        self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'SYNC_COMPLETE',
              id: item.id,
              success: true
            });
          });
        });
      }
    } catch (error) {
      console.log('Queue item failed, will retry:', item.id, error);
    }
  }
  
  const remaining = await getPendingQueue();
  if (remaining.length > 0) {
    self.registration.sync.register('sync-queue');
  }
}

self.addEventListener('install', event => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS)),
      openDB()
    ])
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name.startsWith('conteo-'))
            .map(name => caches.delete(name))
        );
      }),
      openDB()
    ])
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // 1. Interceptar peticiones a la API de Supabase primero, independientemente del origen
  if (url.pathname.includes('/rest/v1/')) {
    event.respondWith(handleApiRequest(event.request));
    return;
  }

  // 2. Para todo lo demás, si es otro dominio, dejar que el navegador lo maneje
  if (url.origin !== location.origin) {
    return; 
  }
  
  // 3. Solo cachear archivos locales del mismo dominio
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
      .catch(err => {
        console.error('Fetch failed in SW:', err);
        return new Response('Offline: asset not cached', { status: 503 });
      })
  );
});


async function handleApiRequest(request) {
  const url = new URL(request.url);
  const method = request.method;
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok && method === 'GET') {
      const responseClone = networkResponse.clone();
      const data = await responseClone.json();
      
      const tabla = url.pathname.split('/').pop().split('?')[0];
      if (data && Array.isArray(data)) {
        const db = await openDB();
        const tx = db.transaction(tabla, 'readwrite');
        const store = tx.objectStore(tabla);
        
        if (tabla === 'conteo_producto') {
          for (const item of data) {
            await new Promise((resolve, reject) => {
              const req = store.put({ ...item, _cached: Date.now() });
              req.onsuccess = resolve;
              req.onerror = reject;
            });
          }
        } else {
          for (const item of data) {
            await new Promise((resolve, reject) => {
              const req = store.put(item);
              req.onsuccess = resolve;
              req.onerror = reject;
            });
          }
        }
        
        await new Promise((resolve, reject) => {
          tx.oncomplete = resolve;
          tx.onerror = reject;
        });
      }
      
      return networkResponse;
    }
    
    return networkResponse;
  } catch (error) {
    if (method === 'GET') {
      const tabla = url.pathname.split('/').pop().split('?')[0];
      const cachedData = await dbGetAll(tabla);
      
      if (cachedData && cachedData.length > 0) {
        const filtered = cachedData.filter(item => {
          if (url.searchParams.has('zona_id')) {
            return item.zona_id === url.searchParams.get('zona_id').replace('eq.', '');
          }
          if (url.searchParams.has('inventario_id')) {
            return item.inventario_id === url.searchParams.get('inventario_id').replace('eq.', '');
          }
          if (url.searchParams.has('licencia_id')) {
            return item.licencia_id === url.searchParams.get('licencia_id').replace('eq.', '');
          }
          return true;
        });
        
        return new Response(JSON.stringify(filtered), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    if (method === 'POST' || method === 'PATCH') {
      try {
        const body = await request.clone().json();
        
        const tabla = url.pathname.split('/').pop().split('?')[0];
        const params = url.search;
        
        await addToQueue({
          method,
          tabla,
          params: params || '',
          data: body
        });
        
        const localItem = {
          ...body,
          id: body.id || ('temp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)),
          _pendingSync: true
        };
        
         if (tabla === 'conteo_producto') {
           await dbPut('conteo_producto', localItem);

        }
        
        self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'OFFLINE_SAVE',
              tabla,
              data: localItem
            });
          });
        });
        
        return new Response(JSON.stringify([localItem]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (e) {
        console.error('Queue error:', e);
      }
    }
    
    return new Response(JSON.stringify({ error: 'offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SYNC_NOW') {
    const { supabaseUrl, supabaseKey } = event.data;
    processQueue(supabaseUrl, supabaseKey);
  }
  
  if (event.data && event.data.type === 'CLEAR_OFFLINE_DATA') {
    clearAllOfflineData();
  }
});

async function clearAllOfflineData() {
  try {
    const database = await openDB();
    const stores = ['inventarios', 'zonas', 'productos', 'conteo_producto', 'queue', 'sesion', 'metadata'];
    
    for (const storeName of stores) {
      if (database.objectStoreNames.contains(storeName)) {
        const tx = database.transaction(storeName, 'readwrite');
        tx.objectStore(storeName).clear();
      }
    }
    
    console.log('All offline data cleared');
    
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({ type: 'OFFLINE_DATA_CLEARED' });
      });
    });
  } catch (e) {
    console.error('Error clearing offline data:', e);
  }
}

self.addEventListener('sync', event => {
  if (event.tag === 'sync-queue') {
    event.waitUntil(
      processQueue(
        'https://jeupnfxzawgrtddnhvij.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpldXBuZnh6YXdncnRkZG5odmlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0ODY5NTgsImV4cCI6MjA5MTA2Mjk1OH0.qmABLeL-3iJ3f6l7GdDnEshweuUtSM5YRSTSzby9N0g'
      )
    );
  }
});

self.addEventListener('offline-indicator', event => {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({ type: 'OFFLINE_STATUS', online: false });
    });
  });
});
