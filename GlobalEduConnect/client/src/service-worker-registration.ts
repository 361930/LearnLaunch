// This file handles the registration of the service worker for offline capabilities

// Function to register the service worker
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then(registration => {
          console.log('Service Worker registered with scope:', registration.scope);
          
          // Check for updates when the page loads
          registration.update();
          
          // Listen for updates to trigger UI notifications
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // At this point, a new service worker has been installed and is waiting to activate
                  // We could notify the user that they can refresh to see the new version
                  console.log('New content is available; please refresh the page to use it.');
                  // This is where you could display a toast or notification to the user
                  // about the available update
                }
              });
            }
          });
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
        });
      
      // Detect when the user goes offline
      window.addEventListener('online', () => {
        document.body.classList.remove('offline');
        console.log('App is online');
      });
      
      window.addEventListener('offline', () => {
        document.body.classList.add('offline');
        console.log('App is offline');
      });
    });
  } else {
    console.log('Service workers are not supported in this browser.');
  }
}

// Function to unregister all service workers
export function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      for (const registration of registrations) {
        registration.unregister();
      }
    });
  }
}

// Check if the user is online or offline initially
export function checkOnlineStatus() {
  if (!navigator.onLine) {
    document.body.classList.add('offline');
  }
}