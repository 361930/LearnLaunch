module.exports = {
  globDirectory: "dist/",
  globPatterns: [
    "**/*.{html,js,css,png,jpg,jpeg,gif,svg,woff,woff2,ttf,eot,ico,json}"
  ],
  swDest: "dist/service-worker.js",
  clientsClaim: true,
  skipWaiting: true,
  // Copy offline page from client/public to dist during build
  // We'll need to ensure this file is copied during the build process
  offlineGoogleAnalytics: false,
  // Define a navigation route fallback for offline access
  navigateFallback: '/offline.html',
  navigateFallbackDenylist: [/^\/api\//], // Don't use fallback for API routes
  // Cache images with a longer expiration
  runtimeCaching: [
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/,
      handler: "CacheFirst",
      options: {
        cacheName: "images",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
        }
      }
    },
    {
      urlPattern: /\.(?:css|js)$/,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "static-resources",
        expiration: {
          maxEntries: 30,
          maxAgeSeconds: 7 * 24 * 60 * 60 // 7 days
        }
      }
    },
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com/,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "google-fonts-stylesheets"
      }
    },
    {
      urlPattern: /^https:\/\/fonts\.gstatic\.com/,
      handler: "CacheFirst",
      options: {
        cacheName: "google-fonts-webfonts",
        expiration: {
          maxEntries: 30,
          maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
        }
      }
    },
    // Cache API responses for classes, challenges, etc.
    {
      urlPattern: /\/api\/(classes|challenges|users)/,
      handler: "NetworkFirst",
      options: {
        cacheName: "api-responses",
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 24 * 60 * 60 // 24 hours
        },
        // Only cache successful responses
        matchOptions: {
          statuses: [0, 200]
        }
      }
    },
    // Special handling for HTML pages to cache after first visit
    {
      urlPattern: /\/(?:challenges|auth|teacher|student|profile)\/.*$/,
      handler: "NetworkFirst",
      options: {
        cacheName: "pages-cache",
        networkTimeoutSeconds: 5,
        expiration: {
          maxEntries: 25,
          maxAgeSeconds: 7 * 24 * 60 * 60 // 7 days
        }
      }
    }
  ]
};