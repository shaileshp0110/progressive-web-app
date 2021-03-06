// Load the sw-toolbox library.
importScripts('./js/idb-keyval.js');

const cacheName = 'latestNews-v17';
const offlineUrl = '/offline';

// Cache our known resources during install
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(cacheName)
    .then(cache => cache.addAll([
      './js/main.js',
      './js/article.js',
      './js/push.js',
      './js/contact.js',
      './images/newspaper.svg',
      'manifest.json',
      './images/icon-60.png',
      './images/icon-114.png',
      './images/icon-152.png',
      './css/site.css',
      './data/latest.json',
      './data/data-1.json',
      './article',
      './contact',
      './',
      offlineUrl
    ])).then(function() {
      console.log('[ServiceWorker] Skip waiting on install');
      return self.skipWaiting();
    }
    )
  );
});


// self.addEventListener('install', function(event) {
//   event.waitUntil(
// 	caches.open('my-cache').then(function(cache) {
//         // Important to `return` the promise here to have `skipWaiting()`
//         // fire after the cache has been updated.
//         return cache.addAll([/* file1.jpg, file2.png, ... */]);
//     }).then(function() {
//       // `skipWaiting()` forces the waiting ServiceWorker to become the
//       // active ServiceWorker, triggering the `onactivate` event.
//       // Together with `Clients.claim()` this allows a worker to take effect
//       // immediately in the client(s).
//       return self.skipWaiting();
//     })
//   );
// });

// Activate event
// Be sure to call self.clients.claim()
self.addEventListener('activate', function(event) {
	// `claim()` sets this worker as the active worker for all clients that
	// match the workers scope and triggers an `oncontrollerchange` event for
  // the clients.
  event.waitUntil(
		caches.keys().then(function(keyList) {
			return Promise.all(keyList.map(function(key) {
				if (key !== cacheName) {
					console.log('[ServiceWorker] Removing old cache...', key);
					return caches.delete(key);
				}
			}));
		})
	);
	return self.clients.claim();
});

// Handle network delays
function timeout(delay) {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      resolve(new Response('', {
        status: 408,
        statusText: 'Request timed out.'
      }));
    }, delay);
  });
}

function resolveFirstPromise(promises) {
  return new Promise((resolve, reject) => {

    promises = promises.map(p => Promise.resolve(p));

    promises.forEach(p => p.then(resolve));

    promises.reduce((a, b) => a.catch(() => b))
    .catch(() => reject(Error("All failed")));
  });
};

self.addEventListener('fetch', function(event) {

  // Check for the googleapis domain
  if (/googleapis/.test(event.request.url)) {
    event.respondWith(
      resolveFirstPromise([
        timeout(500),
        fetch(event.request)
      ])
    );
  } else {

    // Else process all other requests as expected
    event.respondWith(
      caches.match(event.request)
      .then(function(response) {
        if (response) {
          return response;
        }
        var fetchRequest = event.request.clone();

        fetch(fetchRequest).then(
          function(response) {
            if(!response || response.status !== 200) {
              return response;
            }

            var responseToCache = response.clone();
            caches.open(cacheName)
            .then(function(cache) {
              cache.put(event.request, responseToCache);
            });

            return response;
          }
        ).catch(error => {
          // Check if the user is offline first and is trying to navigate to a web page
          if (event.request.method === 'GET' && event.request.headers.get('accept').includes('text/html')) {
            // Return the offline page
            caches.match(offlineUrl);
          }
        });
      })
    )}
  });

// The sync event for the contact form
self.addEventListener('sync', function (event) {
  if (event.tag === 'contact-email') {
    event.waitUntil(
      idbKeyval.get('sendMessage').then(value =>
        fetch('/sendMessage/', {
          method: 'POST',
          headers: new Headers({ 'content-type': 'application/json' }),
          body: JSON.stringify(value)
        })));

        // Remove the value from the DB
        idbKeyval.delete('sendMessage');
    }
});


self.addEventListener('push', function (event) {

  var payload = event.data ? JSON.parse(event.data.text()) : 'no payload';

  var title = 'Progressive Times';

  // Determine the type of notification to display
  if (payload.type === 'register') {
    event.waitUntil(
      self.registration.showNotification(title, {
        body: payload.msg,
        url: payload.url,
        icon: payload.icon
      })
    );
  } else if (payload.type === 'actionMessage') {
    event.waitUntil(
      self.registration.showNotification(title, {
        body: payload.msg,
        url: payload.url,
        icon: payload.icon,
        actions: [
          { action: 'voteup', title: '👍 Vote Up' },
          { action: 'votedown', title: '👎 Vote Down' }]
      })
    );
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  // Check if any actions were added
  if (event.action === 'voteup') {
    clients.openWindow('/voteup');
  }
  else if (event.action === 'voteup') {
    clients.openWindow('/votedown');
  }
  else {
    clients.openWindow('/');
  }
}, false);



