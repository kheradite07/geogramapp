import type { CapacitorConfig } from '@capacitor/cli';

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
  }
};

export default config;
