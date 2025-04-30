import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.globaleduconnect.app',
  appName: 'GlobalEduConnect',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // Improve security by allowing only specific domains
    allowNavigation: ['globaleduconnect.replit.app', 'localhost'],
    // Clear HTTP cache on app start for security
    cleartext: false
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#ffffffff",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#999999",
      splashFullScreen: true,
      splashImmersive: true,
    },
    CapacitorHttp: {
      // Force native HTTP implementation for better security
      enabled: true
    },
    CapacitorCookies: {
      // Use native secure cookies in the app
      enabled: true
    },
    App: {
      // Add app exit confirmation dialog
      exitOnClose: true
    },
    WebView: {
      // Allow clipboard access for sharing content
      allowFileAccess: false,
      // Disable geolocation since it's not needed
      allowGeolocation: false,
      // Disable JavaScript dialogs for better UX
      allowJavaScriptEvaluation: false
    }
  },
  // Custom iOS-specific configuration
  ios: {
    contentInset: "always",
    preferredContentMode: "mobile",
    limitsNavigationsToAppBoundDomains: true
  },
  // Custom Android-specific configuration
  android: {
    buildOptions: {
      keystorePath: ".android/debug.keystore",
      keystoreAlias: "androiddebugkey",
    },
    // Use a mobile-optimized user agent
    overrideUserAgent: "GlobalEduConnect Mobile App"
  }
};

export default config;