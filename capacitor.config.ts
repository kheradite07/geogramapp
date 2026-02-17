import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize, KeyboardStyle } from '@capacitor/keyboard';

const config: CapacitorConfig = {
  appId: 'com.geogram.app',
  appName: 'geogram',
  webDir: 'out',
  server: {
    url: 'https://geogramapp.vercel.app',
    cleartext: true,
    androidScheme: 'https',
    allowNavigation: [
      'geogramapp.vercel.app',
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
