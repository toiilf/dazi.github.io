// sw.js - Service Worker 缓存策略

const CACHE_NAME = 'xiaohe-shuangpin-v1';
const OFFLINE_URLS = [
  'index.html',
  'pin.html',
  'wenzhang.html',
  'manifest.json'
];

// 安装阶段：缓存核心资源
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: 缓存资源');
        return cache.addAll(OFFLINE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

// 激活阶段：清理旧缓存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: 删除旧缓存', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 拦截请求：优先使用缓存，回退到网络
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 缓存命中，返回缓存
        if (response) {
          return response;
        }
        // 否则发起网络请求
        return fetch(event.request).then(networkResponse => {
          // 只缓存同源的成功响应
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        }).catch(() => {
          // 网络请求失败时，如果是导航请求，返回离线页面
          if (event.request.mode === 'navigate') {
            return caches.match('index.html');
          }
          return new Response('网络连接失败，请稍后重试', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      })
  );
});