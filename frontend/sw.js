const CACHE_NAME = 'crav-v2';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/assets/style.css',
    '/assets/icon.png',
    '/app.js',
    '/manifest.json',

    // Utils
    '/utils/store.js',
    '/utils/apiService.js',
    '/utils/router.js',

    // Components
    '/components/Navbar.js',
    '/components/RestaurantCard.js',
    '/components/MenuItem.js',
    '/components/CartItem.js',
    '/components/ReviewForm.js',

    // Pages - Customer
    '/pages/customer/CustomerHomePage.js',
    '/pages/customer/CustomerLoginPage.js',
    '/pages/customer/CustomerRegisterPage.js',
    '/pages/customer/CustomerRestaurantDetailPage.js',
    '/pages/customer/CustomerCartPage.js',
    '/pages/customer/CustomerCheckOutPage.js',
    '/pages/customer/CustomerOrderHistoryPage.js',
    '/pages/customer/CustomerOrderDetailPage.js',
    '/pages/customer/CustomerProfilePage.js',
    '/pages/customer/CustomerFavoritesPage.js',
    '/pages/customer/CustomerRewardsPage.js',
    '/pages/customer/CustomerReviewPage.js',

    // External dependencies (optional but helpful if you want full offline)
    'https://cdn.jsdelivr.net/npm/vue@2.7.16/dist/vue.js',
    'https://unpkg.com/vue-router@3/dist/vue-router.js',
    'https://unpkg.com/vuex@3.0.0',
    'https://cdn.jsdelivr.net/npm/bootstrap@4.3.1/dist/css/bootstrap.min.css',
    'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap'
];

// Install event - caching basic assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('SW: Opening cache and adding assets');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// Activate event - cleaning up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('SW: Deleting old cache', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});

// Fetch event - Network-first strategy for JS/CSS/HTML, Cache-first for images
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Helper to determine strategy
    if (event.request.method !== 'GET') return;

    // Special handling for API calls - always network only
    if (url.pathname.startsWith('/api/')) return;

    event.respondWith(
        fetch(event.request)
            .then(response => {
                // If it's a valid response, cache it and return
                if (response && response.status === 200 && response.type === 'basic') {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return response;
            })
            .catch(() => {
                // If network fails, try the cache
                return caches.match(event.request);
            })
    );
});
