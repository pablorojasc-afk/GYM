const CACHE_NAME = 'gym-app-v3.0';
const APP_PREFIX = '/GYM/';
const urlsToCache = [
  `${APP_PREFIX}`,
  `${APP_PREFIX}index.html`,
  `${APP_PREFIX}manifest.json`
];

// Instalar Service Worker
self.addEventListener('install', event => {
  console.log('🔄 Instalando Service Worker para GYM app');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('✅ Cache abierto:', CACHE_NAME);
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('✅ Todos los recursos cacheados');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('❌ Error al cachear:', error);
      })
  );
});

// Activar Service Worker
self.addEventListener('activate', event => {
  console.log('🔄 Activando Service Worker');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Eliminando cache viejo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker activado');
      return self.clients.claim();
    })
  );
});

// Interceptar solicitudes
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);
  
  // Solo manejar solicitudes de nuestra app
  if (!requestUrl.pathname.startsWith(APP_PREFIX) && 
      !requestUrl.href.includes('pablorojasc-afk.github.io/GYM')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Si está en cache, devolverlo
        if (cachedResponse) {
          console.log('✅ Sirviendo desde cache:', event.request.url);
          return cachedResponse;
        }
        
        // Si no está en cache, hacer fetch
        console.log('🌐 Haciendo fetch:', event.request.url);
        return fetch(event.request)
          .then(networkResponse => {
            // Solo cachear respuestas exitosas
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            
            // Clonar respuesta para cache
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
                console.log('💾 Guardado en cache:', event.request.url);
              });
            
            return networkResponse;
          })
          .catch(error => {
            console.log('❌ Error en fetch:', error);
            
            // Si es una navegación, devolver la página principal
            if (event.request.mode === 'navigate') {
              return caches.match(`${APP_PREFIX}index.html`);
            }
            
            return new Response('Error de conexión', {
              status: 408,
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});

// Manejar mensajes
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
