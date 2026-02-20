import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize, KeyboardStyle } from '@capacitor/keyboard';

const config: CapacitorConfig = {
  appId: 'com.geogram.app',
  appName: 'geogram',
  webDir: 'out',
  backgroundColor: '#1a0033', // Phase 3: solid background to prevent WebView compositor overdraw on WebGL
  server: {

    url: 'https://192.168.111.13:3001',
    cleartext: true,
    androidScheme: 'https',
    allowNavigation: [
      'geogramapp.vercel.app',
      '192.168.111.13',
      'accounts.google.com',
      '*.google.com',
      '*.googleusercontent.com'
    ]
  },
  android: {
    overrideUserAgent: "Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36"
  },
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      forceCodeForRefreshToken: true,
    },
    Keyboard: {
      resize: KeyboardResize.Body,
      style: KeyboardStyle.Dark,
      resizeOnFullScreen: true,
    },
    SplashScreen: {
      backgroundColor: '#1a0033',
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      splashImmersive: true,
      launchShowDuration: 3000,
    },
  }
};

export default config;
