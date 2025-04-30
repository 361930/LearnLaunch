import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { registerServiceWorker, checkOnlineStatus } from "./service-worker-registration";
import ErrorBoundary from "@/components/error-boundary";

// Register service worker for offline capabilities and mobile PWA support
if (import.meta.env.PROD) {
  registerServiceWorker();
}

// Check initial online status
checkOnlineStatus();

// Add offline detection styles to the document
const offlineStyles = document.createElement('style');
offlineStyles.textContent = `
  body.offline .online-only {
    display: none !important;
  }
  
  body:not(.offline) .offline-only {
    display: none !important;
  }
  
  body.offline .requires-connection {
    opacity: 0.5;
    pointer-events: none;
  }
  
  body.offline .offline-banner {
    display: flex !important;
  }
  
  .offline-banner {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background-color: #f59e0b;
    color: white;
    text-align: center;
    padding: 8px;
    font-weight: 500;
    z-index: 50;
  }
  
  @media (prefers-color-scheme: dark) {
    .offline-banner {
      background-color: #78350f;
    }
  }
`;
document.head.appendChild(offlineStyles);

// Add offline banner to notify users
const offlineBanner = document.createElement('div');
offlineBanner.className = 'offline-banner';
offlineBanner.textContent = 'You are currently offline. Some features may be limited.';
document.body.appendChild(offlineBanner);

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <App />
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);
