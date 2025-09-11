// Service Worker avancé pour ChantierPro
// Fonctionnalités offline complètes avec synchronisation de données

const CACHE_VERSION = 'v1.2.0';
const CACHE_NAMES = {
  STATIC: `chantierpro-static-${CACHE_VERSION}`,
  DYNAMIC: `chantierpro-dynamic-${CACHE_VERSION}`,
  OFFLINE: `chantierpro-offline-${CACHE_VERSION}`,
  IMAGES: `chantierpro-images-${CACHE_VERSION}`,
  API: `chantierpro-api-${CACHE_VERSION}`
};

const OFFLINE_PAGES = [
  '/dashboard',
  '/dashboard/chantiers',
  '/dashboard/messages',
  '/offline'
];

const OFFLINE_FALLBACK = '/offline';

// URLs à mettre en cache au démarrage
const STATIC_RESOURCES = [
  '/',
  '/dashboard',
  '/dashboard/chantiers',
  '/dashboard/messages',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Configuration de synchronisation de fond
const SYNC_TAGS = {
  CHANTIERS: 'sync-chantiers',
  MESSAGES: 'sync-messages',
  DOCUMENTS: 'sync-documents'
};

// Installation du Service Worker
self.addEventListener('install', event => {
  console.log('[SW] Installation...');
  
  event.waitUntil(
    caches.open(CACHE_NAMES.STATIC)
      .then(cache => {
        console.log('[SW] Mise en cache des ressources statiques');
        return cache.addAll(STATIC_RESOURCES);
      })
      .then(() => {
        console.log('[SW] Installation terminée');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[SW] Erreur installation:', error);
      })
  );
});

// Activation du Service Worker
self.addEventListener('activate', event => {
  console.log('[SW] Activation...');
  
  event.waitUntil(
    Promise.all([
      // Nettoyer les anciens caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (!Object.values(CACHE_NAMES).includes(cacheName)) {
              console.log('[SW] Suppression ancien cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Prendre le contrôle immédiatement
      self.clients.claim()
    ])
  );
});

// Intercepter les requêtes réseau
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer les requêtes non-HTTP
  if (!request.url.startsWith('http')) return;

  // Stratégies de cache selon le type de requête
  if (request.method === 'GET') {
    if (url.pathname.startsWith('/api/mobile/')) {
      // API mobile - Cache avec fallback offline
      event.respondWith(handleMobileAPI(request));
    } else if (url.pathname.startsWith('/api/')) {
      // Autres APIs - Network first avec cache de sauvegarde
      event.respondWith(handleAPI(request));
    } else if (request.destination === 'image') {
      // Images - Cache first
      event.respondWith(handleImages(request));
    } else if (url.pathname.startsWith('/_next/')) {
      // Assets Next.js - Cache first
      event.respondWith(handleStaticAssets(request));
    } else {
      // Pages - Network first avec fallback offline
      event.respondWith(handlePages(request));
    }
  } else if (request.method === 'POST' && url.pathname.startsWith('/api/mobile/')) {
    // POST vers API mobile - gérer l'offline
    event.respondWith(handleMobileAPIPOST(request));
  }
});

// Gestion des APIs mobile avec support offline
async function handleMobileAPI(request) {
  const url = new URL(request.url);
  const cacheKey = `${url.pathname}${url.search}`;
  
  try {
    // Essayer le réseau d'abord
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Mettre en cache la réponse réussie
      const cache = await caches.open(CACHE_NAMES.API);
      cache.put(cacheKey, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
  } catch (error) {
    console.log('[SW] Réseau indisponible pour API mobile, utilisation du cache');
    
    // Essayer le cache
    const cachedResponse = await caches.match(cacheKey);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback pour données offline
    return new Response(JSON.stringify({
      offline: true,
      error: 'Mode hors ligne - données limitées',
      data: await getOfflineData(url.pathname)
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Gestion des POST mobile en mode offline
async function handleMobileAPIPOST(request) {
  try {
    // Essayer d'envoyer immédiatement
    const response = await fetch(request.clone());
    return response;
  } catch (error) {
    console.log('[SW] POST en mode offline, mise en queue');
    
    // Stocker la requête pour synchronisation ultérieure
    await storeOfflineRequest(request);
    
    // Programmer une synchronisation de fond
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      await self.registration.sync.register('background-sync');
    }
    
    return new Response(JSON.stringify({
      success: true,
      offline: true,
      message: 'Action enregistrée, sera synchronisée lors de la reconnexion'
    }), {
      status: 202,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Gestion des APIs standards
async function handleAPI(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAMES.API);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response(JSON.stringify({
      error: 'Service indisponible'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Gestion des images
async function handleImages(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAMES.IMAGES);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Fallback image pour mode offline
    return new Response('', { status: 404 });
  }
}

// Gestion des assets statiques
async function handleStaticAssets(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAMES.STATIC);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return new Response('', { status: 404 });
  }
}

// Gestion des pages
async function handlePages(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAMES.DYNAMIC);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Essayer le cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Page offline de fallback
    return caches.match(OFFLINE_FALLBACK);
  }
}

// Synchronisation de fond
self.addEventListener('sync', event => {
  console.log('[SW] Synchronisation de fond:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(syncOfflineRequests());
  }
});

// Stocker une requête offline
async function storeOfflineRequest(request) {
  const offlineRequests = await getOfflineRequests();
  const requestData = {
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body: request.method !== 'GET' ? await request.text() : null,
    timestamp: Date.now()
  };
  
  offlineRequests.push(requestData);
  await setOfflineRequests(offlineRequests);
}

// Synchroniser les requêtes offline
async function syncOfflineRequests() {
  const offlineRequests = await getOfflineRequests();
  const syncedRequests = [];
  
  for (const requestData of offlineRequests) {
    try {
      const request = new Request(requestData.url, {
        method: requestData.method,
        headers: requestData.headers,
        body: requestData.body
      });
      
      const response = await fetch(request);
      
      if (response.ok) {
        syncedRequests.push(requestData);
        console.log('[SW] Requête synchronisée:', requestData.url);
      }
    } catch (error) {
      console.error('[SW] Erreur synchronisation:', error);
    }
  }
  
  // Retirer les requêtes synchronisées
  const remainingRequests = offlineRequests.filter(req => 
    !syncedRequests.includes(req)
  );
  await setOfflineRequests(remainingRequests);
  
  // Notifier l'application
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({
      type: 'SYNC_COMPLETE',
      syncedCount: syncedRequests.length,
      remainingCount: remainingRequests.length
    });
  });
}

// Utilitaires pour le stockage IndexedDB
async function getOfflineRequests() {
  try {
    const data = await getFromIndexedDB('offlineRequests');
    return data || [];
  } catch (error) {
    console.error('[SW] Erreur lecture IndexedDB:', error);
    return [];
  }
}

async function setOfflineRequests(requests) {
  try {
    await setInIndexedDB('offlineRequests', requests);
  } catch (error) {
    console.error('[SW] Erreur écriture IndexedDB:', error);
  }
}

async function getOfflineData(pathname) {
  // Retourner des données par défaut selon le endpoint
  const defaultData = {
    '/api/mobile/chantiers': { data: [], offline: true },
    '/api/mobile/messages': { data: [], offline: true }
  };
  
  return defaultData[pathname] || { data: null, offline: true };
}

// Fonctions IndexedDB simplifiées
function getFromIndexedDB(key) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ChantierProCache', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');
      const getRequest = store.get(key);
      
      getRequest.onsuccess = () => resolve(getRequest.result?.value);
      getRequest.onerror = () => reject(getRequest.error);
    };
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('cache')) {
        db.createObjectStore('cache', { keyPath: 'key' });
      }
    };
  });
}

function setInIndexedDB(key, value) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ChantierProCache', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const putRequest = store.put({ key, value });
      
      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);
    };
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('cache')) {
        db.createObjectStore('cache', { keyPath: 'key' });
      }
    };
  });
}

// Messages push
self.addEventListener('push', event => {
  console.log('[SW] Notification push reçue');
  
  const options = {
    body: 'Nouveau message ChantierPro',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Voir le message',
        icon: '/icons/icon-96x96.png'
      },
      {
        action: 'close',
        title: 'Fermer',
        icon: '/icons/icon-96x96.png'
      }
    ]
  };
  
  if (event.data) {
    const payload = event.data.json();
    options.body = payload.body || options.body;
    options.title = payload.title || 'ChantierPro';
  }
  
  event.waitUntil(
    self.registration.showNotification('ChantierPro', options)
  );
});

// Clic sur notification
self.addEventListener('notificationclick', event => {
  console.log('[SW] Clic sur notification');
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/dashboard/messages')
    );
  }
});

console.log('[SW] Service Worker ChantierPro v' + CACHE_VERSION + ' démarré');