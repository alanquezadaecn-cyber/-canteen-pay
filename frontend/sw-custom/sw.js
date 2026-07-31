// Service worker mínimo: SOLO maneja notificaciones push. Deliberadamente NO tiene
// listener de 'fetch' — nunca intercepta ni cachea peticiones, para no repetir el
// bug de pantallas en blanco por contenido viejo servido offline (ver commit que
// introdujo el SW autodestructivo). Este archivo reemplaza al generado por
// vite-plugin-pwa después de cada build (ver deploy).

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'CashFood', body: event.data ? event.data.text() : '' };
  }
  const title = data.title || 'CashFood';
  const options = {
    body: data.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: { url: data.url || '/' }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsArr) => {
      const existing = clientsArr.find((c) => c.url.includes(self.location.origin));
      if (existing) {
        existing.focus();
        if ('navigate' in existing) existing.navigate(url);
        return;
      }
      return self.clients.openWindow(url);
    })
  );
});
